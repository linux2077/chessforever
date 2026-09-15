import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-background text-foreground">
      <div className="flex min-h-dvh w-full max-w-[420px] flex-col bg-paper">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}

export function AppHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-xl bg-cream font-display text-lg leading-none font-extrabold text-tea ring-1 ring-white/10">
          C
        </div>
        <div>
          <p className="font-display text-[17px] leading-none font-extrabold tracking-tight">
            {title}
          </p>
          <p className="mt-0.5 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="grid size-9 place-items-center rounded-full bg-cream font-mono text-[10px] font-bold text-pine ring-1 ring-white/10">
          1847
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-cream font-display text-sm font-bold text-pine">
          M
        </div>
      </div>
    </header>
  );
}
