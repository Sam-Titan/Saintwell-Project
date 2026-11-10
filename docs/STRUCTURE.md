# Directory Structure — SAINTWELL Web V1

Only the folders and the files we decide on are listed here.
Tools create the rest (see the bottom of this file). Claude Code organises sub-folders inside `src/` as it builds.

```
saintwell-web/
├── CLAUDE.md                # Rules for Claude Code (read first, every session)
├── README.md                # How to run the project (short)
├── Justfile                 # dev, check, test, lighthouse, assets (pdftoppm), models (Blender + gltf-transform + gltfjsx)
├── .nvmrc                   # Node 24
├── lighthouserc.json        # Lighthouse targets (perf 85, a11y 95, SEO 95)
├── .mcp.json                # Playwright MCP for Claude Code (claude mcp add --scope project)
│
├── .claude/
│   └── settings.json        # Attribution OFF, git push blocked
│
├── .github/
│   ├── workflows/ci.yml     # Lint, type check, unit tests (no deploy)
│   └── dependabot.yml
│
├── docs/                    # SPEC, PHASES, PROGRESS, DECISIONS, BACKLOG, CHANGELOG, STRUCTURE
│
├── brand/
│   └── SAINTWELL.pdf        # Source of truth for brand
│
├── blender/                 # (Phase 2)
│   ├── build_jar.py         # Jar body + cap + label mesh
│   ├── build_gummy.py       # Rounded gummy
│   └── out/                 # Raw .glb exports (git-ignored)
│
├── public/
│   ├── fonts/               # Poppins, Lora, Inter (.woff2)
│   ├── models/              # Compressed .glb
│   ├── textures/labels/     # green-a, green-b, pink-a, pink-b (2048 + 1024 px)
│   └── images/              # logos + no-WebGL fallback jars
│
├── src/
│   ├── content/copy.ts      # ALL site text; placeholders marked [PLACEHOLDER]
│   ├── theme/tokens.ts      # Colours per jar (green / pink)
│   ├── theme/JarContext.tsx # Jar colour + label (React Context)
│   ├── hooks/useDeviceTier.ts # high / low / no-WebGL
│   └── …                    # Sections, 3D scene, components — Claude Code organises
│
└── tests/
    └── e2e/                 # Playwright tests
                             # (unit tests sit next to the code: *.test.ts)
```

## Created by tools (do not hand-write)

| File(s)                                                                             | Created by                                                                               |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| package.json, tsconfig*.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx | `pnpm create vite` (React + TS template)                                                 |
| pnpm-lock.yaml                                                                      | pnpm                                                                                     |
| biome.json                                                                          | `biome init`                                                                             |
| lefthook.yml                                                                        | Lefthook setup                                                                           |
| playwright.config.ts                                                                | Playwright setup — **answer No to its GitHub Actions workflow** (we have our own ci.yml) |
| .mcp.json                                                                           | `claude mcp add --scope project`                                                         |
| src/…/Jar.tsx, Gummy.tsx                                                            | gltfjsx (from `just models`)                                                             |
| blender/out/*.glb                                                                   | Blender scripts                                                                          |

## Created later

- `docs/archive/v1/` — when V2 starts
- `netlify.toml` — Phase 7

## Not needed

- Custom reduced-motion hook → use Motion's `useReducedMotion`
- `scripts/` folder → one-line commands live in the Justfile
