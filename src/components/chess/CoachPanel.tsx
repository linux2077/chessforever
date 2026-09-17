import { useState } from "react";
import { analyzeGame, type CoachReport } from "@/lib/coach.functions";

type Props = {
  pgn: string;
  botElo: number;
  result: "win" | "loss" | "draw";
  generalElo: number;
  previousElo: number;
  games: number;
};

const RESULT_LABEL: Record<Props["result"], string> = {
  win: "Victoire",
  loss: "Défaite",
  draw: "Nulle",
};

function title(elo: number) {
  if (elo >= 2400) return "Grand maître";
  if (elo >= 2100) return "Maître";
  if (elo >= 1800) return "Expert";
  if (elo >= 1500) return "Confirmé";
  if (elo >= 1200) return "Club";
  if (elo >= 1000) return "Novice";
  return "Débutant";
}

export function CoachPanel({
  pgn,
  botElo,
  result,
  generalElo,
  previousElo,
  games,
}: Props) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = generalElo - previousElo;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeGame({ data: { pgn, botElo, result } });
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card px-3 py-3 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">Coach</p>
        <p className="font-mono text-[10px] text-bark/50">
          {RESULT_LABEL[result]} · {games} partie{games > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-cream/50 px-3 py-2.5 ring-1 ring-white/10">
          <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-bark/60">Elo général</p>
          <p className="font-display text-[20px] leading-tight font-bold">{generalElo}</p>
          <p className="mt-0.5 font-mono text-[10px] text-bark/70">
            {title(generalElo)} · {delta >= 0 ? `+${delta}` : delta}
          </p>
        </div>
        <div className="rounded-xl bg-cream/50 px-3 py-2.5 ring-1 ring-white/10">
          <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-bark/60">
            Elo de la partie
          </p>
          <p className="font-display text-[20px] leading-tight font-bold">
            {report ? report.estimated_elo : "—"}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-bark/70">
            {report ? `${title(report.estimated_elo)} · ${report.accuracy}% précision` : "à analyser"}
          </p>
        </div>
      </div>

      {!report && (
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-pine px-3 py-3 font-display text-[15px] font-bold text-cream disabled:opacity-60"
        >
          {loading ? "Analyse en cours…" : "Analyser ma partie"}
        </button>
      )}

      {error && <p className="mt-2 font-mono text-[11px] text-brick">{error}</p>}

      {report && (
        <div className="mt-3 space-y-2.5">
          <p className="text-[13px] leading-snug">{report.summary}</p>
          {report.moments.map((moment, i) => (
            <div key={`${moment.move_number}-${i}`} className="rounded-xl bg-cream/40 px-3 py-2.5">
              <p className="font-mono text-[11px] text-bark/70">
                Coup {moment.move_number} · joué{" "}
                <span className="font-bold text-brick">{moment.played}</span> · mieux{" "}
                <span className="font-bold text-pine">{moment.better}</span>
              </p>
              <p className="mt-1 text-[13px] leading-snug">{moment.explanation}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="w-full rounded-2xl bg-cream/60 px-3 py-2.5 font-display text-[14px] font-bold ring-1 ring-white/10 disabled:opacity-60"
          >
            {loading ? "Analyse en cours…" : "Relancer l'analyse"}
          </button>
        </div>
      )}
    </div>
  );
}
