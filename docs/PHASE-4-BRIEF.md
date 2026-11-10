# Phase 4R — Redesign brief

Status: approved by Sam on 2026-11-10. Plan first, then code (CLAUDE.md golden rule 1).
Visual target: `docs/design/storyboard/` (4 PNGs exported from the storyboard canvas):
`1-hero.png`, `4a-ingredients.png`, `4b-benefits.png`, `6-numbers.png`.

## Why
Sam isn't happy with the Phase 4 look (moon, split night, cards). The new direction takes its cues from premium product scroll sites:
- one hero product
- big, confident type
- one background colour per scene
- lots of empty space
- an "exploded" feature layout with text on the left and right

## Keep from Phase 3/4
- The native-scroll sticky stage, and the pure, unit-tested timeline function of p.
- Tiers (high / low / none, `?tier=`), and software renderer → none.
- The lazy 3D chunk, and the canvas stopping off screen.
- Static sections for reduced motion and tier none.
- Lightformer lighting (no network), and the jar/label models with their fit logic.
- Real HTML text, AA contrast, and all copy in `copy.ts`.

## Remove
- Moon and stars (including the PDF moon crop), the split night layers, and the old ingredient/benefit cards.
- Badges at "morning". They move to the Numbers scene.
- Mark the replaced decisions as superseded in DECISIONS.md. Never delete them.

## Scenes (scroll order)

| # | Scene | Background | What happens |
|---|---|---|---|
| 1 | Hero | cream `#F8F5EC` + faint floor shade | Green jar stands. Pink jar lies on its side in front (cap pointing right). Both sit on a ground with soft, real contact shadows. A few gummies float (some slightly blurred). |
| 2 | Spin and settle | cream → starts shifting | Jars spin slowly, move down and closer. The headline fades out. |
| 3 | Open | shifting | Caps unscrew. The pink jar's gummies roll out onto the ground; the green jar's gummies rise out of the neck. |
| 4a | Green gummy: Ingredients | olive `#3E4A2F` | One sage gummy flies to the centre, large, slowly rotating, with a soft glow. Everything else blurs behind it (jars + gummies). Ingredient blocks appear left and right. |
| 4b | Pink gummy: Benefits | maroon `#6A1F2B` | The green gummy returns. A pink gummy takes its place, same treatment. Benefit blocks appear left and right. |
| 5 | Return | maroon → dark olive | All gummies go back into their jars. Caps close. |
| 6 | Numbers | dark olive (`#2E3723`, a darker shade of brand olive) | Jars faded and dark behind. Big "5 mg" Melatonin and "30" Gummies, "with Chamomile & Vitamin B6", then badges: Vegan (Leaf), Gluten Free (WheatOff), Non GMO (FlaskConical). |
| 7 | About + footer | — | Normal sections. Phase 5, not this phase. |

Scrolling up plays everything in reverse (pure function of p).

## Layout and type (match the storyboard)
- **Header:** logo left (real logo SVGs; turn white on dark scenes, D-73); nav right with "Ingredients", "Benefits", "About", "Contact" as in-page anchor links.
- **Background word:** a giant faint "SAINTWELL" behind each scene, decorative and `aria-hidden`.
- **Scroll hints:** vertical "SCROLL DOWN" on both edges in the hero. Social icons bottom-left (placeholder links). "30 GUMMIES · NUTRACEUTICAL" bottom-right.
- **Hero headline:**
  - Left: "Restful" in olive, Poppins 700, with "ADVANCED SLEEP SUPPORT FORMULA" under it.
  - Right: "Sleep." in maroon, Inter 800, with "5 mg Melatonin / with Chamomile & Vitamin B6" under it.
  - The h1 wraps both words for screen readers.
- **4a ingredient blocks:**
  - Left: "Melatonin 5 mg", "Chamomile".
  - Right: "Vitamin B6", "Tasty & easy to take".
  - Eyebrow h2: "INGREDIENTS". Step marker at the bottom: "01 INGREDIENTS / 02 BENEFITS".
- **4b benefit blocks** (Inter):
  - Left: "Calm Mind", "Restful Sleep".
  - Right: "Wake Refreshed", "Advanced sleep support formula".
  - Eyebrow h2: "BENEFITS".
- **Block body text** is `[PLACEHOLDER]` from `copy.ts`.
- **Numbers eyebrow:** "AT A GLANCE". Never "per jar" or "per gummy"; the label doesn't say that.
- **Copy rule:** only label text (CLAUDE.md brand rules). No new claims.

## 3D work
1. **Ground:** a ground plane with drei `ContactShadows` (or `AccumulativeShadows` if it looks clearly better and stays within budget). No network.
2. **Lying jar:** same model, rotated; keyframed in the timeline. No physics engine (not approved). Gummies "rolling out" follow keyframed curves with simple rotation.
3. **Gummy rebuild (Blender script, `just models`):**
   - A soft gumdrop or pillow shape like the storyboard drawing.
   - Enough geometry for a full-screen close-up.
   - A sugar-coated surface, via a small tiling normal/roughness texture made in Blender (CPU bake is fine) or a shader noise in three.js; pick one and log it.
   - Slightly translucent look (transmission or a soft-sheen fake on low tier).
   - Keep the instanced low-poly version for the crowd; the hero gummy can be the detailed version.
4. **Hero gummy glow:** Bloom on high tier; a soft radial sprite on low tier.
5. **Depth of field / blur behind the hero gummy:** postprocessing DepthOfField on high tier only. Low tier: fade and shrink the other objects instead. None tier: static.
6. **Background colour per scene:** CSS layers behind a transparent canvas, opacity driven by the progress MotionValue (same method as before). Remember the D-51 frosted-jar issue on a transparent canvas, and keep its fix.
7. **Jars feel alive:** gentle ease in/out on spins, a slight wobble when caps unscrew, and a small settle bounce when the lying jar is reached. Keep it subtle.

## Tiers / accessibility
- **High:** everything above.
- **Low:** no DOF, no Bloom (sprites instead), fewer gummies, 1024 textures, same timeline.
- **None and reduced motion:** static scenes in normal flow:
  - The hero image uses the PDF jar mockups (both jars). A composite of standing green + lying pink is fine if it's simple; otherwise side by side.
  - Ingredients and Benefits as two static sections with the same blocks and headings.
  - Numbers section.
  - Nothing hidden behind scroll.
- **Contrast:** AA on all backgrounds. Sage is only for large text, icons or borders on olive.

## Mobile
- **Plan first:** propose the mobile layout in the plan before building it. The storyboard is desktop only.
- **Expected:** headline stacked above the jars, jars smaller and centred, feature blocks stacked above and below the hero gummy (not left/right), and the numbers stacked.
- **Story height:** 800vh / 900vh stays (D-75) unless the new scenes need more; say so in the plan.

## Before starting
- Explain why the lazy three/drei chunk grew from 539 KB to 918 KB after the last fix, and whether it can shrink (e.g. by splitting postprocessing into its own chunk, loaded only on high tier).

## Done when
- All scenes match the storyboard closely on desktop at 1440×900; mobile matches the agreed plan.
- just check, just test, just lighthouse (fallback path) pass, except the known SEO item (Phase 5).
- Screenshots at each scene, desktop and mobile, in `.playwright-mcp/phase4r-*`.
- SPEC, PHASES (new 4R checklist), DECISIONS, PROGRESS and BACKLOG updated.
- Committed on main. Never push.