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

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/** Niveaux d'adversaire, du débutant au niveau super-GM. */
export const ELO_LEVELS = [
  600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800,
] as const;

/** Temps de réflexion (ms) du bot : plus il est fort, plus il "pense" longtemps. */
export function botThinkTime(elo: number): number {
  if (elo <= 800) return 350;
  if (elo <= 1200) return 700;
  if (elo <= 1600) return 1200;
  if (elo <= 2000) return 1900;
  if (elo <= 2400) return 2800;
  return 3800;
}

function searchDepth(elo: number): number {
  if (elo <= 800) return 1;
  if (elo <= 1400) return 2;
  if (elo <= 2000) return 3;
  if (elo <= 2600) return 4;
  return 5;
}

// Tables de position (point de vue des blancs, index 0 = a8).
const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10,
  25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10,
  10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];
const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0,
  -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5,
  -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];
const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
];
const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
  0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5,
  5, 0, 0, 0,
];
const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5,
  0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0,
  -10, -20, -10, -10, -5, -5, -10, -10, -20,
];
const KING_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
  -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
  -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
  10, 30, 20,
];

const PST: Record<string, number[]> = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  b: BISHOP_PST,
  r: ROOK_PST,
  q: QUEEN_PST,
  k: KING_PST,
};

/** Évaluation statique, en centipions, du point de vue des blancs. */
function evaluateBoard(game: Chess): number {
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const cell = board[r]?.[f];
      if (!cell) continue;
      const index = cell.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const positional = PST[cell.type]?.[index] ?? 0;
      const value = (VALUES[cell.type] ?? 0) + positional;
      score += cell.color === "w" ? value : -value;
    }
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => moveScore(b) - moveScore(a));
}

function moveScore(move: Move): number {
  let s = 0;
  if (move.captured) s += 10 * (VALUES[move.captured] ?? 0) - (VALUES[move.piece] ?? 0);
  if (move.promotion) s += 800;
  if (move.san.includes("+")) s += 50;
  return s;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, sign: number): number {
  if (game.isGameOver()) {
    if (game.isCheckmate()) return -100000 - depth;
    return 0;
  }
  if (depth === 0) return sign * evaluateBoard(game);

  let best = -Infinity;
  for (const move of orderMoves(game.moves({ verbose: true }) as Move[])) {
    game.move(move);
    const score = -negamax(game, depth - 1, -beta, -alpha, -sign);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Bot dont la force suit l'Elo : recherche alpha-beta plus profonde,
 * moins de bruit et beaucoup moins d'erreurs à haut niveau.
 */
export function pickBotMove(game: Chess, elo = 1500): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) return null;

  // 600 -> ~32% de coups au hasard, 2200+ -> 0%
  const blunderChance = Math.max(0, Math.min(0.32, (1500 - elo) / 2800));
  if (Math.random() < blunderChance) {
    return moves[Math.floor(Math.random() * moves.length)] ?? null;
  }

  const depth = searchDepth(elo);
  const noise = elo >= 2400 ? 2 : elo >= 2000 ? 8 : elo >= 1600 ? 25 : elo >= 1200 ? 60 : 120;
  const sign = game.turn() === "w" ? 1 : -1;

  let best: Move[] = [];
  let bestScore = -Infinity;

  for (const move of orderMoves(moves)) {
    game.move(move);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, -sign) + Math.random() * noise;
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
      const value = (VALUES[cell.type] ?? 0) / 100;
      if (cell.color === "w") white += value;
      else black += value;
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
