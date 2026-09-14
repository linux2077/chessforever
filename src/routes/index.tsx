import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { MoveList } from "@/components/chess/MoveList";
import { PlayerCard } from "@/components/chess/PlayerCard";
import { useChessGame } from "@/hooks/useChessGame";
import { formatClock } from "@/lib/chess-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kaspanov — Play Chess Ranked, Blitz & Puzzles" },
      {
        name: "description",
        content:
          "Play chess on your phone: quick matches against the bot, rated blitz clocks, daily puzzles and a rating profile.",
      },
      { property: "og:title", content: "Kaspanov — Play Chess Ranked, Blitz & Puzzles" },
      {
        property: "og:description",
        content: "Quick matches, blitz clocks and daily puzzles in a tournament-grade chess app.",
      },
    ],
  }),
  component: PlayPage,
});

const TIME_CONTROLS: { label: string; detail: string; seconds: number }[] = [
  { label: "Quick", detail: "Match", seconds: 600 },
  { label: "Bot", detail: "CPU 1500", seconds: 300 },
  { label: "Bullet", detail: "1+0", seconds: 60 },
];

function PlayPage() {
  const [control, setControl] = useState(0);
  const game = useChessGame(600);

  return (
    <AppShell>
      <AppHeader title="Kaspanov" subtitle={`Ranked · ${TIME_CONTROLS[control]?.label ?? "Quick"}`} />

      <div className="px-4">
        <PlayerCard
          name="R. Vasseur"
          rating={2104}
          side="Black"
          initial="R"
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
        />
      </div>

      <div className="mt-3 px-4">
        <PlayerCard
          variant="self"
          name="You"
          rating={1847}
          side="White"
          initial="M"
          clock={formatClock(game.whiteClock)}
          captured={game.whiteCaptured}
          active={game.turn === "w" && !game.gameOver}
        />
      </div>

      <div className="mt-3 px-4">
        <MoveList rows={game.moveRows} status={game.status} />
      </div>

      <div className="mt-4 px-4">
        <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
          Quick play
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {TIME_CONTROLS.map((tc, i) => (
            <button
              key={tc.label}
              type="button"
              onClick={() => {
                setControl(i);
                game.reset(tc.seconds);
              }}
              className={`rounded-2xl px-3 py-3 text-left ${
                i === control ? "bg-ink text-cream shadow-sm" : "bg-cream ring-1 ring-black/5"
              }`}
            >
              <p className="font-display text-[15px] leading-tight font-bold">{tc.label}</p>
              <p
                className={`mt-1 font-mono text-[10px] ${
                  i === control ? "text-cream/60" : "text-bark/70"
                }`}
              >
                {tc.detail}
              </p>
            </button>
          ))}
        </div>
      </div>

      {game.gameOver && (
        <div className="mt-3 px-4">
          <button
            type="button"
            onClick={() => game.reset(TIME_CONTROLS[control]?.seconds ?? 600)}
            className="w-full rounded-2xl bg-brick px-3 py-3 font-display text-[15px] font-bold text-paper"
          >
            {game.status} — play again
          </button>
        </div>
      )}
    </AppShell>
  );
}
