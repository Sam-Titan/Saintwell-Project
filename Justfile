# Blender binary: set BLENDER to the path (see README); default is `blender` on PATH
blender := env("BLENDER", "blender")

dev:
    pnpm dev

check:
    pnpm exec biome check .
    pnpm exec tsc -b

test:
    pnpm exec vitest run
    pnpm exec playwright test

lighthouse:
    pnpm build
    pnpm exec lhci autorun

# Production build + preview: measure fps and loading here, not in dev (add ?fps=1 to the URL for an fps readout)
preview:
    pnpm build
    pnpm preview

# Render the hero posters (public/images/poster-*.webp) from the real scene. Needs a GPU for the sharpest frosted jar;
# works on any machine with Playwright's Chromium. Starts the dev server itself.
poster:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p blender/out
    POSTER=1 pnpm exec playwright test tests/e2e/poster.spec.ts
    cwebp -quiet -q 82 blender/out/poster-desktop.png -o public/images/poster-desktop.webp
    cwebp -quiet -q 82 blender/out/poster-mobile.png -o public/images/poster-mobile.webp
    ls -l public/images/poster-*.webp

# Export brand images from brand/SAINTWELL.pdf (poppler + cwebp). Crop boxes are in px at 288 dpi (4x the 1440x810 pt slides).
assets:
    #!/usr/bin/env bash
    set -euo pipefail
    pdf=brand/SAINTWELL.pdf
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    mkdir -p public/textures/labels public/images
    # labels: name page x1 y1 x2 y2 (label edges only, no slide background)
    while read -r name page x1 y1 x2 y2; do
      for w in 2048 1024; do
        read -r x y W H < <(awk -v x1=$x1 -v y1=$y1 -v x2=$x2 -v y2=$y2 -v w=$w 'BEGIN{k=w/(x2-x1); printf "%d %d %d %d\n", x1*k+0.5, y1*k+0.5, w, (y2-y1)*k+0.5}')
        r=$(awk -v x1=$x1 -v x2=$x2 -v w=$w 'BEGIN{printf "%.6f", 288*w/(x2-x1)}')
        pdftoppm -r "$r" -f "$page" -l "$page" -x "$x" -y "$y" -W "$W" -H "$H" -png -singlefile "$pdf" "$tmp/$name-$w"
        cwebp -quiet -q 90 "$tmp/$name-$w.png" -o "public/textures/labels/$name-$w.webp"
      done
    done <<'LABELS'
    green-a 2 176 676 5582 2715
    green-b 3 206 768 5592 2606
    pink-a 6 187 641 5573 2599
    pink-b 7 338 858 5422 2383
    LABELS
    # logos: SVG, page background removed, viewBox cropped to the logo
    for spec in "logo-green-wide 1 266 307 908 199" "logo-pink-wide 5 266 307 908 199"; do
      read -r name page x y w h <<<"$spec"
      pdftocairo -svg -f "$page" -l "$page" "$pdf" "$tmp/$name.svg"
      sed -E -e '/^<rect x="-144"/d' -e "s|^<svg (.*)width=\"[^\"]*\" height=\"[^\"]*\" viewBox=\"[^\"]*\">|<svg \1width=\"$w\" height=\"$h\" viewBox=\"$x $y $w $h\">|" "$tmp/$name.svg" > "public/images/$name.svg"
    done
    # wide green logo for dark scenes: white "Saint", sage "Well" stays
    sed -E 's/fill="rgb\(24\.308777%, 29\.019165%, 18\.429565%\)"/fill="#FFFFFF"/' public/images/logo-green-wide.svg > public/images/logo-green-wide-dark.svg
    # stacked logo: recolour brand/logo-stacked.svg (cleaned source, white Saint + sage Well) into 4 versions
    for spec in "green-light 3E4A2F 9BA56B" "green-dark FFFFFF 9BA56B" "pink-light 6A1F2B D79AA8" "pink-dark FFFFFF D79AA8"; do
      read -r name saint well <<<"$spec"
      sed -E -e "s/fill=\"rgb\(100%, 100%, 100%\)\"/fill=\"#$saint\"/" -e "s/fill=\"rgb\(60\.778809%, 64\.709473%, 41\.958618%\)\"/fill=\"#$well\"/" brand/logo-stacked.svg > "public/images/logo-stacked-$name.svg"
    done
    # fallback jars: original embedded images from pages 4 (green) and 8 (pink), A then B
    for spec in "green 4" "pink 8"; do
      read -r colour page <<<"$spec"
      pdfimages -png -f "$page" -l "$page" "$pdf" "$tmp/$colour"
      cwebp -quiet -q 85 "$tmp/$colour-000.png" -o "public/images/jar-$colour-a.webp"
      cwebp -quiet -q 85 "$tmp/$colour-001.png" -o "public/images/jar-$colour-b.webp"
    done

# Hero gummy turntable sprites (D-106): Blender Cycles (CPU, OIDN) -> PNG -> WebP with alpha in public/sprites/.
# Slow (about half an hour for 2 x 24 frames): run it detached, see README. variant = a | b | c (look, see blender/render_gummy.py)
sprites variant="a" frames="24" size="512" samples="128":
    #!/usr/bin/env bash
    set -euo pipefail
    rm -rf blender/out/sprites && mkdir -p blender/out/sprites public/sprites
    {{blender}} -b --factory-startup --python blender/render_gummy.py -- blender/out/sprites {{frames}} {{size}} {{samples}} all {{variant}}
    cat blender/out/sprites/render-times.txt | tail -1
    for f in blender/out/sprites/gummy-*.png; do
      cwebp -quiet -q 72 -alpha_q 85 -m 6 "$f" -o "public/sprites/$(basename "${f%.png}").webp"
    done
    echo "sprites: $(cat public/sprites/*.webp | wc -c) bytes in $(ls public/sprites | wc -l) files"

# Blender scripts -> .glb -> gltf-transform (meshopt) -> gltfjsx components. Fails if models exceed 2 MB.
models:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p blender/out public/models src/three/models
    for m in jar gummy; do
      {{blender}} -b --factory-startup --python "blender/build_$m.py" -- "blender/out/$m.glb" >/dev/null
      pnpm exec gltf-transform optimize "blender/out/$m.glb" "public/models/$m.glb" --compress meshopt --texture-compress false --simplify false --join false >/dev/null
      name="$(tr '[:lower:]' '[:upper:]' <<<"${m:0:1}")${m:1}"
      (cd public/models && pnpm exec gltfjsx "$m.glb" --types --keepnames -o "../../src/three/models/$name.tsx" >/dev/null)
      # gltfjsx output fixes: component name, public path, React 19 JSX types, drop three-stdlib GLTF type
      sed -i -E \
        -e "s|useGLTF(.preload)?\('[^']*/$m\.glb'|useGLTF\1(import.meta.env.BASE_URL + 'models/$m.glb'|" \
        -e "s|export function Model|export function $name|" \
        -e "s|JSX\.IntrinsicElements|React.JSX.IntrinsicElements|" \
        -e "/animations: GLTFAction/d" \
        -e "/import \{ GLTF \} from 'three-stdlib'/d" \
        -e "s|GLTF & \{|{|" \
        -e "s|\) as GLTFResult|) as unknown as GLTFResult|" \
        "src/three/models/$name.tsx"
      pnpm exec biome check --write --unsafe "src/three/models/$name.tsx" >/dev/null
    done
    # sugar textures baked by build_gummy.py (normal map + specks), WebP
    mkdir -p public/textures/gummy
    cwebp -quiet -q 92 blender/out/sugar-normal.png -o public/textures/gummy/sugar-normal.webp
    cwebp -quiet -q 85 blender/out/sugar-specks.png -o public/textures/gummy/sugar-specks.webp
    cwebp -quiet -q 88 blender/out/sugar-rough.png -o public/textures/gummy/sugar-rough.webp
    total=$(cat public/models/*.glb public/textures/gummy/*.webp | wc -c)
    echo "models + gummy textures: $total bytes (budget 2097152)"
    [ "$total" -le 2097152 ]
