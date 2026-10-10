import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AccountCard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(data.user ?? null);
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle();
        if (alive) setName(p?.display_name ?? null);
      }
      setReady(true);
    }
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-white/10">
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bark/70">Compte</p>
        <p className="mt-1 truncate font-display text-[15px] font-bold">
          {user ? (name ?? user.email) : "Invité · sans compte"}
        </p>
      </div>
      {user ? (
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/", replace: true });
          }}
          className="rounded-xl bg-cream px-3 py-2 font-display text-[13px] font-bold ring-1 ring-white/10"
        >
          Déconnexion
        </button>
      ) : (
        <Link to="/auth" className="rounded-xl bg-brick px-3 py-2 font-display text-[13px] font-bold text-paper">
          Se connecter
        </Link>
      )}
    </div>
  );
}
