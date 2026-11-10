# PROGRESS — SAINTWELL Web

Claude Code: add a new entry at the TOP at the end of every session. Keep it short.

## Current state

- Phase: **4 — Scroll story** built, waiting for Sam's review and approval (see `git log origin/main..main`)
- Branch: `main` (only branch)
- Blockers: none

---

## Session log

### 2026-11-10 — Phase 4 (scroll story)
**Done** (D-62 to D-73 logged; SPEC and PHASES updated)
- Timeline (pure, unit tested) now 900vh: night 0.06-0.14, caps 0.12-0.22, gummies out 0.18-0.34, 3 cards 0.31-0.58, 3 benefits 0.58-0.79, gummies sink 0.76-0.84, caps close 0.82-0.88, morning 0.86-0.94, badges 0.90-0.97. Cards and benefits never show together; scroll up plays it in reverse.
- Split night: two CSS layers behind a transparent canvas (`NightSky.tsx`), wide soft left-to-right blend, diagonal on the phone layout. Frosted pink jar gets the colour behind it as its transmission `background`, so the glass is not black. White text passes AA on olive, maroon and the blend (contrast unit test). Header logo turns white at night (D-73).
- Moon cropped from PDF page 2 (`public/images/moon.svg` via `just assets`, D-72) + 46 stars. High tier: bloom via `@react-three/postprocessing` (3.2.2, + `postprocessing` 6.39.6, `lucide-react` 1.71.0, all pinned). Low tier: soft sprite, no postprocessing. None / reduced motion: no sky.
- Ingredients (h2 + 3 cards, `[PLACEHOLDER]` bodies), Benefits (h2 + 3 items), badges (Leaf, WheatOff, FlaskConical). Real HTML in reading order; gummies drift toward the active card.
- Reduced motion and tier none: same components as normal static sections (no sticky stage). Canvas stops when the story is off screen.
- Tests: vitest 34 (timeline, contrast), Playwright 20 (each item at its p, night opacity both ways, static modes, h2s, whole story at high tier with no external requests). `just check` and `just test` pass.
- Screenshots: `.playwright-mcp/phase4-{desktop,mobile}-p{000..100}.png` (11 moments each; low tier), `phase4-{reduced,none}-{desktop,mobile}-full.png`.
- `just lighthouse` (fallback path, needs `CHROME_PATH` = Playwright headless shell here): Perf 79-87 across runs (was 93; noisy, main bundle only +10 KB, LCP is the fallback jar image), SEO 83 (Phase 5), A11y and BP passed.

**Notes for Sam**
- **900vh on mobile:** I cannot judge feel on a laptop. By numbers: 8 phone screens of scrolling; each card or benefit gets about 63vh (about 530 px on a phone). I think 750-800vh is enough for phones (about 52vh per item); desktop is fine at 900. Say the word and I change one number.
- Main bundle is 774 KB because `LoadingScreen` imports drei. Moving it into the lazy 3D chunk would cut the no-WebGL path a lot (Phase 6 candidate; not done, it changes when the loader appears).
- High tier on this machine is software GL (3 fps): the frosted pink jar looks grainy and the bloom adds a faint haze. Needs a real GPU look in Phase 6. Alpha stays transparent with bloom, so the CSS night shows through.
- Desktop: tops of the lifted caps touch the top edge at p 0.3-0.5 (frame was fitted in Phase 3); "Ingredients"/"Benefits" headings sit over gummies. Tell me if you want either moved.
- Sage on olive is 3.6:1: used only for card borders and icons. Card/benefit bodies are white.

**Next**
- Sam: review screenshots + commits, decide on 900 vs 750-800vh, approve, push. Then Phase 5 (About, footer, SEO, copy check).

---

### 2026-11-10 — Two jars + scroll open/close
**Done**
- Docs first: D-57 (Green A + Pink A side by side, picker/toggle gone), D-58 (split theme, green = brand default for shared elements), D-59 (native scroll replaces drei ScrollControls; D-23 superseded; timeline), D-60 (`JarContext` holds scroll progress), D-61 (staggered layout on phones). SPEC sections 3 and 4, PHASES, BACKLOG #12 updated.
- `src/three/storyTimeline.ts` (pure, unit tested): hero 0-0.10, caps lift 0.10-0.28, gummies out 0.22-0.55, hold 0.55-0.72, gummies back 0.72-0.88, caps close 0.88-1. Headline fades out at p ~0.06-0.12 and returns when scrolling up.
- `Story.tsx`: 500vh section + sticky stage; Motion `useScroll` + `useSpring` (steady on keyboard jumps) -> progress. Canvas reads it in `useFrame`, no React re-render per tick. Two jars, caps lift and unscrew, sage / pink gummies (instanced, per jar) rise through the neck and sink back. Jars turn in the hero, ease to face front while open, turn again at the end.
- Camera fits the frame (jars + lifted caps + gummies) to any screen. Phones (< 640 px): staggered layout (pink behind and lower), jars about 30 % bigger than side by side. Both shown in screenshots.
- Tiers: none = two images side by side (no tall scroll); low = same timeline, 8 gummies per jar, no transmission; reduced motion = still closed jars, no tall scroll, headline stays.
- Removed: RadioGroup, Hero, GummiesInside, picker copy, colour/label state. Three.js stays out of the main bundle (labels preloaded by dynamic import).
- `just check` and `just test` pass (vitest 26+, 9 e2e: scroll drives progress, small wheel step stays under 0.1, PageDown/Space/ArrowDown/End all drive the story, no external requests, fallback, low, reduced motion).
- Screenshots (p = 0, 20, 40, 60, 80, 100 %): `.playwright-mcp/story-desktop-side-p*.png`, `story-mobile-side-p*.png`, `story-mobile-stagger-p*.png`.
- `just lighthouse` (fallback path here): Perf 93, A11y 100, BP 100, SEO 83 (meta description, robots.txt: Phase 5).

**Notes for Sam**
- Keyboard scrolling works, but in **high** tier on this no-GPU machine the page is too slow (2-3 fps) to react to keys in time, so that e2e test uses `?tier=low`. Needs a real GPU check in Phase 6.
- Split theme exists as a rule (D-58); nothing uses the pink side colours yet. They appear in the night fade / cards (rest of Phase 4).
- Gummy size and cap lift (1.3 units) are my first guess; tell me if you want them bigger/smaller. Green gummies show only outside the jar (opaque jar).
- fps still software only: not measured as a gate (D-55).

**Next**
- Sam: review screenshots + commits, approve, push. Then the rest of Phase 4 (night/morning fade, moon/stars, ingredient cards, benefits, badges, About, Footer) on this timeline.

---

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
