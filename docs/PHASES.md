# PHASES — SAINTWELL Web V1

Rules:

- One phase at a time. All work on main (no branches).
- A phase is done when every box is ticked AND Sam approves. Then Sam pushes main.
- Each phase ends with: `just check` ✅, `just test` ✅, PROGRESS.md updated.

Current phase: **Phase 1 — Brand assets**

---

## Phase 0 — Setup

Goal: empty project that runs locally with all tooling.

- [x] Git repo (private on GitHub), git user = Sam
- [x] `.claude/settings.json` with attribution off
- [x] Node 24 (`.nvmrc`), pnpm via corepack, `packageManager` field set
- [x] Vite + React + TypeScript (strict)
- [x] Tailwind CSS v4 working
- [x] Biome configured
- [x] Lefthook: Biome + type check + Gitleaks on commit
- [x] vitest + one sample test
- [x] Playwright + one sample test in `tests/e2e/` (answer **No** to Playwright's GitHub workflow)
- [x] `.mcp.json` with @playwright/mcp (`claude mcp add --scope project`)
- [x] Lighthouse CI config (`lighthouserc.json`) with targets
- [x] Justfile: `dev`, `check`, `test`, `lighthouse`
- [x] GitHub Actions CI: lint, type check, unit tests (no deploy)
- [x] Dependabot config
- [x] Folder structure per STRUCTURE.md; `brand/SAINTWELL.pdf` added
- [x] README with setup steps
- [x] Blank page with "SAINTWELL" runs with `just dev`

## Phase 1 — Brand assets

Goal: all brand images, colours and fonts ready to use.

- [ ] Install poppler-utils; `just assets` recipe (pdftoppm)
- [ ] Export 4 labels (green A/B, pink A/B), cropped to label edges, at 2048 px and 1024 px (WebP + PNG)
- [ ] Export logos: green wide, pink wide, stacked; SVG if possible, else PNG
- [ ] Export fallback jar images from pages 4 and 8 (WebP)
- [ ] Fonts (.woff2) in `public/fonts/` with `@font-face`
- [ ] Colour tokens in `globals.css` + `theme/tokens.ts` for green and pink themes
- [ ] `JarContext` (colour + label) with default Green + A
- [ ] `content/copy.ts` with label text and `[PLACEHOLDER]` items
- [ ] Simple test page showing logos, labels, colours, fonts (removed later)
- [ ] Sam checks the exports look right

## Phase 2 — 3D models

Goal: jar and gummy models ready as React components.

- [ ] Blender (pinned LTS) installed in WSL2; version written in DECISIONS.md
- [ ] `blender/build_jar.py`: body, rim, white screw cap (separate object), label mesh with correct UVs
- [ ] `blender/build_gummy.py`: soft rounded gummy
- [ ] `just models`: run Blender scripts → export `.glb` → gltf-transform → gltfjsx components
- [ ] Label texture wraps correctly for all 4 labels (no stretching, seam at back)
- [ ] Total model size within budget
- [ ] Screenshots of all 4 looks for Sam to approve

## Phase 3 — Hero scene

Goal: first screen works fully.

- [ ] Canvas + camera + lighting
- [ ] Jar slowly turning; cream background
- [ ] Green jar = opaque matte; pink jar = frosted see-through with gummies inside
- [ ] Jar picker (Green/Pink) + Label toggle (A/B); 4 looks swap smoothly
- [ ] Theme switch: colours, fonts, logo follow jar
- [ ] Header: wide logo desktop, stacked logo mobile
- [ ] Loading screen with stacked logo
- [ ] `useDeviceTier` (high/low/no-WebGL) wired in
- [ ] Keyboard + labels on picker and toggle
- [ ] fps check on desktop + phone

## Phase 4 — Scroll story

Goal: night → morning story works end to end.

- [ ] drei ScrollControls timeline
- [ ] Night falls: background fade, moon + stars
- [ ] Jar opens: cap lifts, gummies float out
- [ ] Ingredients: gummies drift to 3 cards
- [ ] Benefits: 3 items appear one by one
- [ ] Morning: fade to cream, badges appear
- [ ] Works in both themes
- [ ] Glow on moon/stars (high tier only)
- [ ] Reduced-motion version
- [ ] Scrolling smooth on desktop + phone

## Phase 5 — Content

Goal: all text and non-3D sections finished.

- [ ] About section (placeholders)
- [ ] Footer: contact, socials, FSSAI licence no., disclaimer (placeholders)
- [ ] All text comes from `copy.ts`
- [ ] Copy check: no health claims beyond the label (FSSAI)
- [ ] SEO: title, description, Open Graph image, favicon, headings, `public/robots.txt` (allow all)
- [ ] List of all placeholders for SAINTWELL to fill

## Phase 6 — Polish

Goal: fast, accessible, works everywhere.

- [ ] Low-tier version tested on a weak phone (or throttled)
- [ ] No-WebGL fallback works (static images)
- [ ] Reduced motion works
- [ ] Accessibility pass (keyboard, contrast, alt text, screen reader text)
- [ ] Lighthouse mobile: Perf ≥ 85, A11y ≥ 95, SEO ≥ 95
- [ ] 3D files ≤ 2 MB; first screen ≤ 2.5 s on 4G
- [ ] Playwright e2e: loads, picker works, scroll story runs, fallback shows
- [ ] Test on Chrome, Safari (iOS), Firefox, Android Chrome

## Phase 7 — Release

Goal: live on Netlify as v1.0.0.

- [ ] `netlify.toml` (build command, publish dir, cache headers for models/fonts)
- [ ] Netlify site linked to GitHub `main` (Sam does this)
- [ ] Production build checked locally (`pnpm build && pnpm preview`)
- [ ] Lighthouse on the live URL
- [ ] Add sitemap line to `robots.txt`
- [ ] CHANGELOG.md: v1.0.0 entry
- [ ] Tag `v1.0.0` (Sam pushes the tag)
- [ ] Hand-over note: placeholders still to fill
