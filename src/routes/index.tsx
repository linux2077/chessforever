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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  600: "Novice",
  800: "Débutant",
  1000: "Amateur",
  1200: "Club",
  1400: "Club +",
  1600: "Confirmé",
  1800: "Expert",
  2000: "Candidat",
  2200: "Maître",
  2400: "Grand maître",
  2600: "Super GM",
  2800: "Élite",
};

const CHESS_SCREEN_PICKS = [
  {
    title: "Rematch",
    meta: "Série ARTE · 2024 · 6 épisodes",
    tag: "Kasparov vs Deep Blue",
    note: "Thriller tendu sur le duel de 1997 entre Garry Kasparov et l'ordinateur d'IBM.",
  },
  {
    title: "Le Jeu de la dame",
    meta: "Série Netflix · 2020 · 7 épisodes",
    tag: "Prodige",
    note: "L'ascension de Beth Harmon, entre préparation, addiction et domination sur l'échiquier.",
  },
  {
    title: "The Royal Game",
    meta: "Film · 2021",
    tag: "Psychologie",
    note: "Adaptation de Stefan Zweig, où les échecs deviennent une bataille mentale en huis clos.",
  },
  {
    title: "Critical Thinking",
    meta: "Film · 2020",
    tag: "Équipe scolaire",
    note: "Une équipe de lycéens de Miami vise le championnat national sous la conduite de son coach.",
  },
  {
    title: "Fahim",
    meta: "Film · 2019",
    tag: "Histoire vraie",
    note: "Le parcours de Fahim Mohammad, jeune talent arrivé en France avec son père.",
  },
  {
    title: "Magnus",
    meta: "Documentaire · 2016",
    tag: "Champion du monde",
    note: "Portrait de Magnus Carlsen, de jeune prodige à challenger du titre mondial.",
  },
] as const;

function PlayPage() {
  const [control, setControl] = useState(5);
  const game = useChessGame(600, 1500);
  const { rating, games, ready, applyResult } = usePlayerRating();
  const [previousElo, setPreviousElo] = useState(rating);
  const scoredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !game.result) return;
    const key = `${game.pgn}|${game.result}`;
    if (scoredRef.current === key) return;
    scoredRef.current = key;
    setPreviousElo(rating);
    applyResult(game.elo, game.result === "win" ? 1 : game.result === "draw" ? 0.5 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, game.result, game.pgn]);




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
          rating={rating}
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


      {game.gameOver && game.result && (
        <div className="mt-4 px-4">
          <CoachPanel
            pgn={game.pgn}
            botElo={game.elo}
            result={game.result}
            generalElo={rating}
            previousElo={previousElo}
            games={games}
          />
        </div>
      )}

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

      <section className="mt-5 px-4 pb-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
              Films et séries
            </p>
            <h2 className="mt-1 font-display text-[18px] leading-tight font-extrabold">
              À regarder après la partie
            </h2>
          </div>
          <span className="rounded-full bg-cream px-2.5 py-1 font-mono text-[10px] font-bold text-tea ring-1 ring-white/10">
            Échecs
          </span>
        </div>

        <div className="space-y-2.5">
          {CHESS_SCREEN_PICKS.map((pick) => (
            <article key={pick.title} className="rounded-2xl bg-card p-3 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-[16px] leading-tight font-bold">{pick.title}</h3>
                  <p className="mt-1 font-mono text-[10px] text-bark/70">{pick.meta}</p>
                </div>
                <span className="shrink-0 rounded-full bg-cream px-2 py-1 font-mono text-[9px] font-bold text-pine">
                  {pick.tag}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-bark">{pick.note}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
