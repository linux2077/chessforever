import { createFileRoute } from "@tanstack/react-router";

// Daily self-test of the live mode. Only touches the test room it creates itself.
export const Route = createFileRoute("/api/public/hooks/debug-online")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!request.headers.get("authorization")?.startsWith("Bearer "))
          return new Response("Unauthorized", { status: 401 });
        const parisHour = Number(
          new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(new Date()),
        );
        const force = new URL(request.url).searchParams.has("force");
        if (parisHour !== 6 && !force) return Response.json({ skipped: true, parisHour });

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const { Chess } = await import("chess.js");
        const report: Record<string, unknown> = { at: new Date().toISOString() };
        const t0 = Date.now();
        const code = `T${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { data: g, error } = await db
          .from("online_games")
          .insert({ code, white_token: crypto.randomUUID(), black_token: crypto.randomUUID(), status: "playing" })
          .select("id, fen")
          .single();
        if (error || !g) {
          report.ok = false;
          report.error = "create failed";
        } else {
          const c = new Chess(g.fen);
          c.move("e4");
          const { data: up } = await db
            .from("online_games")
            .update({ fen: c.fen(), pgn: c.pgn(), last_from: "e2", last_to: "e4" })
            .eq("id", g.id)
            .select("fen")
            .single();
          report.ok = up?.fen === c.fen();
          await db.from("online_games").delete().eq("id", g.id);
        }
        const { count: playing } = await db.from("online_games").select("id", { count: "exact", head: true }).eq("status", "playing");
        const { count: waiting } = await db.from("online_games").select("id", { count: "exact", head: true }).eq("status", "waiting");
        report.playing = playing;
        report.waiting = waiting;
        report.ms = Date.now() - t0;
        console.log("[debug-online]", JSON.stringify(report));
        return Response.json(report);
      },
    },
  },
});
