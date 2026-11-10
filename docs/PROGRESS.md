# PROGRESS — SAINTWELL Web

Claude Code: add a new entry at the TOP at the end of every session. Keep it short.

## Current state

- Phase: **4R — Redesign** built, waiting for Sam's review and approval (see `git log origin/main..main`)
- Branch: `main` (only branch)
- Blockers: none

---

## Session log

### 2026-11-10 — Phase 4R fix round 2 (D-106 to D-114)
**Done**
- **Hero gummy = Blender turntable sprite** (Cycles CPU + OIDN; sage-lime / candy pink, smooth jelly, sparse sparkle, backlit, 38 deg + 10 deg rock). `blender/render_gummy.py` is final and committed; `just sprites b` renders 2 x 24 frames at 512 px, 128 samples (about 30 min, **Sam runs it**, README has the nohup command). `HeroSprite` (DOM canvas, cross-dissolve of neighbour frames, CSS glow, reduced motion = frame 0) is built and fails soft: until `public/sprites/` exists the 3D hero mesh stays visible. 3D hero and sprite share one pose function (`heroSpin`, `heroTilt`).
- **Crowd**: mid-detail gumdrop (1280 tris), rounder base, softer tinted rim, limited tilt.
- **4a/4b**: CSS blur (9 px desktop / 6 phone) + slight darkening on the canvas wrapper; canvas drops to about 8 fps while the hero gummy has the stage. DepthOfField, Bloom, `Fx.tsx`, `@react-three/postprocessing` and `postprocessing` removed (also from CLAUDE.md's list).
- **Caps** rest upside down on the ground beside their jars (green left, pink next to the mouth), below the text rows, and go back on at the end (`capDown` in the timeline).
- **Fixed gummy count** (18 / 8): nothing fades or shrinks; hero-shot floaters are crowd members; the hero's seat is empty only while the hero is out.
- **Pink spill**: out of the mouth, round to the ground in front of the jar. Collider unit test (hollow cylinder wall, many seeds, 400 steps per gummy).
- Static sections show sprite frame 00 as a still gummy with alt text (hidden if missing).
- Tests: vitest 85, Playwright 25 pass; `just check` clean.
- Screenshots: `.playwright-mcp/phase4r-r2-{d,m}-{hero,open,4a,4b}.png` (the 4a / 4b hero gummy is the 3D mesh until the sprites exist).
- Posters re-rendered with `just poster`; **not committed** (`public/images/poster-*.webp` modified in the working tree), please look.

**Not done / for Sam**
- Run the sprite render, then I check the hand-off (3D vs sprite at the same p), the cross-dissolve for ghosting (fallback: 36 frames at 448 px, stepped), bytes (target about 600 KB) and commit `public/sprites/`.
- No GPU here: real fps and the true frosted-jar look not measured.
- On phones the pink cap sits partly behind the right-hand text blocks (blurred); desktop is clear (tested).

---

### 2026-11-10 — GitHub Pages preview (D-103 to D-105)
**Done**
- Site works at any base path: `asset()` / `BASE_URL` for every `public/` URL, Vite `base` from `BASE_PATH` (D-103). Checked under `/Saintwell-Project/`: loads, canvas renders, no failed requests except the favicon (Phase 5).
- `pages.yml` is **manual only** (`workflow_dispatch`, D-104). Run it from the Actions tab.
- `noindex, nofollow` meta only in the Pages preview build (`NOINDEX=1` in the workflow, Vite plugin, D-105). Default build has none (checked); the Phase 7 Netlify build must not set `NOINDEX`.
- Hero posters committed. Stray text in `docs/PHASE-4-BRIEF.md` restored (Sam's OK).
- `just check`, vitest 54, Playwright 25 pass.

**Why the first Pages page was white:** Pages was serving the repo source (branch deploy) and `origin/main` had none of this work.

**Next (Sam)**
- Settings -> Pages -> Source = GitHub Actions; push; run "Deploy to GitHub Pages" from the Actions tab; open `https://sam-titan.github.io/Saintwell-Project/`.
- Still open from the fixes: `just preview` + `/?fps=1` numbers, approve Phase 4R.

---

### 2026-11-10 — Phase 4R fixes (Sam's GPU review, D-92 to D-102)
**Done**
- **Hero = poster + headline, no loader.** `LoaderPlate` and `LoadingScreen` deleted. The 3D lazy-loads at idle behind the poster and cross-fades in (350 ms) on the first real scroll (or when ready). The canvas stops rendering while the poster is up and unscrolled. `just poster` renders both posters from the real scene (`?poster=1`: frozen at p=0, no page text, max transmission quality; any machine with a GPU can run it). Both preloaded in `index.html` with media queries.
- **Retimed, 800vh / 700vh.** Caps first move at about 28vh and are well open by 100vh; no dead steps (tested). Jars only sway now (+-0.25 rad), so labels always read. The hero view starts raised so the jars sit lower under the headline and settle up as they open.
- **Layout.** Green stands left of centre; pink lies front-right and covers about 25 % of the green jar (tested through the real camera at 1.6, 16:9, 2.0). Mobile the same, scaled (frame widened so the pink cap is not clipped).
- **Black background fixed.** The scene draws its own background (`backgroundAt(p)` each frame, all tiers) and the giant SAINTWELL word is a canvas-texture plane (no network). Found and fixed two side effects of the opaque canvas: contact shadows cleared to opaque black (clear alpha 0), and the composer left `autoClear` off when switched off (ghost trapezoid on the ground; now forced on).
- **Effects.** Composer stays mounted, precompiled over 4 warm-up frames at idle, then `enabled=false` outside 4a/4b, with DOF and Bloom at 0. Bloom only catches the hero gummy's HDR rim (threshold 1.0); checked at cap lift on the high tier: caps do not bloom. A radial glow plane sits behind the hero gummy on all tiers.
- **Gummies matte, sugar-dusted.** Roughness map baked in Blender, sparkle map, no clearcoat, faked translucency (dark core, lighter rim). Crowd gummies share the material (UVs added; second material in Blender so gltf-transform does not join the meshes; `--join false`). Models + textures 195 KB.
- **Text columns.** In 4a/4b the caps tuck right behind the hero gummy and all crowd gummies float inside the centre band (unit tested). Hero floaters kept out of the headline and label rows (tested). The label line is on one line.
- **Performance.** `just preview` added. ContactShadows 1024 / 512 px, blur 3.2, plane offset, redrawn only while things move. dpr cap 1.5. r3f-perf is a lazy dev-only import (not in the production build; checked). `?fps=1` own readout with min / avg per scene (`window.__fps`).
- **Smoothing.** Critically damped spring (about 0.25 s), no scroll-speed limiting existed; text and 3D read the same smoothed value. Tested.
- **Lighthouse.** `/C:*` in `.gitignore`, Chrome profile in `/tmp` through `lighthouserc.json`: a run created no new dirs. The 3 old dirs are still in the repo root (ignored by git); delete with `rm -rf ./C:*lighthouse.*`.
- Tests: vitest 54, Playwright 25 pass (poster hero visible with no loader, cross-fade after first scroll, new anchors 0.38 / 0.60, etc.). `just check` passes. `just lighthouse` fallback path: Perf 92, A11y 100, BP 100, SEO 83 (Phase 5). Bundles (raw / gz): main 397 / 128 KB, HeroScene 166 / 54, three+drei 918 / 243, Fx 100 / 26.
- Screenshots: `.playwright-mcp/phase4r-fix-{d,m}-{hero,4a,4b}.png` (low tier), `fix3-high-12.png`, `fix2-high-38.png` (high tier: DOF + Bloom, no black).

**Not done / for Sam**
- **Posters not committed yet** (`public/images/poster-desktop.webp` 29 KB, `poster-mobile.webp` 23 KB; PNGs in `blender/out/`). Please look; if the frosted jar looks grainy on your GPU, run `just poster` there. Until they are committed the hero `<img>` 404s.
- **fps:** I cannot measure it (no GPU here). Please run `just preview`, open `/?fps=1`, scroll the whole story and send me the per-scene numbers (`window.__fps` in the console).
- The poster matches the 3D framing at 16:9-ish and phone shapes; at other aspect ratios the 0.35 s cross-fade shifts slightly.
- Low tier has no blur, the jars fade behind the hero gummy; text can sit over faded jars.

**Next**
- Sam: look at the posters, run `just preview` + `?fps=1`, approve and push. Then Phase 5.

---

### 2026-11-10 — Phase 4R (redesign)
**Done** (D-79 to D-91; SPEC, PHASES checklist, BACKLOG #13)
- 7 scenes on one pure timeline (hero, settle, open, 4a green hero gummy on olive, 4b pink hero gummy on maroon, return, Numbers on `#2E3723`); `backgroundAt(p)` drives the colour layer and the pink jar's transmission background. Old moon, split night, cards removed.
- Blender: crowd gummy (320 tris) + hero gummy (5120 tris), baked sugar normal map (WebP). Models + textures 164 KB total. Hero gummy has no transmission (sheen, clearcoat, inner glow).
- Green jar stands, pink jar lies in front (cap right), contact shadows. Pink gummies roll out, green ones rise; all return. The pink jar stays lying in 4a/4b (as in the brief; the storyboard blur could be read as upright).
- High tier: Bloom + DepthOfField in their own lazy chunk (Fx, 100 KB raw / 26 KB gz), fetched only on high. Low tier: fade + shrink + glow sprite. Reduced motion and tier none: no canvas, static sections (D-85).
- Header nav + anchors (Ingredients/Benefits land with the scene fully in view), phone hamburger menu (focus, Esc, scroll lock), About/Contact stubs, Inter 800 (D-89).
- Bundles (raw / gz): main 397 / 128 KB, HeroScene 168 / 54 KB, looks (three/drei) 918 / 243 KB, Fx 100 / 26 KB.
- Tests: vitest 43, Playwright 24 pass (each scene's text at its p, nav anchors, phone menu, static modes, no external requests, whole story at high tier). `just check` passes. `just lighthouse` (fallback path): only SEO 83 fails (Phase 5).
- Screenshots (low tier): `.playwright-mcp/phase4r-d-*.png` (desktop) and `phase4r-m-*.png` (mobile) at p = 0, 14, 26, 46, 66, 78, 100.

**Notes for Sam**
- No GPU here: high-tier look (DOF, Bloom, real frosted jar) and fps are only checked on real hardware in Phase 6. On low tier the jars fade behind the hero gummy instead of blurring, so block text sits partly over faded jars on desktop.
- 900vh / 800vh feels long but workable; shorten in Phase 6 if real phones feel slow.
- Mobile Numbers: faded jars still show faintly behind the badges.

**Next**
- Sam: review (`git log origin/main..main`), approve, push. Then Phase 5.

---

### 2026-11-10 — Phase 4 review fixes
**Done** (D-74 to D-78)
- No-WebGL path no longer loads drei/three: `LoaderPlate` (plain stacked logo) is the Suspense fallback; the `useProgress` bar moved into the lazy 3D chunk (`src/three/LoadingScreen.tsx`). Main bundle (raw / gzip): **774 KB / 229 KB -> 384 KB / 125 KB**. Lazy chunks: HeroScene 261 -> 267 KB (82 KB gz), Texture (three/drei) 539 -> 918 KB (243 KB gz), both only fetched when WebGL exists.
- `lighthouserc.json`: 3 runs, median. Fallback path: Perf 78 / 91 / 94 (**median 91**), A11y 100, BP 100, SEO 83 (Phase 5 item; the only failing assertion).
- Camera frame: 19 % clear band above the cap tops at full lift (18 % measured, desktop 143 px of 810, mobile 150 px of 844), 6 % below the jars. Caps never near the edge; cap lift unchanged. Gummy float capped (2.6-3.6 jar units, cap tops at 4.16), out of the band; unit tested. Headings sit in the band.
- Story height 800vh below 640 px, 900vh above (D-75). D-73 approved. CLAUDE.md git rule added (D-78).
- Tests: vitest 35, Playwright 20 pass. Fixed test flakiness (dev perf overlay adds a second canvas; longer waits for the slower lazy load).
- Screenshots (low tier): `.playwright-mcp/phase4b-{desktop,mobile}-p{30,40,50}.png`.

**Next**
- Sam: review, approve, push. Then Phase 5.

---

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
- **900vh on mobile (now 800vh, D-75):** I cannot judge feel on a laptop. By numbers: 8 phone screens of scrolling; each card or benefit gets about 63vh (about 530 px on a phone). I think 750-800vh is enough for phones (about 52vh per item); desktop is fine at 900. Say the word and I change one number.
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
