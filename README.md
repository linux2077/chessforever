# CHESSBAR

Mobile-first chess app: bots with Elo levels, local 2-player, live online rooms, AI coach, optional accounts.

**Licensed under the [GNU GPL v3](./LICENSE) — free to use, study, modify and share, as long as derivatives stay open source.** Contributions are welcome (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

## Run locally

```bash
bun install
bun run dev
```

## GitHub

Connect the project to GitHub from the Lovable editor (Git sync). Every change is pushed to the repository automatically. To work locally:

```bash
git clone <your-repo-url>
bun install
bun run dev
```

Push to the default branch and the change syncs back to Lovable automatically.

## Netlify

1. Netlify → Add new site → Import from GitHub → pick this repository.
2. Build settings are read from `netlify.toml` (`bun install && bun run build`, output `dist`, Nitro preset `netlify` via the `NETLIFY` env var).
3. Add every variable listed in `.env.example` under Site configuration → Environment variables.
4. Deploy.

Notes:
- Online rooms need `SUPABASE_SERVICE_ROLE_KEY` and the AI coach needs `LOVABLE_API_KEY`; both are server-only and are not available from Lovable Cloud, so those two features stay inactive on Netlify.
- Bots, local 2-player and accounts work everywhere.
- Publishing with Lovable keeps every feature active.

## License

CHESSBAR is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3 of the License (see [LICENSE](./LICENSE)).

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the LICENSE file for more details.

If you distribute CHESSBAR or a modified version of it, you must make the corresponding source available under the same license.

Copyright (C) 2026 CHESSBAR contributors.
