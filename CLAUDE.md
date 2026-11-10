# CLAUDE.md — SAINTWELL Web (V1)

You are building the SAINTWELL brand website: one page with a 3D Melatonin Gummies jar and a scroll story.
Owner: Sam. Client: SAINTWELL. Market: India.

## Read first, every session

1. `docs/PROGRESS.md` — where we left off
2. `docs/PHASES.md` — current phase and its checklist
3. `docs/SPEC.md` — what we are building
4. `docs/DECISIONS.md` — what is already decided (do not re-decide)

## Golden rules

1. **Discuss → decide → log → build.** Never write code for something not in SPEC or DECISIONS. If unsure, stop and ask Sam.
2. **One phase at a time.** Work only on the current phase. A phase is done only when every checklist item passes AND Sam approves.
3. **Log decisions.** Any new decision goes in `docs/DECISIONS.md` (date, decision, reason, rejected options).
4. **Update `docs/PROGRESS.md` at the end of every session.**
5. **Scope is frozen.** New ideas go to `docs/BACKLOG.md`, not into the code.
6. **Keep answers short and simple.**

## Tools

- Use ONLY the tools in "Approved tools" below.
- Need anything else (npm package, CLI, library)? **Ask Sam first.** If approved, add it to DECISIONS.md and to the list below.
- Pin exact versions (no `^` or `~` in package.json).
- Use `pnpm` only (never npm or yarn). Run tasks with `just`.

### Approved tools (V1)

- Setup: WSL2 (Ubuntu), Node 24, pnpm (corepack), just, Git + GitHub, Lefthook + Gitleaks
- Frontend: Vite, React, TypeScript, Tailwind CSS v4, lucide-react, Motion
- 3D: three, @types/three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, r3f-perf (dev only), Blender (pinned LTS, headless), @gltf-transform/cli, gltfjsx
- Assets: poppler-utils (pdftoppm, pdftocairo, pdfimages), webp (cwebp)
- Quality: Biome, vitest, Playwright, @playwright/mcp, @lhci/cli, GitHub Actions, Dependabot
- Hosting: Netlify (Phase 7 only)

### Not allowed in V1

No backend, Python packages (Blender's built-in Python is fine), uv, Zustand, React Router, GSAP, shadcn, TanStack Query, form libraries, analytics, Docker, any AI/LLM SDK.

## Git rules (strict)

- Commits are made as Sam's git user. **Never** add `Co-Authored-By`, "Generated with Claude Code", or any Claude/Anthropic mention in commits, PRs, tags, or code comments.
- **You may commit. You must NEVER push.** Sam pushes.
- Work on main only. No phase, feature or fix branches. Unpushed commits on main = work under review; Sam reviews them (git log origin/main..main) and pushes when the phase is approved.
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Small commits.
- Never use `--no-verify`. If a hook fails, fix the cause.
- Never commit secrets, `.env`, or files in `blender/out/`.
- Never run `git stash`, `reset`, `rebase`, `checkout -- .` or other history/working-tree rewriting commands without asking Sam.

## Brand rules

- Source of truth: `brand/SAINTWELL.pdf` (9 pages). Page map is in SPEC.md.
- Use ONLY the colours and fonts in SPEC.md. No new colours.
- **All site text lives in `src/content/copy.ts`.**
- **Never write health claims.** Use only text printed on the label. No "cures", "treats", "insomnia", "clinically proven", dosage advice, or anything not on the pack. Unknown text = placeholder marked `[PLACEHOLDER]`.
- Follow FSSAI nutraceutical rules (India): no disease-cure claims.

## Code rules

- TypeScript strict. No `any` without a comment explaining why.
- Shared jar state via `src/theme/JarContext.tsx` (React Context). No other state library.
- 3D models come only from `blender/` scripts → `just models` (gltf-transform → gltfjsx). Never hand-edit generated model components except where marked.
- Every 3D feature must have: a low-tier version (weak phones), a no-WebGL fallback (static image), and a reduced-motion version (no auto-animation).
- Reduced motion: use Motion's built-in `useReducedMotion` hook. Do not write your own.
- Folder layout: follow `docs/STRUCTURE.md`. Let tools create their own config files; don't hand-write them. No `scripts/` folder; short commands go in the Justfile.
- Accessibility: keyboard works, focus visible, alt text, buttons have labels, contrast passes.

## Performance budget (must pass before a phase that touches 3D is done)

- Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95 (run locally)
- All 3D files ≤ 2 MB total. Textures ≤ 2048 px desktop, ≤ 1024 px mobile
- 60 fps desktop, 30+ fps mid-range phones (check with r3f-perf)
- First screen visible ≤ 2.5 s on 4G
- **Where measured:** this laptop has no GPU (software WebGL → tier `none`). Phases 3–5: `just lighthouse` checks the page and the fallback path; emulation fps are reported but are not a gate. Phase 6: fps and Lighthouse-with-3D are measured on real hardware (headed Chrome with a GPU + a real phone).

## Commands

- `just dev` — run locally
- `just check` — Biome + TypeScript
- `just test` — vitest + Playwright
- `just assets` — export brand images from the PDF
- `just models` — run Blender scripts + compress models
- `just lighthouse` — local Lighthouse check

## Checking your work

- Use Playwright MCP (set up in `.mcp.json`) to open the local site, take screenshots, and read console errors before saying something is done.
- Run `just check` and `just test` before every commit.

## End of session

1. Update `docs/PROGRESS.md` (done / next / blockers).
2. Log any new decisions in `docs/DECISIONS.md`.
3. Commit (don't push). Tell Sam what to review.
