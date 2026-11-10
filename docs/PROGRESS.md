# PROGRESS — SAINTWELL Web

Claude Code: add a new entry at the TOP at the end of every session. Keep it short.

## Current state

- Phase: **3 — Hero scene**, built, waiting for Sam's review (see `git log origin/main..main`)
- Branch: `main` (only branch)
- Blockers: none

---

## Session log

### 2026-11-10 — Phase 3 follow-ups
**Done**
- Software WebGL renderer (SwiftShader, llvmpipe, "Software") = tier `none` (D-54); `?tier=` still overrides. Unit tests added. Playwright canvas tests now use `?tier=high`; one new test checks the default fallback in headless Chromium.
- CLAUDE.md performance budget: fps and Lighthouse-with-3D are measured in Phase 6 on real hardware; Phases 3-5 use `just lighthouse` on the page and fallback path, emulated fps reported only (D-55).
- pnpm build-script allow list moved to `pnpm-workspace.yaml` (`allowBuilds`: lefthook yes, sharp no, sharp loads fine). The pnpm warning and `ERR_PNPM_IGNORED_BUILDS` are gone (D-56).
- `just check` and `just test` pass (7 e2e). `just lighthouse` (now the fallback path on this machine): Perf 89, A11y 100, Best Practices 100, SEO 83 (meta description, robots.txt = Phase 5). Perf and SEO are not both gate-passing yet: SEO is a Phase 5 item.
- Phase 4 not started (you may change the 3D first).

**Next**
- Sam: review, approve, push. Phase 4 when you say.

---

### 2026-11-10 — Phase 3 (hero scene)
**Done**
- Hero replaces the Phase 1/2 test pages: header (wide/stacked logo), h1 + subtitle, jar picker (Green/Pink) + label toggle (A/B) as real buttons with radio-group semantics (arrows, roving tabindex), jar turning on cream. State in `JarContext`.
- `useDeviceTier` per your rules (D-48), `?tier=` override, unit tested. Fallback jar image when no WebGL. Three.js is lazy-loaded.
- Lightformer studio lighting, no outside requests (Playwright test checks every request is localhost). Green matte, white glossy cap. Pink: frosted `MeshTransmissionMaterial` + gummies (high), semi-transparent `MeshPhysicalMaterial` (low). All 4 labels preloaded; swap is instant.
- Theme follows the jar through CSS variables (colours, fonts, logo). Loader sits only over the jar area (D-49).
- Reduced motion (Motion hook): jar still, canvas on demand. Removed AssetTestPage, JarLookViewer, models.spec.
- Installed `motion` 14.10.1, `r3f-perf` 7.2.3 (D-53). D-48 to D-53 logged. `just check` and `just test` pass (vitest + 6 e2e).
- Screenshots (all 4 looks, desktop 1440 and mobile 390, reduced motion = front view): `.playwright-mcp/phase3-{green,pink}-{a,b}-{desktop,mobile}.png`. Turning view: `phase3-spin-*.png`.

**Measurements (this WSL machine has no GPU: software WebGL, numbers are pessimistic)**
- fps, 4s average, dev build with r3f-perf: desktop green high 10, pink high (transmission) 2-3, pink low 16; mobile 390 px, `?tier=low`, 4x CPU throttle: green 15, pink 21. **Not proof of 60 / 30 fps either way**; needs a real GPU and a real phone (Phase 6).
- Lighthouse mobile, with WebGL (software): **Perf 64**, A11y >= 95, SEO 83. Perf is low only because software rendering keeps the main thread busy (TBT huge); FCP 0.8 s, LCP 0.8 s, CLS 0.
- Lighthouse with `?tier=none` (no WebGL): Perf 89, A11y 100, Best Practices 100, SEO 83. SEO misses are `meta-description` and `robots.txt` (Phase 5 items).
- Console: only the known THREE.Clock warning (BACKLOG #11).

**Blockers / questions for Sam**
- Perf >= 85 cannot be shown on this machine with the 3D scene running. Options: (a) you run `just lighthouse` on a machine with a GPU; (b) treat a software renderer (SwiftShader/llvmpipe via `WEBGL_debug_renderer_info`) as tier `low`/`none`. (b) changes your tier rules, so I did not do it. Which one?
- `pnpm add` prints `ERR_PNPM_IGNORED_BUILDS` (lefthook, sharp) and warns that `pnpm.onlyBuiltDependencies` in package.json is no longer read by pnpm 12.11.2. This was already so before my changes (same error on the committed lockfile). Installs still work; I left the config alone. Want me to move it to the new place?
- Pink frosted gummies look blurry on purpose (frosted glass); the label covers the front, so gummies show above/below it and at the back with label A.

**Next**
- Sam: review screenshots and commits, answer the two questions, approve, push. Then Phase 4 (scroll story).

---

### 2026-11-10 — Gummy smoothness
**Done**
- Gummy raised to icosphere subdivision 3: **320 triangles** (was 80). `gummy.glb` 3.5 KB; all models 50 KB of the 2 MB budget. Jar unchanged. Phase 2 approved; next is Phase 3.

---

### 2026-11-10 — Phase 2 review fixes
**Done**
- Blender upgraded to **5.2.3 LTS** (tarball, sha256 checked, `~/blender-5.2.3`, `$BLENDER`). D-46 replaces D-41. Only API change: dropped deprecated `Material.use_nodes`. `just models` output is **byte-identical** to the 4.2.7 build: same triangles, bounding boxes, 48 KB total. Label fit tests unchanged and pass.
- `@types/three` added to CLAUDE.md approved tools (D-47). Jar proportions unchanged. BACKLOG #11: recheck THREE.Clock warning on r3f update.
- Correction: the gummy has **80 triangles**, not 320 as I wrote earlier (icosphere subdivision 2 = 80 faces). Geometry unchanged; docs fixed.
- Screenshot: `.playwright-mcp/phase2-looks-v2.png`. `just check` and `just test` pass.

**Next**
- Sam: approve, push. Then Phase 3.

---

### 2026-11-10 — Phase 2
**Done**
- Blender 4.2.7 LTS (tarball in `~/blender`) logged as D-41; `just models` uses `$BLENDER` (README example).
- `blender/build_jar.py`: Body (open neck, wall thickness, rounded bottom edge), Cap (separate, white, 48 ridges), Label (separate band, own material, UVs). `blender/build_gummy.py`: one low-poly pillow gummy (80 triangles).
- `just models`: Blender → .glb → gltf-transform (meshopt) → gltfjsx → `src/three/models/{Jar,Gummy}.tsx`. Total models **48 KB** (budget 2 MB).
- Label fit (`src/three/labelFit.ts`, unit tested): band height fixed, label centred at front, never stretched. pink-b covers 95 % of the circle, green-a 75 %. Uncovered part is at the back and the jar shows through.
- `LabeledJar` (own materials per jar), `Gummies` (InstancedMesh), temporary 4-look viewer `JarLookViewer` on the test page (front + back).
- D-42 to D-45 logged. `just check` and `just test` pass. Console: favicon 404 (Phase 5) and a THREE.Clock deprecation warning from r3f 9.8.2.
- Screenshot: `.playwright-mcp/phase2-looks.png`.

**Notes for Sam**
- `@types/three` added as the type package for `three` (D-42). Tell me if you want it removed.
- Cap and pink jar are plain materials for now. Frosted/transmission, final lighting, tiers and reduced motion are Phase 3.
- Cap lift (Phase 4): the exported mesh is quantised, so the cap node carries its own position. Move the node, not the geometry.

**Next**
- Sam: review the screenshot and commits, approve, push. Then Phase 3 (hero scene).

---

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
