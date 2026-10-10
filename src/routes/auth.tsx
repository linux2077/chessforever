import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader, AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion et inscription — CHESSBAR" },
      { name: "description", content: "Crée ton compte CHESSBAR ou connecte-toi par e-mail ou Google." },
      { property: "og:title", content: "Connexion et inscription — CHESSBAR" },
      { property: "og:description", content: "Crée ton compte ou connecte-toi pour retrouver ton profil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name || undefined } },
      });
      setBusy(false);
      if (error) return setMsg({ tone: "err", text: error.message });
      if (!data.session)
        return setMsg({ tone: "ok", text: "Compte créé. Confirme ton adresse via l'e-mail reçu." });
      navigate({ to: "/profile" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ tone: "err", text: "E-mail ou mot de passe incorrect." });
      navigate({ to: "/profile" });
    }
  }

  async function google() {
    setMsg(null);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) setMsg({ tone: "err", text: "Connexion Google impossible." });
    else if (!("redirected" in res && res.redirected)) navigate({ to: "/profile" });
  }

  const input =
    "w-full rounded-2xl bg-cream/50 px-3 py-3 text-[14px] text-foreground ring-1 ring-white/10 outline-none placeholder:text-bark/50";

  return (
    <AppShell>
      <AppHeader title="Compte" subtitle="Optionnel · sauvegarde ton profil" />
      <div className="space-y-3 px-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream/60 p-1 ring-1 ring-white/10">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 font-display text-[14px] font-bold ${mode === m ? "bg-cream text-foreground" : "text-bark"}`}
            >
              {m === "signin" ? "Connexion" : "Inscription"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-2.5 rounded-2xl bg-card p-4 ring-1 ring-white/10">
          {mode === "signup" && (
            <input className={input} placeholder="Pseudo" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          )}
          <input className={input} type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-2xl bg-brick px-3 py-3 font-display text-[15px] font-bold text-paper disabled:opacity-60">
            {busy ? "Patiente…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <button type="button" onClick={google} className="w-full rounded-2xl bg-cream px-3 py-3 font-display text-[15px] font-bold ring-1 ring-white/10">
          Continuer avec Google
        </button>

        {msg && (
          <p className={`rounded-2xl px-3 py-2.5 font-mono text-[11px] ring-1 ${msg.tone === "ok" ? "bg-pine/15 text-pine ring-pine/30" : "bg-brick/15 text-brick ring-brick/30"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </AppShell>
  );
}
