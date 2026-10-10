import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { listOnlineGames } from "@/lib/online-games.functions";

const gamesQuery = queryOptions({
  queryKey: ["online-games"],
  queryFn: () => listOnlineGames(),
  refetchInterval: 5000,
});

export const Route = createFileRoute("/parties")({
  head: () => ({
    meta: [
      { title: "Parties en ligne — CHESSBAR" },
      { name: "description", content: "Tous les salons en ligne CHESSBAR : coups joués et résultats." },
      { property: "og:title", content: "Parties en ligne — CHESSBAR" },
      { property: "og:description", content: "Consulte les salons créés, leurs coups et leurs résultats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(gamesQuery),
  component: PartiesPage,
});

const STATUS: Record<string, string> = { waiting: "En attente", playing: "En cours", finished: "Terminée" };

function PartiesPage() {
  const { data } = useSuspenseQuery(gamesQuery);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <AppShell>
      <AppHeader title="Parties en ligne" subtitle={`${data.games.length} salons récents`} />
      <div className="space-y-3 px-4 pb-6">
        <Link to="/online" className="block rounded-2xl bg-brick px-4 py-3 text-center font-display font-bold text-paper">
          Créer ou rejoindre un salon
        </Link>
        {data.error && <p className="text-sm text-brick">{data.error}</p>}
        {data.games.length === 0 && <p className="text-sm text-bark">Aucune partie pour l'instant.</p>}
        {data.games.map((g) => (
          <button
            key={g.id}
            onClick={() => setOpen(open === g.id ? null : g.id)}
            className="block w-full rounded-2xl bg-card p-3 text-left ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[15px] font-bold">{g.code}</span>
              <span className="rounded-full bg-cream px-2 py-0.5 text-[11px]">{STATUS[g.status] ?? g.status}</span>
            </div>
            <div className="mt-1 text-[12px] text-bark">
              {Math.round(g.base_seconds / 60)} min · {g.moves.length} coups ·{" "}
              {new Date(g.created_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}
            </div>
            <div className="mt-1 text-[13px] font-semibold">{g.result}</div>
            {open === g.id && (
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-bark">
                {g.moves.length
                  ? g.moves.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(" ")
                  : "Aucun coup joué."}
              </p>
            )}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
