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

- **Jar colour:** Green or Pink. **Label:** A or B. → 4 looks.
- Default on load: Green + Label A.
- Same product in both colours.
- Site theme follows jar colour: night colour (olive / maroon), accent colours, fonts, logo.
- Choice is remembered for the visit (in-memory; optional localStorage in try/catch).

## 4. Page sections (scroll story: "one scroll = one night's sleep")

1. **Hero** — cream background. 3D jar slowly turning. Logo, "Advanced Sleep Support Formula", jar picker + label toggle.
2. **Night falls** — background fades cream → night colour (olive or maroon). Moon and stars appear.
3. **Jar opens** — cap lifts, gummies float up.
4. **Ingredients** — gummies drift to 3 cards: Melatonin 5 mg, Chamomile, Vitamin B6. Card text = label text only + placeholders.
5. **Benefits** — Calm Mind, Restful Sleep, Wake Refreshed appear one by one.
6. **Morning** — background fades back to cream. Badges: Vegan, Gluten Free, Non GMO.
7. **About** — plain section, `[PLACEHOLDER]` company text. No 3D.
8. **Footer** — `[PLACEHOLDER]` contact, socials, FSSAI licence no., disclaimer line (to be confirmed by SAINTWELL).

Header: wide logo on desktop, stacked logo on mobile. Loading screen: stacked logo.

## 5. 3D

- Built by Blender Python scripts (headless) in `blender/`. Exported `.glb` → compressed with gltf-transform → React components via gltfjsx.
- **Jar:** body + white screw cap + label as a separate mesh/material (texture swaps for 4 looks).
  - Green: opaque matte olive.
  - Pink: frosted, see-through, gummies visible inside (drei transmission material on high tier; frosted look without real transparency on low tier).
- **Gummy:** one soft rounded shape, coloured to match the jar. Drawn with instancing.
- Lighting done in the browser (no baked renders; laptop has no GPU).
- Glow (postprocessing) on moon/stars only, high tier only.

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
