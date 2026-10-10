import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { MoveList } from "@/components/chess/MoveList";
import { PlayerCard } from "@/components/chess/PlayerCard";
import { useOnlineGame } from "@/hooks/useOnlineGame";

export const Route = createFileRoute("/online")({
  head: () => ({
    meta: [
      { title: "Partie en ligne à deux — CHESSBAR" },
      {
        name: "description",
        content:
          "Joue aux échecs en ligne contre un autre humain : crée un salon, partage le code, l'échiquier se synchronise en temps réel.",
      },
      { property: "og:title", content: "Partie en ligne à deux — CHESSBAR" },
      {
        property: "og:description",
        content: "Crée un salon, partage le code et joue en temps réel contre un adversaire humain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnlinePage,
});

const CLOCKS = [
  { label: "Bullet", detail: "1+0", seconds: 60 },
  { label: "Blitz", detail: "3+0", seconds: 180 },
  { label: "Blitz+", detail: "5+0", seconds: 300 },
  { label: "Rapid", detail: "10+0", seconds: 600 },
  { label: "Classic", detail: "30+0", seconds: 1800 },
  { label: "Long", detail: "60+0", seconds: 3600 },
];

function OnlinePage() {
  const online = useOnlineGame();
  const [clock, setClock] = useState(2);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const flipped = online.color === "b";

  return (
    <AppShell>
      <AppHeader
        title="En ligne"
        subtitle={online.code ? `Salon ${online.code}` : "Deux joueurs · temps réel"}
      />

      {!online.row && (
        <div className="space-y-4 px-4">
          <Link to="/parties" className="block rounded-2xl bg-card px-4 py-3 text-center font-display text-[14px] font-bold ring-1 ring-white/10">
            Voir toutes les parties en ligne
          </Link>
          <section className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
            <h2 className="font-display text-[17px] leading-tight font-extrabold">Créer un salon</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-bark">
              Tu joues les blancs. Partage le code à ton adversaire pour qu'il rejoigne.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {CLOCKS.map((option, i) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setClock(i)}
                  className={`rounded-2xl px-3 py-3 text-left ${
                    i === clock
                      ? "bg-cream text-foreground shadow-sm"
                      : "bg-cream/50 ring-1 ring-white/10"
                  }`}
                >
                  <p className="font-display text-[15px] leading-tight font-bold">{option.label}</p>
                  <p
                    className={`mt-1 font-mono text-[10px] ${
                      i === clock ? "text-foreground/60" : "text-bark/70"
                    }`}
                  >
                    {option.detail}
                  </p>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={online.busy}
              onClick={() => online.createRoom(CLOCKS[clock]?.seconds ?? 300)}
              className="mt-3 w-full rounded-2xl bg-brick px-3 py-3 font-display text-[15px] font-bold text-paper disabled:opacity-60"
            >
              {online.busy ? "Création…" : "Créer la partie"}
            </button>
          </section>

          <section className="rounded-2xl bg-card p-4 ring-1 ring-white/10">
            <h2 className="font-display text-[17px] leading-tight font-extrabold">
              Rejoindre avec un code
            </h2>
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="EX. K4TR9"
              maxLength={5}
              className="mt-3 w-full rounded-2xl bg-cream/50 px-3 py-3 text-center font-mono text-[18px] tracking-[0.3em] text-foreground ring-1 ring-white/10 outline-none placeholder:text-bark/50"
            />
            <button
              type="button"
              disabled={online.busy}
              onClick={() => online.joinRoom(codeInput)}
              className="mt-3 w-full rounded-2xl bg-pine px-3 py-3 font-display text-[15px] font-bold text-cream disabled:opacity-60"
            >
              {online.busy ? "Connexion…" : "Rejoindre la partie"}
            </button>
          </section>

          {online.error && (
            <p className="rounded-2xl bg-brick/15 px-3 py-2.5 font-mono text-[11px] text-brick ring-1 ring-brick/30">
              {online.error}
            </p>
          )}
        </div>
      )}

      {online.row && (
        <>
          <div className="px-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/10">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">
                  Code du salon
                </p>
                <p className="mt-1 font-display text-[22px] leading-none font-extrabold tracking-[0.2em]">
                  {online.code}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(online.code ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-xl bg-cream px-3 py-2 font-display text-[13px] font-bold ring-1 ring-white/10"
              >
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] tracking-[0.15em] uppercase text-bark/70">
              {online.color === "w" ? "Tu joues les blancs" : "Tu joues les noirs"} · {online.status}
            </p>
          </div>

          <div className="mt-3 px-4">
            <PlayerCard
              name="Adversaire"
              rating={0}
              side={online.color === "w" ? "Black" : "White"}
              initial="A"
              clock="—"
              detail={`${Math.ceil(online.moveCount / 2)} coups`}
              captured={online.color === "w" ? online.blackCaptured : online.whiteCaptured}
              active={!online.myTurn && online.row.status === "playing"}
            />
          </div>

          <div className="mt-3 px-4">
            <ChessBoard
              game={online.game}
              selected={online.selected}
              legalTargets={online.legalTargets}
              lastMove={online.lastMove}
              onSquare={online.playSquare}
              flipped={flipped}
            />
          </div>

          <div className="mt-3 px-4">
            <PlayerCard
              variant="self"
              name="Toi"
              rating={0}
              side={online.color === "w" ? "White" : "Black"}
              initial="M"
              clock="—"
              captured={online.color === "w" ? online.whiteCaptured : online.blackCaptured}
              active={online.myTurn}
            />
          </div>

          <div className="mt-3 px-4">
            <MoveList rows={online.moveRows} status={online.status} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 px-4 pb-4">
            <button
              type="button"
              onClick={() => void online.refresh()}
              className="rounded-2xl bg-cream px-3 py-2.5 font-display text-[14px] font-bold ring-1 ring-white/10"
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={online.leave}
              className="rounded-2xl bg-brick px-3 py-2.5 font-display text-[14px] font-bold text-paper"
            >
              Quitter
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}
