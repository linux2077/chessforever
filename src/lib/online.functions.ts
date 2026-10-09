import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Chess } from "chess.js";

export type PublicGame = {
  id: string;
  code: string;
  fen: string;
  pgn: string;
  last_from: string | null;
  last_to: string | null;
  status: string;
  base_seconds: number;
  white_clock: number;
  black_clock: number;
  color: "w" | "b" | null;
};

type Row = Omit<PublicGame, "color"> & { white_token: string | null; black_token: string | null };

const token = z.string().uuid();

function toPublic(row: Row, me: string): PublicGame {
  const { white_token, black_token, ...rest } = row;
  const color = white_token === me ? "w" : black_token === me ? "b" : null;
  const { created_at: _c, updated_at: _u, ...pub } = rest as typeof rest & { created_at?: string; updated_at?: string };
  return { ...pub, color };
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export const createOnlineGame = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token, seconds: z.number().int().min(30).max(7200) }))
  .handler(async ({ data }) => {
    const db = await admin();
    for (let i = 0; i < 4; i++) {
      const { data: row, error } = await db
        .from("online_games")
        .insert({
          code: makeCode(),
          white_token: data.token,
          base_seconds: data.seconds,
          white_clock: data.seconds,
          black_clock: data.seconds,
          status: "waiting",
        })
        .select()
        .single();
      if (row && !error) return { game: toPublic(row as Row, data.token), error: null };
    }
    return { game: null, error: "Impossible de créer la partie. Réessaie." };
  });

export const joinOnlineGame = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token, code: z.string().trim().toUpperCase().min(4).max(8) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: found } = await db.from("online_games").select("*").eq("code", data.code).maybeSingle();
    if (!found) return { game: null, error: "Aucune partie avec ce code." };
    const row = found as Row;
    if (row.white_token === data.token || row.black_token === data.token)
      return { game: toPublic(row, data.token), error: null };
    if (row.black_token) return { game: null, error: "Cette partie est déjà complète." };
    const { data: updated } = await db
      .from("online_games")
      .update({ black_token: data.token, status: "playing" })
      .eq("id", row.id)
      .is("black_token", null)
      .select()
      .maybeSingle();
    if (!updated) return { game: null, error: "La place vient d'être prise." };
    return { game: toPublic(updated as Row, data.token), error: null };
  });

export const getOnlineGame = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token, id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("online_games").select("*").eq("id", data.id).maybeSingle();
    if (!row) return { game: null };
    const r = row as Row;
    if (r.white_token !== data.token && r.black_token !== data.token) return { game: null };
    return { game: toPublic(r, data.token) };
  });

export const playOnlineMove = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token,
      id: z.string().uuid(),
      from: z.string().regex(/^[a-h][1-8]$/),
      to: z.string().regex(/^[a-h][1-8]$/),
    }),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("online_games").select("*").eq("id", data.id).maybeSingle();
    if (!row) return { game: null, error: "Partie introuvable." };
    const r = row as Row;
    const color = r.white_token === data.token ? "w" : r.black_token === data.token ? "b" : null;
    if (!color || r.status !== "playing") return { game: null, error: "Coup refusé." };
    const chess = new Chess();
    try {
      if (r.pgn) chess.loadPgn(r.pgn);
      if (chess.fen() !== r.fen) chess.load(r.fen);
    } catch {
      chess.load(r.fen);
    }
    if (chess.turn() !== color) return { game: toPublic(r, data.token), error: "Ce n'est pas ton tour." };
    try {
      chess.move({ from: data.from, to: data.to, promotion: "q" });
    } catch {
      return { game: toPublic(r, data.token), error: "Coup illégal." };
    }
    const { data: updated } = await db
      .from("online_games")
      .update({
        fen: chess.fen(),
        pgn: chess.pgn(),
        last_from: data.from,
        last_to: data.to,
        status: chess.isGameOver() ? "finished" : "playing",
      })
      .eq("id", r.id)
      .eq("fen", r.fen)
      .select()
      .maybeSingle();
    if (!updated) return { game: null, error: "Position changée, rafraîchis." };
    return { game: toPublic(updated as Row, data.token), error: null };
  });
