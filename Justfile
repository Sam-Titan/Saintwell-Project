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
