type Props = {
  name: string;
  rating: number;
  side: string;
  clock: string;
  initial: string;
  detail?: string;
  captured?: string[];
  variant?: "opponent" | "self";
  active?: boolean;
};

export function PlayerCard({
  name,
  rating,
  side,
  clock,
  initial,
  detail,
  captured = [],
  variant = "opponent",
  active = false,
}: Props) {
  const self = variant === "self";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
        self ? "bg-ink text-cream shadow-sm" : "bg-cream ring-1 ring-black/5"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`grid size-9 place-items-center rounded-full font-display text-sm font-bold ${
            self ? "bg-cream text-ink ring-2 ring-brick" : "bg-pine text-cream"
          }`}
        >
          {initial}
        </div>
        <div>
          <p className="font-display text-[15px] leading-none font-semibold">
            {name}{" "}
            {self && <span className="font-mono text-[11px] text-cream/60">· {rating}</span>}
          </p>
          <p className={`mt-1 font-mono text-[11px] ${self ? "text-cream/50" : "text-bark/70"}`}>
            {self ? `${side}${active ? " · your turn" : ""}` : `${rating} · ${side}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-mono leading-none font-bold tabular-nums ${
            active ? "text-[26px] text-brick" : self ? "text-[26px] text-cream/70" : "text-[22px]"
          }`}
        >
          {clock}
        </p>
        {captured.length > 0 ? (
          <div
            className={`mt-1 flex items-center justify-end gap-1 font-mono text-[12px] leading-none ${
              self ? "text-cream/80" : "text-bark/70"
            }`}
          >
            {captured.map((glyph, i) => (
              <span key={i}>{glyph}</span>
            ))}
          </div>
        ) : (
          detail && (
            <p
              className={`mt-1 font-mono text-[9px] tracking-[0.15em] uppercase ${
                self ? "text-cream/50" : "text-bark/60"
              }`}
            >
              {detail}
            </p>
          )
        )}
      </div>
    </div>
  );
}
