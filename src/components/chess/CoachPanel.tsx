import { useState } from "react";
import { analyzeGame, type CoachReport } from "@/lib/coach.functions";

type Props = {
  pgn: string;
  botElo: number;
  result: "win" | "loss" | "draw";
  generalElo: number;
  previousElo: number;
  games: number;
  peak: number;
  record: { wins: number; draws: number; losses: number };
  provisional: boolean;
  expected: number;
};

const RESULT_LABEL: Record<Props["result"], string> = {
  win: "Victoire",
  loss: "Défaite",
  draw: "Nulle",
};

const TAG_COLOR: Record<string, string> = {
  gaffe: "text-brick",
  erreur: "text-brick",
  imprecision: "text-bark",
  "bon coup": "text-pine",
  "coup brillant": "text-pine",
};

function title(elo: number) {
  if (elo >= 2600) return "Super GM";
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
  peak,
  record,
  provisional,
  expected,
}: Props) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = generalElo - previousElo;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeGame({
        data: { pgn, botElo, result, playerElo: generalElo },
      });
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
          {provisional ? " · provisoire" : ""}
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
            {report
              ? `${title(report.estimated_elo)} · ${report.accuracy}% précision`
              : "à analyser"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        <Stat label="Record" value={`${record.wins}/${record.draws}/${record.losses}`} />
        <Stat label="Pic" value={String(peak)} />
        <Stat label="Attendu" value={`${Math.round(expected * 100)}%`} />
      </div>

      {!report && (
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-pine px-3 py-3 font-display text-[15px] font-bold text-cream disabled:opacity-60"
        >
          {loading ? "Analyse détaillée en cours…" : "Analyser ma partie"}
        </button>
      )}

      {error && <p className="mt-2 font-mono text-[11px] text-brick">{error}</p>}

      {report && (
        <div className="mt-3 space-y-2.5">
          {report.opening && (
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70">
              Ouverture · {report.opening}
            </p>
          )}
          <p className="text-[13px] leading-snug">{report.summary}</p>

          <div className="grid grid-cols-4 gap-2">
            <Stat label="Gaffes" value={String(report.counts.blunders)} />
            <Stat label="Erreurs" value={String(report.counts.mistakes)} />
            <Stat label="Imprécis." value={String(report.counts.inaccuracies)} />
            <Stat label="Bons" value={String(report.counts.good_moves)} />
          </div>

          <div className="space-y-2">
            <Phase label="Ouverture" text={report.phases.opening} />
            <Phase label="Milieu de partie" text={report.phases.middlegame} />
            <Phase label="Finale" text={report.phases.endgame} />
          </div>

          {report.moments.map((moment, i) => (
            <div key={`${moment.move_number}-${i}`} className="rounded-xl bg-cream/40 px-3 py-2.5">
              <p className="font-mono text-[11px] text-bark/70">
                Coup {moment.move_number} · joué{" "}
                <span className="font-bold text-brick">{moment.played}</span> · mieux{" "}
                <span className="font-bold text-pine">{moment.better}</span>
              </p>
              <p className="mt-1 font-mono text-[10px]">
                <span className={`font-bold ${TAG_COLOR[moment.tag] ?? "text-bark"}`}>
                  {moment.tag}
                </span>
                {moment.evaluation ? ` · éval ${moment.evaluation}` : ""}
              </p>
              <p className="mt-1 text-[13px] leading-snug">{moment.explanation}</p>
            </div>
          ))}

          {report.strengths.length > 0 && (
            <Bullets label="Points forts" items={report.strengths} tone="text-pine" />
          )}
          {report.weaknesses.length > 0 && (
            <Bullets label="À corriger" items={report.weaknesses} tone="text-brick" />
          )}
          {report.training.length > 0 && (
            <Bullets label="Entraînement" items={report.training} tone="text-bark" />
          )}

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-cream/40 px-2 py-2 text-center ring-1 ring-white/10">
      <p className="font-mono text-[9px] tracking-[0.1em] uppercase text-bark/60">{label}</p>
      <p className="mt-0.5 font-display text-[14px] leading-tight font-bold">{value}</p>
    </div>
  );
}

function Phase({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-xl bg-cream/30 px-3 py-2">
      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-bark/60">{label}</p>
      <p className="mt-1 text-[12.5px] leading-snug">{text}</p>
    </div>
  );
}

function Bullets({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-xl bg-cream/30 px-3 py-2">
      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-bark/60">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[12.5px] leading-snug">
            <span className={`font-bold ${tone}`}>·</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
