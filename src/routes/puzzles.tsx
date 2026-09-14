import { createFileRoute } from "@tanstack/react-router";
import { ensureUnlocked } from "@/lib/gate.functions";
import { useMemo, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Chess, type Move, type Square } from "@/lib/chess-engine";

export const Route = createFileRoute("/puzzles")({
  loader: () => ensureUnlocked(),
  head: () => ({
    meta: [
      { title: "Daily Chess Puzzles — CHESSBAR" },
      {
        name: "description",
        content: "Solve mate-in-one and tactics puzzles to sharpen your pattern recognition.",
      },
      { property: "og:title", content: "Daily Chess Puzzles — CHESSBAR" },
      {
        property: "og:description",
        content: "Mate-in-one tactics puzzles with instant feedback and a solving streak.",
      },
    ],
  }),
  component: PuzzlesPage,
});

const PUZZLES = [
  { fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", answer: "Ra8#", theme: "Back rank" },
  { fen: "r5k1/5ppp/8/8/8/7Q/5PP1/6K1 w - - 0 1", answer: "Qxh7#", theme: "Queen sac" },
  { fen: "6k1/6pp/8/8/8/8/6PP/4R1K1 w - - 0 1", answer: "Re8#", theme: "Rook mate" },
];

function PuzzlesPage() {
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "right">("idle");
  const [selected, setSelected] = useState<Square | null>(null);

  const puzzle = PUZZLES[index % PUZZLES.length]!;
  const game = useMemo(() => new Chess(puzzle.fen), [puzzle.fen]);

  const legalTargets = selected
    ? (game.moves({ square: selected, verbose: true }) as Move[]).map((m) => m.to as Square)
    : [];

  function onSquare(square: Square) {
    if (selected) {
      const move = (game.moves({ square: selected, verbose: true }) as Move[]).find(
        (m) => m.to === square,
      );
      if (move) {
        const right = move.san === puzzle.answer;
        setFeedback(right ? "right" : "wrong");
        if (right) setSolved((s) => s + 1);
        setSelected(null);
        return;
      }
    }
    const piece = game.get(square);
    setSelected(piece && piece.color === "w" ? square : null);
  }

  return (
    <AppShell>
      <AppHeader title="Puzzles" subtitle={`Streak ${solved} · Mate in 1`} />

      <div className="px-4">
        <div className="flex items-center justify-between rounded-2xl bg-cream px-3 py-2.5 ring-1 ring-black/5">
          <div>
            <p className="font-display text-[15px] leading-none font-semibold">{puzzle.theme}</p>
            <p className="mt-1 font-mono text-[11px] text-bark/70">White to play · mate in one</p>
          </div>
          <p className="font-mono text-[11px] text-pine">
            {index + 1}/{PUZZLES.length}
          </p>
        </div>
      </div>

      <div className="mt-3 px-4">
        <ChessBoard
          game={game}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={null}
          onSquare={onSquare}
        />
      </div>

      <div className="mt-3 px-4">
        <div className="rounded-2xl bg-card px-3 py-3 ring-1 ring-black/5">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70">Result</p>
          <p
            className={`mt-1 font-display text-[15px] font-bold ${
              feedback === "right" ? "text-pine" : feedback === "wrong" ? "text-brick" : ""
            }`}
          >
            {feedback === "right"
              ? "Solved — that's mate."
              : feedback === "wrong"
                ? "Not this one. Try again."
                : "Find the mating move."}
          </p>
          <button
            type="button"
            onClick={() => {
              setIndex((i) => i + 1);
              setFeedback("idle");
              setSelected(null);
            }}
            className="mt-3 w-full rounded-xl bg-ink px-3 py-2.5 font-display text-[14px] font-bold text-cream"
          >
            Next puzzle
          </button>
        </div>
      </div>
    </AppShell>
  );
}
