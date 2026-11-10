# SAINTWELL Web

One-page brand site with a 3D Melatonin Gummies jar.

## Setup

1. WSL2 Ubuntu, Node 24 (`.nvmrc`), `corepack enable`
2. Install `just` and `gitleaks`
3. `pnpm install`
4. `pnpm exec lefthook install`
5. `pnpm exec playwright install chromium`

## Commands

- `just dev` — run locally
- `just check` — Biome + TypeScript
- `just test` — vitest + Playwright
- `just lighthouse` — local Lighthouse check

See `CLAUDE.md` and `docs/` for rules and plan.
