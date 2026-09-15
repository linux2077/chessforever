import { Chess, type Move, type Square } from "chess.js";

export const PIECE_GLYPHS: Record<string, string> = {
  wk: "♚",
  wq: "♛",
  wr: "♜",
  wb: "♝",
  wn: "♞",
  wp: "♟",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};

const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Simple greedy bot: prefers mate, then best material capture, with light randomness. */
export function pickBotMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  let best: Move[] = [];
  let bestScore = -Infinity;

  for (const move of moves) {
    let score = Math.random() * 0.4;
    if (move.captured) score += (VALUES[move.captured] ?? 0) * 2;
    if (move.promotion) score += 8;
    game.move(move);
    if (game.isCheckmate()) score += 1000;
    else if (game.isCheck()) score += 1.5;
    game.undo();

    if (score > bestScore) {
      bestScore = score;
      best = [move];
    } else if (score === bestScore) {
      best.push(move);
    }
  }

  return best[Math.floor(Math.random() * best.length)] ?? null;
}

export function materialBalance(game: Chess): { white: number; black: number } {
  let white = 0;
  let black = 0;
  for (const row of game.board()) {
    for (const cell of row) {
      if (!cell) continue;
      if (cell.color === "w") white += VALUES[cell.type] ?? 0;
      else black += VALUES[cell.type] ?? 0;
    }
  }
  return { white, black };
}

export function capturedGlyphs(history: Move[], byColor: "w" | "b"): string[] {
  return history
    .filter((m) => m.color === byColor && m.captured)
    .map((m) => PIECE_GLYPHS[`${byColor === "w" ? "b" : "w"}${m.captured}`] ?? "");
}

export function pairMoves(history: Move[]) {
  const rows: { no: number; white?: string; black?: string }[] = [];
  history.forEach((move, i) => {
    const index = Math.floor(i / 2);
    const row = rows[index] ?? (rows[index] = { no: index + 1 });
    if (move.color === "w") row.white = move.san;
    else row.black = move.san;
  });
  return rows;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type { Square, Move };
export { Chess };
