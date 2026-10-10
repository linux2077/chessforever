<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Online games are only accessed through server functions in src/lib/online.functions.ts (table locked by RLS) — player tokens must never reach other clients.
- Accounts are optional: no route is gated; sign-in lives at /auth and profiles are owner-only rows — the game must stay playable without an account.
- Netlify builds switch the server output preset via the NETLIFY env var in vite.config.ts — Lovable builds keep their own preset untouched.
