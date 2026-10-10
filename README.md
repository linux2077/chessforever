# CHESSBAR

Mobile-first chess app: bots with Elo levels, local 2-player, live online rooms, AI coach, optional accounts.

## Run locally

```bash
bun install
bun run dev
```

## GitHub

Connect the project to GitHub from the Lovable editor (Git sync). Every change is pushed to the repository automatically.

## Netlify

1. Netlify → Add new site → Import from GitHub → pick this repository.
2. Build settings are read from `netlify.toml` (preset `netlify`, output `dist`).
3. Add every variable listed in `.env.example` under Site configuration → Environment variables.
4. Deploy.

Note: online rooms need `SUPABASE_SERVICE_ROLE_KEY` and the coach needs `LOVABLE_API_KEY`; both are server-only.
