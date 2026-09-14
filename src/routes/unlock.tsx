import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "CHESSBAR — Private Club Entrance" },
      { name: "description", content: "Enter the shared club password to open CHESSBAR." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "CHESSBAR — Private Club Entrance" },
      { property: "og:description", content: "A private chess club. Password required." },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    setError(false);
    const { ok } = await unlock({ data: { password } });
    setBusy(false);
    if (ok) await router.navigate({ to: "/" });
    else setError(true);
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-ink">
      <div className="flex min-h-dvh w-full max-w-[420px] flex-col justify-center bg-paper px-6">
        <div className="grid size-12 place-items-center rounded-xl bg-ink font-display text-2xl leading-none font-extrabold text-board-lt">
          C
        </div>
        <h1 className="mt-5 font-display text-[30px] leading-none font-extrabold tracking-tight">
          CHESSBAR
        </h1>
        <p className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
          Private table · password only
        </p>

        <form onSubmit={onSubmit} className="mt-8">
          <label
            htmlFor="password"
            className="font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70"
          >
            Club password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-2 w-full rounded-2xl bg-cream px-4 py-3 font-mono text-[14px] text-ink ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-pine"
          />
          {error && (
            <p className="mt-2 font-mono text-[12px] text-brick">
              Wrong password. Ask at the bar.
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-2xl bg-ink px-4 py-3.5 font-display text-[16px] font-bold text-cream disabled:opacity-60"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>

        <p className="mt-6 font-mono text-[11px] leading-relaxed text-bark/60">
          No sign-up, no account. One shared password opens every table.
        </p>
      </div>
    </div>
  );
}
