# SPEC — SAINTWELL Web V1

Status: Frozen (approved 2026-11-10). Changes need Sam's approval and a DECISIONS.md entry.

## 1. Goal

A one-page brand website for SAINTWELL, featuring a 3D Melatonin Gummies jar and a scroll story.

- Market: India (FSSAI rules apply)
- No backend, no shop, no forms, no analytics in V1
- Developed locally; deployed to Netlify at the end (Phase 7)

## 2. Brand source — `brand/SAINTWELL.pdf`

| Page | Content                                            | Type            | Use                           |
| ---- | -------------------------------------------------- | --------------- | ----------------------------- |
| 1    | Green logo (wide)                                  | Vector          | Header/desktop, green theme   |
| 2    | Green label A (dark olive, moon, benefits)         | Vector          | Jar texture                   |
| 3    | Green label B (white panel, moon in circle, hills) | Vector          | Jar texture                   |
| 4    | Green jar mockups                                  | Raster          | Reference + no-WebGL fallback |
| 5    | Pink logo (wide)                                   | Vector          | Header/desktop, pink theme    |
| 6    | Pink label A (white, pink bottom band)             | Vector          | Jar texture                   |
| 7    | Pink label B (blush, wavy hills, maroon arch)      | Vector          | Jar texture                   |
| 8    | Pink jar mockups (frosted, gummies visible)        | Raster          | Reference + no-WebGL fallback |
| 9    | Stacked logo + green jar                           | Vector + raster | Mobile header, loading screen |

### Colours

| Name       | Hex       | Theme                              |
| ---------- | --------- | ---------------------------------- |
| Dark olive | `#3E4A2F` | Green                              |
| Sage       | `#9BA56B` | Green                              |
| Maroon     | `#6A1F2B` | Pink                               |
| Pink       | `#D79AA8` | Pink                               |
| Light pink | `#E7C4CC` | Pink                               |
| Blush      | `#F9EFF2` | Pink                               |
| Cream      | `#F8F5EC` | Shared (morning / page background) |
| Dark olive 2 | `#2E3723` | Numbers scene background only (D-81) |
| White      | `#FFFFFF` | Shared                             |

### Fonts (Google Fonts, self-hosted .woff2)

- Green theme: Poppins (400, 500, 700) + Lora (700, 700 italic)
- Pink theme: Inter (400, 500, 700)

### Approved copy (from the label — the ONLY product text allowed)

- Melatonin Gummies — Advanced Sleep Support Formula
- "A tasty, easy-to-take gummy with Melatonin, Chamomile & Vitamin B6 to support restful sleep."
- 5 mg Melatonin · with Chamomile & Vitamin B6 · 30 Gummies · Nutraceutical
- Vegan · Gluten Free · Non GMO
- Calm Mind · Restful Sleep · Wake Refreshed
  Anything else = `[PLACEHOLDER]` until SAINTWELL supplies it.

## 3. Looks (jar picker)

- **Two jars side by side (D-57):** Green + Label A (left), Pink + Label A (right). No picker, no toggle. Label B is unused (BACKLOG #12).
- Same product in both colours.
- Night is split (D-62): olive left blending into maroon right, morning back to cream. Theme is split by side (D-58): left green (olive, sage, Poppins + Lora), right pink (maroon, pink, Inter). Shared elements (header, h1, subtitle) use the green theme.

## 4. Page sections (scroll story, Phase 4R, D-79)

One sticky stage, native scroll, 800vh (700vh below 640 px, D-95). Everything is a pure function of progress `p`; scrolling up plays it in reverse.

1. **Hero** — cream. A static poster of the scene (D-92/93) with the headline over it; the 3D loads behind it and cross-fades in on first scroll. Green jar stands left of centre, pink jar lies in front-right (cap right, ~25 % overlap, D-96), soft contact shadows, floating gummies. Two-tone `h1` "Restful" (olive) / "Sleep." (maroon) with the label lines under each. Giant faint "SAINTWELL" behind, scroll hints, social icons, "30 GUMMIES · NUTRACEUTICAL".
2. **Spin and settle** — jars spin slowly, move down and closer; headline fades out.
3. **Open** — caps unscrew; green gummies rise out of the neck, pink gummies roll out onto the ground.
4a. **Ingredients** (olive) — one big sage gummy at the centre, rest blurred. Blocks left: Melatonin 5 mg, Chamomile; right: Vitamin B6, "Tasty & easy to take". `h2` eyebrow "INGREDIENTS", step marker "01 INGREDIENTS / 02 BENEFITS".
4b. **Benefits** (maroon) — pink gummy takes its place. Blocks: Calm Mind, Restful Sleep; Wake Refreshed, "Advanced sleep support formula". `h2` "BENEFITS".
5. **Return** — gummies go back, caps close, background to dark olive.
6. **Numbers** (dark olive) — "AT A GLANCE": 5 mg Melatonin, 30 Gummies, "with Chamomile & Vitamin B6", badges Vegan (Leaf), Gluten Free (WheatOff), Non GMO (FlaskConical). Jars faded and dark behind.
7. **About** + 8. **Footer** — plain sections (Phase 5; stubs with `h2` + `[PLACEHOLDER]` until then).

Block bodies are `[PLACEHOLDER]`. Reduced motion and no WebGL: no canvas; the same content as static sections (D-85). Mobile: see D-82.

Header: wide logo on desktop, stacked logo on mobile. Loading screen: stacked logo.

## 5. 3D

- Built by Blender Python scripts (headless) in `blender/`. Exported `.glb` → compressed with gltf-transform → React components via gltfjsx.
- **Jar:** body + white screw cap + label as a separate mesh/material (texture swaps for 4 looks).
  - Green: opaque matte olive.
  - Pink: frosted, see-through, gummies visible inside (drei transmission material on high tier; frosted look without real transparency on low tier).
- **Gummy:** a gumdrop (round in plan, flat base, domed top, D-107), coloured to match the jar. Crowd drawn with instancing; fixed count per jar, none fade (D-110).
- Lighting done in the browser (no baked renders; laptop has no GPU).
- Background drawn inside the scene (D-94). In 4a/4b the canvas is CSS-blurred and drops to about 8 fps; no DOF, no Bloom (D-108). The hero gummy is a pre-rendered Blender turntable sprite (D-106) with a CSS radial glow.
- Gummy: fake jelly, sugar-dusted, never glossy (D-98, D-107). Caps settle on the ground beside their jars (D-109). Pink gummies land beside the jar, never through it (D-111).

### Device tiers

| Tier           | Who                    | What they get                                                   |
| -------------- | ---------------------- | --------------------------------------------------------------- |
| High           | Desktop, strong phones | Full scene, transmission, glow, 2048 px textures                |
| Low            | Weak phones            | No transmission, no glow, fewer gummies, 1024 px textures       |
| No-WebGL       | Very old devices       | Static jar images (PDF pages 4/8), normal sections              |
| Reduced motion | User setting           | No auto-rotation, no float; jar shown still, sections fade only |

## 6. Performance targets

- Lighthouse mobile (local): Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95
- All 3D files ≤ 2 MB total; textures ≤ 2048 px (desktop) / 1024 px (mobile)
- 60 fps desktop; 30+ fps mid-range phones
- First screen visible ≤ 2.5 s on 4G

## 7. Accessibility

- Keyboard: picker and toggle usable with Tab/Enter/arrows; visible focus
- Picker buttons have labels ("Green jar", "Label A")
- All text readable in both themes (WCAG AA contrast)
- 3D canvas has a text description; all story text is real HTML (not inside 3D)

## 8. SEO

- Title, description, Open Graph image, favicon
- One `h1`; real headings per section

## 9. Out of scope (V1)

Buying, cart, multiple products, forms, analytics, backend, CMS, other languages, blog. → see BACKLOG.md.

## 10. Toolkit

See CLAUDE.md "Approved tools".
