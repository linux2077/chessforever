import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Chess Profile & Ratings — CHESSBAR" },
      {
        name: "description",
        content: "Track your rapid, blitz and bullet ratings, win rate and recent chess games.",
      },
      { property: "og:title", content: "Your Chess Profile & Ratings — CHESSBAR" },
      {
        property: "og:description",
        content: "Ratings, win rate and recent game results in one compact profile.",
      },
    ],
  }),
  component: ProfilePage,
});

const GAMES = [
  { opponent: "vs A. Kowalski", meta: "Blitz 5+0 · yesterday", result: "Win", tone: "pine" },
  { opponent: "vs T. Nguyen", meta: "Rapid 10+0 · Tue", result: "Loss", tone: "brick" },
  { opponent: "vs S. Brandt", meta: "Bullet 1+0 · Mon", result: "Draw", tone: "bark" },
] as const;

const CURVE = [22, 34, 30, 44, 40, 58, 66, 62, 78];

function ProfilePage() {
  return (
    <AppShell>
      <AppHeader title="Milan R." subtitle="Member since 2023" />

      <div className="px-4">
        <div className="rounded-2xl bg-card p-3 ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[15px] font-bold">Profile</p>
            <p className="font-mono text-[11px] text-pine">▲ 128 / 90d</p>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            {[
              { value: "1847", label: "Rapid" },
              { value: "1792", label: "Blitz" },
              { value: "78%", label: "Win" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-cream py-2">
                <p className="font-mono text-lg leading-none font-bold">{stat.value}</p>
                <p className="mt-1 font-mono text-[9px] tracking-widest uppercase text-bark/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mb-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70">
            Rating · 30 games
          </p>
          <div className="flex h-16 items-end gap-1 rounded-xl bg-cream/70 px-2 pb-2 ring-1 ring-white/10">
            {CURVE.map((height, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-pine/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {GAMES.map((game) => (
              <div
                key={game.opponent}
                className="flex items-center justify-between border-b border-white/10 py-1.5 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`size-2 rounded-full ${
                      game.tone === "pine"
                        ? "bg-pine"
                        : game.tone === "brick"
                          ? "bg-brick"
                          : "bg-bark/60"
                    }`}
                  />
                  <div>
                    <p className="text-[13px] leading-none font-medium">{game.opponent}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-bark/60">{game.meta}</p>
                  </div>
                </div>
                <span
                  className={`font-mono text-[12px] font-bold ${
                    game.tone === "pine"
                      ? "text-pine"
                      : game.tone === "brick"
                        ? "text-brick"
                        : "text-bark/70"
                  }`}
                >
                  {game.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </AppShell>
  );
}
