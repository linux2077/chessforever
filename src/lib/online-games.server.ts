import { Chess } from "chess.js";

export type GameSummary = {
  id: string;
  code: string;
  status: string;
  base_seconds: number;
  pgn: string;
  fen: string;
  moves: string[];
  result: string;
  created_at: string;
  updated_at: string;
};

export function describeResult(fen: string, status: string): string {
  if (status === "waiting") return "En attente d'un adversaire";
  const c = new Chess();
  try {
    c.load(fen);
  } catch {
    return "Position invalide";
  }
  if (c.isCheckmate()) return c.turn() === "w" ? "0-1 · Noirs gagnent (mat)" : "1-0 · Blancs gagnent (mat)";
  if (c.isStalemate()) return "½-½ · Pat";
  if (c.isDraw()) return "½-½ · Nulle";
  return status === "finished" ? "Terminée" : "En cours";
}

export function movesOf(pgn: string): string[] {
  if (!pgn) return [];
  const c = new Chess();
  try {
    c.loadPgn(pgn);
    return c.history();
  } catch {
    return [];
  }
}
