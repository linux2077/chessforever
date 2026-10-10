import { createServerFn } from "@tanstack/react-start";
import type { GameSummary } from "./online-games.server";

// Public listing: never selects player tokens.
export const listOnlineGames = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { describeResult, movesOf } = await import("./online-games.server");
  const { data, error } = await supabaseAdmin
    .from("online_games")
    .select("id, code, status, base_seconds, pgn, fen, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { games: [] as GameSummary[], error: "Impossible de charger les parties." };
  const games: GameSummary[] = (data ?? []).map((g) => ({
    ...g,
    moves: movesOf(g.pgn),
    result: describeResult(g.fen, g.status),
  }));
  return { games, error: null };
});
