import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "Arena Leaderboards — Kaspanov Chess" },
      {
        name: "description",
        content: "Weekly blitz and bullet ladders, live arena standings and season crowns.",
      },
      { property: "og:title", content: "Arena Leaderboards — Kaspanov Chess" },
      {
        property: "og:description",
        content: "Weekly blitz and bullet ladders with live arena standings.",
      },
    ],
  }),
  component: ArenaPage,
});

const LADDER = [
  { name: "Ondrej B.", rating: 3120, score: "12/14" },
  { name: "Priya N.", rating: 3044, score: "11/14" },
  { name: "Kenji T.", rating: 2970, score: "11/14" },
  { name: "Léa D.", rating: 2881, score: "10/14" },
  { name: "You", rating: 1847, score: "7/14" },
];

function ArenaPage() {
  return (
    <AppShell>
      <AppHeader title="Arena" subtitle="Season 7 · 32 min left" />

      <div className="px-4">
        <div className="rounded-2xl bg-ink px-3 py-3 text-cream shadow-sm">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-cream/50">
            Live blitz arena
          </p>
          <p className="mt-1 font-display text-[20px] leading-none font-extrabold">3+2 · 14 rounds</p>
          <p className="mt-2 font-mono text-[11px] text-cream/60">412 players · you are 24th</p>
        </div>
      </div>

      <div className="mt-4 px-4">
        <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
          Standings
        </p>
        <div className="rounded-2xl bg-card p-3 ring-1 ring-black/5">
          {LADDER.map((row, i) => (
            <div
              key={row.name}
              className="flex items-center justify-between border-b border-black/5 py-2 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 font-mono font-bold text-pine">{i + 1}</span>
                <div>
                  <p className="text-[13px] leading-none font-medium">{row.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-bark/60">{row.rating}</p>
                </div>
              </div>
              <span className="font-mono text-[12px] font-bold text-bark/70">{row.score}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
