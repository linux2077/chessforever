# Contributing to CHESSBAR

Thanks for your interest in contributing! Everyone is welcome.

## How to contribute

1. Fork the repository (or work on a branch if you have write access).
2. Create a branch for your change: `git checkout -b my-feature`.
3. Make your changes and check that the app still builds:
   ```bash
   bun install
   bun run lint
   bun run build
   ```
4. Open a Pull Request describing what you changed and why.

## Guidelines

- Keep the app playable **without an account** — sign-in must always stay optional.
- Follow the existing code style (Prettier + ESLint: `bun run format`, `bun run lint`).
- Never commit secrets. The `.env` file is git-ignored; use `.env.example` as a template.
- The interface is in French — keep new user-facing strings in French.

## Reporting bugs

Open an issue with what you did, what you expected, and what happened. Screenshots help a lot.

## License

By contributing, you agree that your contributions are licensed under the MIT License (see [LICENSE](./LICENSE)).
