# PHASES — SAINTWELL Web V1

Rules:

- One phase at a time. All work on main (no branches).
- A phase is done when every box is ticked AND Sam approves. Then Sam pushes main.
- Each phase ends with: `just check` ✅, `just test` ✅, PROGRESS.md updated.

Current phase: **Phase 4R — Redesign**

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

- [x] Install poppler-utils; `just assets` recipe (pdftoppm)
- [x] Export 4 labels (green A/B, pink A/B), cropped to label edges, at 2048 px and 1024 px (WebP only)
- [x] Export logos: green wide, pink wide, stacked; SVG if possible, else PNG
- [x] Export fallback jar images from pages 4 and 8 (WebP)
- [x] Fonts (.woff2) in `public/fonts/` with `@font-face`
- [x] Colour tokens in `globals.css` + `theme/tokens.ts` for green and pink themes
- [x] `JarContext` (colour + label) with default Green + A
- [x] `content/copy.ts` with label text and `[PLACEHOLDER]` items
- [x] Simple test page showing logos, labels, colours, fonts (removed later)
- [ ] Sam checks the exports look right

## Phase 2 — 3D models

Goal: jar and gummy models ready as React components.

- [x] Blender (pinned LTS) installed in WSL2; version written in DECISIONS.md
- [x] `blender/build_jar.py`: body, rim, white screw cap (separate object), label mesh with correct UVs
- [x] `blender/build_gummy.py`: soft rounded gummy
- [x] `just models`: run Blender scripts → export `.glb` → gltf-transform → gltfjsx components
- [x] Label texture wraps correctly for all 4 labels (no stretching, seam at back)
- [x] Total model size within budget
- [x] Screenshots of all 4 looks for Sam to approve

## Phase 3 — Hero scene

Goal: first screen works fully.

- [x] Canvas + camera + lighting
- [x] Jar slowly turning; cream background
- [x] Green jar = opaque matte; pink jar = frosted see-through with gummies inside
- [x] ~~Jar picker + Label toggle~~ replaced by two jars side by side (D-57)
- [x] Theme: split by side, green as brand default (D-58)
- [x] Header: wide logo desktop, stacked logo mobile
- [x] Loading screen with stacked logo
- [x] `useDeviceTier` (high/low/no-WebGL) wired in
- [x] Keyboard + labels on picker and toggle
- [ ] fps check on desktop + phone (emulation only here, no GPU; real phone in Phase 6, see PROGRESS)

## Phase 4 — Scroll story

Goal: night → morning story works end to end.

- [x] Open/close timeline on native scroll (D-59)
- [x] Timeline extended to 900vh: night, cards, benefits, badges (pure, unit tested)
- [x] Split night: CSS layers, soft blend, diagonal on phones, AA contrast (D-62, D-64)
- [x] Moon + stars (moon cropped from PDF page 2, else code crescent)
- [x] Glow via postprocessing on high tier only; low tier sprite; none static
- [x] Ingredients: h2 + 3 cards, gummies drift toward them
- [x] Benefits: h2 + 3 items one by one
- [x] Morning: fade to cream, 3 badges (Leaf, WheatOff, FlaskConical)
- [x] Reduced motion + tier none: everything readable as static sections
- [x] Canvas stops when the stage is off screen
- [x] e2e: text at the right p, static modes, no external requests
- [x] Screenshots desktop + mobile stagger; report if 900vh is too long on mobile
- [ ] Sam approves

## Phase 4R — Redesign (D-79 to D-88)

Goal: storyboard look (`docs/design/storyboard/`), desktop 1440x900 and mobile.

- [x] Docs: decisions, SPEC, colour row, supersessions
- [x] Old Phase 4 look removed (moon, split night, cards)
- [x] Timeline: 7 scenes, pure, unit tested; `backgroundAt(p)`
- [x] Gummy rebuilt in Blender (hero + crowd, sugar normal map)
- [x] Ground + contact shadows; green standing, pink lying
- [x] Open: caps unscrew, green gummies rise, pink gummies roll out; return
- [x] Hero gummy (green 4a, pink 4b), fake translucency, glow
- [x] DOF + Bloom in own lazy chunk, high tier only; low-tier fade/shrink
- [x] Hero text, background word, hints, socials, blocks, step marker, Numbers + badges
- [x] Header nav, anchors (smooth, instant under reduced motion, scene fully in view), mobile menu, About/Contact stubs
- [x] Mobile layout
- [x] Static sections for reduced motion and tier none
- [x] Tests (unit + e2e), `just check`, `just test`, `just lighthouse`
- [x] Screenshots every scene, desktop + mobile (`.playwright-mcp/phase4r-*`)
- [ ] Sam approves

## Phase 4R fixes — Sam's GPU review (D-92 to D-102)

- [x] Docs: decisions, SPEC, PHASES
- [x] Timeline re-timed (caps open within ~100vh, no dead time), 800vh / 700vh, pure + tested
- [x] Jar layout: green left, pink front-right (~25 % overlap), labels readable, mobile scaled
- [x] Background inside the scene (no black on high), word plane, glow, bloom hero-only
- [x] Caps and gummies stay out of the text columns; floaters out of the headline rows
- [x] Gummy look: matte, sugar-dusted (hero + crowd)
- [x] Effects precompiled at idle, always mounted, passes off outside 4a/4b
- [x] ContactShadows fixed, dpr 1.5, r3f-perf lazy dev only, `?fps=1`, `just preview`
- [ ] Posters (`just poster`): rendered, **waiting for Sam's look before they are committed**; preloaded (both sizes, in `index.html`)
- [x] Poster hero, lazy 3D cross-fade, loader removed
- [x] Critically damped progress smoothing
- [x] Hero label on one line
- [x] Lighthouse temp dirs fixed + ignored
- [x] Tests, `just check`, `just test`, `just lighthouse`
- [x] Screenshots hero, 4a, 4b, desktop + mobile
- [ ] Sam approves

## Phase 4R fixes, round 2 (D-106 to D-114)

- [x] Docs: decisions, SPEC, PHASES
- [x] Gumdrop shape in Blender (crowd + hero mesh), models rebuilt
- [x] Jelly material for the crowd; sprite look approved by Sam (D-112)
- [ ] Hero turntable sprites (Cycles, 2 x 24 frames, spin + tilt rock): `just sprites b`, **Sam runs the render**; then commit `public/sprites/`, check the cross-dissolve for ghosting
- [x] Hero sprite component, CSS glow, hand-off pose, reduced motion (fail soft until the files exist)
- [x] 4a/4b blur + frame-rate drop; DOF / Bloom / postprocessing packages removed
- [x] Caps rest on the ground, close again; tests
- [x] Fixed gummy count, none fade; hero seat stays empty
- [x] Pink spill beside the jar; collider unit test
- [x] Static sections: sprite frame 00 as a still gummy (fail soft)
- [x] Posters re-rendered (`just poster`): **not committed, waiting for Sam's look**
- [x] Tests, `just check`, `just test`, screenshots (hero, open, 4a, 4b; desktop + mobile)
- [ ] Hand-off check with the real sprites (needs the render)
- [ ] Sam approves

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
