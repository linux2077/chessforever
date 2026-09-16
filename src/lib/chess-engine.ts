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

export const ELO_LEVELS = [800, 1000, 1200, 1500, 1800, 2100, 2400] as const;

function evaluate(game: Chess): number {
  // score from black's point of view (bot plays black)
  const { white, black } = materialBalance(game);
  return black - white;
}

/**
 * Bot move picker whose strength scales with `elo`:
 * stronger levels look at the opponent's best reply and blunder less often.
 */
export function pickBotMove(game: Chess, elo = 1500): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  // 800 -> ~45% random moves, 2400 -> ~0%
  const blunderChance = Math.max(0, Math.min(0.45, (1800 - elo) / 2200));
  if (Math.random() < blunderChance) {
    return moves[Math.floor(Math.random() * moves.length)] ?? null;
  }

  const lookAhead = elo >= 1500;
  const noise = elo >= 2100 ? 0.1 : elo >= 1500 ? 0.4 : 1.2;

  let best: Move[] = [];
  let bestScore = -Infinity;

  for (const move of moves) {
    let score = Math.random() * noise;
    if (move.captured) score += (VALUES[move.captured] ?? 0) * 2;
    if (move.promotion) score += 8;
    game.move(move);

    if (game.isCheckmate()) score += 1000;
    else if (game.isCheck()) score += 1.5;

    if (lookAhead && !game.isGameOver()) {
      // penalise moves that let the opponent grab material back
      const replies = game.moves({ verbose: true }) as Move[];
      let worst = 0;
      for (const reply of replies) {
        game.move(reply);
        const value = evaluate(game);
        game.undo();
        if (value < worst) worst = value;
      }
      score += worst * (elo >= 2100 ? 1.4 : 0.9);
    }

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
