# PROGRESS — SAINTWELL Web

Claude Code: add a new entry at the TOP at the end of every session. Keep it short.

## Current state

- Phase: **1 — Brand assets**, built, waiting for Sam's check of the exports
- Branch: `main` (only branch)
- Blockers: none

---

## Session log

### 2026-11-10 — Phase 1 fixes
**Done**
- Stacked logo: cleaned source committed as `brand/logo-stacked.svg`; `just assets` recolours it into `logo-stacked-{green,pink}-{light,dark}.svg` (D-40). No more PDF line numbers.
- Test page shows all 4 (light on cream, dark on olive / maroon). Screenshot: `.playwright-mcp/phase1-logos-v2.png`.
- OFL licences confirmed in `public/fonts/`: OFL-poppins.txt, OFL-lora.txt, OFL-inter.txt.
- `just check` and `just test` pass.

**Next**
- Sam: check exports, approve, push. Then Phase 2.

---

### 2026-11-10 — Phase 1
**Done**
- `just assets` (poppler + cwebp) exports everything from the PDF. Crop boxes refined from pixel edges, not stretched.
- Labels (WebP, 2048 / 1024 wide): green-a 2048×772 / 1024×386; green-b 2048×699 / 1024×349; pink-a 2048×745 / 1024×372; pink-b 2048×614 / 1024×307. Total 0.5 MB.
- Logos (SVG, no background): logo-green-wide, logo-pink-wide, logo-stacked. Stacked logo: see Phase 1 fixes.
- Fallback jars (original embedded images, WebP, 820×1229): jar-green-a/b, jar-pink-a/b.
- Fonts in `public/fonts/` with OFL licences: Poppins 400/500/700, Lora 700/700 italic, Inter (one variable file, 400–700). Latin subset, from Google Fonts' gstatic URLs.
- `globals.css` (@font-face + colour/font tokens), `theme/tokens.ts`, `theme/JarContext.tsx` (default green + A), `content/copy.ts` (label text, rest `[PLACEHOLDER]`).
- Test page `src/components/AssetTestPage.tsx` (remove later). Screenshots: `.playwright-mcp/phase1-testpage-full.png`, `phase1-logos.png`.
- `just check` and `just test` pass. Console: only the favicon 404 (Phase 5).
- D-38, D-39 logged; CLAUDE.md Assets line and PHASES wording updated.

**Next**
- Sam: check exports, approve, push. Then Phase 2.

**Blockers / questions for Sam**
- Label A/B shapes differ (2.65–3.33:1); fit on the jar is a Phase 2 job.
- Page 9 jar photo not exported (only pages 4 and 8 are fallbacks).

---

### 2026-11-10 — Phase 0
**Done**
- Vite + React + TS strict, Tailwind v4, Biome, Lefthook (Biome, tsc, Gitleaks), vitest + Playwright samples, Playwright MCP, Lighthouse config, Justfile, CI, Dependabot, README.
- `just check` and `just test` pass. Blank "SAINTWELL" page runs.
- All versions pinned exactly.

**Next**
- Sam: create private GitHub repo, push, review. Then Phase 1.

**Checks**
- Screenshot via Playwright (project Chromium): cream page, olive "SAINTWELL", no console errors.
- Playwright MCP needs Google Chrome (not installed in WSL). Fix: `pnpm exec playwright install chrome` (needs sudo) or point MCP at Chromium.
- Lighthouse (mobile, local): Perf 100, A11y 100, Best Practices 100, SEO 82. SEO misses are `meta-description` (Phase 5 item) and `robots.txt` (not on any checklist, Sam to decide).
- Fixed `lighthouserc.json` (preset `perf` skipped A11y/SEO). Run on CHROME_PATH = Playwright's headless shell; Lighthouse reports a harmless "server timeout" warning.

**Final checks (later in session)**
- `just test`: 1 unit + 1 e2e pass.
- Playwright MCP (D-37, replaces D-36): `.mcp.json` has `--headless` only. No @playwright/mcp release matches stable Playwright 1.65.0, so the Chromium path is in a local-only server `playwright-chromium` (`claude mcp add --scope local`, stored in ~/.claude.json). On a new machine, re-add it with that machine's Chromium path. Dependabot groups the two Playwright packages. Screenshot OK; only console error is `favicon.ico` 404 (Phase 5 favicon).
- `.claude/settings.local.json` and `.playwright-mcp` now in `.gitignore`.
- New MCP tools appear only after restarting Claude Code; this session used a script to drive the same server.

**Blockers / questions for Sam**
- None. `robots.txt` added to Phase 5 (D-35).
- Lefthook added to `pnpm.onlyBuiltDependencies`.

**Decisions logged**
- D-32 to D-37.

---

### 2026-11-10 — Planning (done outside Claude Code)

**Done**

- Ground rules, scope, toolkit, 3D method, looks, scroll story, version plan, phases and performance targets agreed.
- Docs written: CLAUDE.md, SPEC, PHASES, DECISIONS, BACKLOG, CHANGELOG, STRUCTURE.

**Next**

- Start Phase 0: create repo, add docs + `brand/SAINTWELL.pdf`, set up tooling.

**Open items for SAINTWELL**

- About text, contact, socials, FSSAI licence no., footer disclaimer wording.

---

<!-- Template
### YYYY-MM-DD — Phase N
**Done**
-
**Next**
-
**Blockers / questions for Sam**
-
**Decisions logged**
- D-xx
-->
