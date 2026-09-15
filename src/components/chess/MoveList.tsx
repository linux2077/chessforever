type Row = { no: number; white?: string; black?: string };

export function MoveList({ rows, status }: { rows: Row[]; status: string }) {
  const recent = rows.slice(-4);

  return (
    <div className="rounded-2xl bg-card px-3 py-2.5 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70">Moves</p>
        <p className="font-mono text-[10px] text-bark/50">{status}</p>
      </div>
      {recent.length === 0 ? (
        <p className="font-mono text-[13px] text-bark/50">No moves yet — you play first.</p>
      ) : (
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 font-mono text-[13px]">
          {recent.map((row, i) => (
            <div key={row.no} className="contents">
              <span className="text-bark/40">{row.no}.</span>
              <span>{row.white ?? ""}</span>
              <span className={i === recent.length - 1 ? "font-bold text-brick" : ""}>
                {row.black ?? ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
