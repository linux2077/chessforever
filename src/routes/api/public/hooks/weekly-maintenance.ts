import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

// Weekly maintenance (Monday 06:00 Europe/Paris): live-mode self-test,
// repair of stuck rooms, and a stored report. Never returns player tokens.
export const Route = createFileRoute("/api/public/hooks/weekly-maintenance")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", hour12: false,
        }).formatToParts(new Date());
        const weekday = parts.find((p) => p.type === "weekday")?.value;
        const hour = Number(parts.find((p) => p.type === "hour")?.value);
        const force = new URL(request.url).searchParams.has("force");
        if ((weekday !== "Mon" || hour !== 6) && !force) return Response.json({ skipped: true });

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { Chess } = await import("chess.js");
        const errors: string[] = [];

        // 1. Live-mode self-test
        let liveOk = false;
        const code = `W${crypto.randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase()}`;
        const { data: g, error } = await db
          .from("online_games")
          .insert({ code, white_token: crypto.randomUUID(), black_token: crypto.randomUUID(), status: "playing" })
          .select("id, fen")
          .single();
        if (error || !g) errors.push("Création de salon impossible");
        else {
          const c = new Chess(g.fen);
          c.move("e4");
          const { data: up } = await db.from("online_games")
            .update({ fen: c.fen(), pgn: c.pgn(), last_from: "e2", last_to: "e4" })
            .eq("id", g.id).select("fen").single();
          liveOk = up?.fen === c.fen();
          if (!liveOk) errors.push("Coup non enregistré");
          await db.from("online_games").delete().eq("id", g.id);
        }

        // 2. Repair stuck rooms
        const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data: closed, error: e1 } = await db.from("online_games")
          .update({ status: "finished" }).eq("status", "playing").lt("updated_at", dayAgo).select("id");
        if (e1) errors.push("Fermeture des parties bloquées échouée");
        const { data: removed, error: e2 } = await db.from("online_games")
          .delete().eq("status", "waiting").lt("updated_at", dayAgo).select("id");
        if (e2) errors.push("Suppression des salons abandonnés échouée");
        const { data: broken } = await db.from("online_games").select("id, fen").neq("status", "finished").limit(500);
        let invalid = 0;
        for (const row of broken ?? []) {
          try { new Chess(row.fen); } catch {
            invalid++;
            await db.from("online_games").update({ status: "finished" }).eq("id", row.id);
          }
        }

        // 3. Report
        const report = {
          live_ok: liveOk,
          closed_stuck: closed?.length ?? 0,
          removed_waiting: removed?.length ?? 0,
          invalid_fixed: invalid,
          errors,
        };
        await db.from("maintenance_reports").insert(report);
        console.log("[weekly-maintenance]", JSON.stringify(report));
        return Response.json(report);
      },
    },
  },
});
