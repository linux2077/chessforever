import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { MoveList } from "@/components/chess/MoveList";
import { PlayerCard } from "@/components/chess/PlayerCard";
import { useLocalGame } from "@/hooks/useLocalGame";
import { formatClock } from "@/lib/chess-engine";
import { ensureUnlocked } from "@/lib/gate.functions";

export const Route = createFileRoute("/local")({
  loader: () => ensureUnlocked(),
  head: () => ({
    meta: [
      { title: "Local Two-Player Chess — CHESSBAR" },
      {
        name: "description",
        content:
          "Pass-and-play chess on one device: two humans, shared clocks, auto-flipping board and undo.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Local Two-Player Chess — CHESSBAR" },
      {
        property: "og:description",
        content: "Pass-and-play chess for two players on one device.",
      },
    ],
  }),
  component: LocalPage,
});

const CLOCKS = [
  { label: "Bullet", detail: "1+0", seconds: 60 },
  { label: "Blitz", detail: "5+0", seconds: 300 },
  { label: "Rapid", detail: "10+0", seconds: 600 },
];

function LocalPage() {
  const [clock, setClock] = useState(1);
  const game = useLocalGame(300);
  const flipped = game.autoFlip && game.turn === "b";

  return (
    <AppShell>
      <AppHeader title="Local table" subtitle="Two players · one device" />

      <div className="px-4">
        <PlayerCard
          name="Player 2"
          rating={0}
          side="Black"
          initial="2"
          clock={formatClock(game.blackClock)}
          detail={`${Math.ceil(game.moveCount / 2)} moves`}
          captured={game.blackCaptured}
          active={game.turn === "b" && !game.gameOver}
        />
      </div>

      <div className="mt-3 px-4">
        <ChessBoard
          game={game.game}
          selected={game.selected}
          legalTargets={game.legalTargets}
          lastMove={game.lastMove}
          onSquare={game.playSquare}
          flipped={flipped}
        />
      </div>

      <div className="mt-3 px-4">
        <PlayerCard
          variant="self"
          name="Player 1"
          rating={0}
          side="White"
          initial="1"
          clock={formatClock(game.whiteClock)}
          captured={game.whiteCaptured}
          active={game.turn === "w" && !game.gameOver}
        />
      </div>

      <div className="mt-3 px-4">
        <MoveList
          rows={game.moveRows}
          status={game.paused ? "Paused" : `${game.turn === "w" ? "White" : "Black"} · ${game.status}`}
        />
      </div>

      <div className="mt-4 px-4">
        <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">Clock</p>
        <div className="grid grid-cols-3 gap-2.5">
          {CLOCKS.map((option, i) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setClock(i);
                game.reset(option.seconds);
              }}
              className={`rounded-2xl px-3 py-3 text-left ${
                i === clock ? "bg-ink text-cream shadow-sm" : "bg-cream ring-1 ring-black/5"
              }`}
            >
              <p className="font-display text-[15px] leading-tight font-bold">{option.label}</p>
              <p
                className={`mt-1 font-mono text-[10px] ${
                  i === clock ? "text-cream/60" : "text-bark/70"
                }`}
              >
                {option.detail}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5 px-4">
        <button
          type="button"
          onClick={() => game.setPaused((p) => !p)}
          className="rounded-2xl bg-cream px-3 py-2.5 font-display text-[14px] font-bold ring-1 ring-black/5"
        >
          {game.paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={game.undo}
          className="rounded-2xl bg-cream px-3 py-2.5 font-display text-[14px] font-bold ring-1 ring-black/5"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => game.setAutoFlip((f) => !f)}
          className={`rounded-2xl px-3 py-2.5 font-display text-[14px] font-bold ${
            game.autoFlip ? "bg-pine text-cream" : "bg-cream ring-1 ring-black/5"
          }`}
        >
          Flip
        </button>
      </div>

      {game.gameOver && (
        <div className="mt-3 px-4">
          <button
            type="button"
            onClick={() => game.reset(CLOCKS[clock]?.seconds ?? 300)}
            className="w-full rounded-2xl bg-brick px-3 py-3 font-display text-[15px] font-bold text-paper"
          >
            {game.status} — new game
          </button>
        </div>
      )}
    </AppShell>
  );
}
