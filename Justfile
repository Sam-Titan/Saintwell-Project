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
