import type { Chess, Square } from "@/lib/chess-engine";
import { PIECE_GLYPHS } from "@/lib/chess-engine";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

type Props = {
  game: Chess;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  onSquare: (square: Square) => void;
  flipped?: boolean;
};

export function ChessBoard({
  game,
  selected,
  legalTargets,
  lastMove,
  onSquare,
  flipped = false,
}: Props) {
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;
  const board = game.board();

  return (
    <div className="grid grid-cols-8 overflow-hidden rounded-2xl ring-1 ring-black/5 outline-1 -outline-offset-1 outline-black/5">
      {ranks.map((rank) =>
        files.map((file) => {
          const square = `${file}${rank}` as Square;
          const piece = board[8 - rank]?.[FILES.indexOf(file)];
          const dark = (FILES.indexOf(file) + rank) % 2 === 0;
          const isTarget = legalTargets.includes(square);
          const isLast = lastMove && (lastMove.from === square || lastMove.to === square);

          return (
            <button
              key={square}
              type="button"
              onClick={() => onSquare(square)}
              aria-label={square}
              className={`relative grid aspect-square place-items-center ${
                dark ? "bg-board-dk" : "bg-board-lt"
              }`}
            >
              {selected === square && <span className="absolute inset-0 bg-tea/40" />}
              {isLast && !isTarget && <span className="absolute inset-0 bg-tea/25" />}
              {isTarget && !piece && <span className="absolute size-[26%] rounded-full bg-brick/60" />}
              {isTarget && piece && (
                <span className="absolute inset-0 ring-[3px] ring-inset ring-brick/70" />
              )}
              {piece && (
                <span
                  className={`piece-drop relative font-display text-[clamp(20px,7vw,30px)] leading-none font-extrabold ${
                    piece.color === "w" ? "text-pine drop-shadow-sm" : "text-ink"
                  }`}
                >
                  {PIECE_GLYPHS[`${piece.color}${piece.type}`]}
                </span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
