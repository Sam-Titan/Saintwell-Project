# PROGRESS — SAINTWELL Web

Claude Code: add a new entry at the TOP at the end of every session. Keep it short.

## Current state

- Phase: **0 — Setup** (built, awaiting Sam's review; GitHub repo not created yet)
- Branch: `phase/0-setup`
- Blockers: none

---

## Session log

### 2026-11-10 — Phase 0
**Done**
- Branch `phase/0-setup`; Vite + React + TS strict, Tailwind v4, Biome, Lefthook (Biome, tsc, Gitleaks), vitest + Playwright samples, Playwright MCP, Lighthouse config, Justfile, CI, Dependabot, README.
- `just check` and `just test` pass. Blank "SAINTWELL" page runs.
- All versions pinned exactly.

**Next**
- Sam: create private GitHub repo, push, review. Then Phase 1.

**Blockers / questions for Sam**
- GitHub repo not created (needs your login). `gh` is not authenticated.
- Lefthook needed `pnpm exec lefthook install` (pnpm blocks its build script).
- Biome ignores docs/, brand/, public/ (it had reformatted the docs once; whitespace only).
- Tool versions in package.json are exact pins of latest at install time.

**Decisions logged**
- None.

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
