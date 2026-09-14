import { Link } from "@tanstack/react-router";

const items = [
  { to: "/", glyph: "♞", label: "Play" },
  { to: "/local", glyph: "⇄", label: "Local" },
  { to: "/puzzles", glyph: "❔", label: "Puzzles" },
  { to: "/arena", glyph: "🏆", label: "Arena" },
  { to: "/profile", glyph: "M", label: "You" },
] as const;

export function BottomNav() {
  return (
    <nav className="mt-auto border-t border-black/5 px-4 pt-3 pb-5">
      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-cream/60 p-1.5 ring-1 ring-black/5">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="grid place-items-center rounded-xl py-2.5 text-bark"
            activeProps={{ className: "bg-ink text-cream" }}
          >
            <span className="font-display text-lg leading-none font-bold">{item.glyph}</span>
            <span className="mt-1 font-mono text-[9px] tracking-widest uppercase">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
