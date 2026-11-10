# SAINTWELL Web

One-page brand site with a 3D Melatonin Gummies jar.

## Setup

1. WSL2 Ubuntu, Node 24 (`.nvmrc`), `corepack enable`
2. Install `just` and `gitleaks`
3. `pnpm install`
4. `pnpm exec lefthook install`
5. `pnpm exec playwright install chromium`
6. Blender 4.2.7 LTS: download the Linux tarball from blender.org and unpack it in your home folder (no sudo, snap or apt). Then tell `just` where it is:
   `export BLENDER=$HOME/blender/blender` (default: `blender` on PATH)

## Commands

- `just dev` — run locally
- `just check` — Biome + TypeScript
- `just test` — vitest + Playwright
- `just assets` — export brand images from the PDF
- `just models` — Blender → .glb → compress → React components (needs `BLENDER`)
- `just lighthouse` — local Lighthouse check

See `CLAUDE.md` and `docs/` for rules and plan.
