import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { CoachPanel } from "@/components/chess/CoachPanel";
import { MoveList } from "@/components/chess/MoveList";
import { PlayerCard } from "@/components/chess/PlayerCard";
import { useChessGame } from "@/hooks/useChessGame";
import { usePlayerRating } from "@/hooks/usePlayerRating";
import { ELO_LEVELS, formatClock } from "@/lib/chess-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHESSBAR — Play Chess Ranked, Blitz & Puzzles" },
      {
        name: "description",
        content:
          "Play chess on your phone: quick matches against the bot, rated blitz clocks, daily puzzles and a rating profile.",
      },
      { property: "og:title", content: "CHESSBAR — Play Chess Ranked, Blitz & Puzzles" },
      {
        property: "og:description",
        content: "Quick matches, blitz clocks and daily puzzles in a tournament-grade chess app.",
      },
    ],
  }),
  component: PlayPage,
});

const TIME_CONTROLS: { label: string; detail: string; seconds: number }[] = [
  { label: "Hyper", detail: "30s", seconds: 30 },
  { label: "Bullet", detail: "1+0", seconds: 60 },
  { label: "Bullet+", detail: "2+0", seconds: 120 },
  { label: "Blitz", detail: "3+0", seconds: 180 },
  { label: "Blitz+", detail: "5+0", seconds: 300 },
  { label: "Rapid", detail: "10+0", seconds: 600 },
  { label: "Rapid+", detail: "15+0", seconds: 900 },
  { label: "Classic", detail: "30+0", seconds: 1800 },
  { label: "Long", detail: "60+0", seconds: 3600 },
];

const ELO_TITLES: Record<number, string> = {
  800: "Débutant",
  1000: "Novice",
  1200: "Club",
  1500: "Confirmé",
  1800: "Expert",
  2100: "Maître",
  2400: "Grand maître",
};

function PlayPage() {
  const [control, setControl] = useState(5);
  const game = useChessGame(600, 1500);


  return (
    <AppShell>
      <AppHeader
        title="CHESSBAR"
        subtitle={`Elo ${game.elo} · ${TIME_CONTROLS[control]?.detail ?? "10+0"}`}
      />


      <div className="px-4">
        <PlayerCard
          name={`Bot ${ELO_TITLES[game.elo] ?? ""}`.trim()}
          rating={game.elo}

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
          Niveau de l'adversaire
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ELO_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                game.setElo(level);
                game.reset(TIME_CONTROLS[control]?.seconds ?? 600);
              }}
              className={`rounded-2xl px-2 py-2.5 text-left ${
                level === game.elo
                  ? "bg-pine text-cream shadow-sm"
                  : "bg-cream/50 ring-1 ring-white/10"
              }`}
            >
              <p className="font-display text-[15px] leading-tight font-bold">{level}</p>
              <p
                className={`mt-0.5 font-mono text-[9px] ${
                  level === game.elo ? "text-cream/70" : "text-bark/70"
                }`}
              >
                {ELO_TITLES[level]}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 px-4">
        <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
          Temps de partie
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
                i === control
                  ? "bg-cream text-foreground shadow-sm"
                  : "bg-cream/50 ring-1 ring-white/10"
              }`}
            >
              <p className="font-display text-[15px] leading-tight font-bold">{tc.label}</p>
              <p
                className={`mt-1 font-mono text-[10px] ${
                  i === control ? "text-foreground/60" : "text-bark/70"
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
