# Graph Report - PiriLight-Hero  (2026-08-04)

## Corpus Check
- 67 files · ~429,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 507 nodes · 749 edges · 34 communities (24 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1f21696`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PiriModel.tsx
- App.tsx
- NightSky.tsx
- devDependencies
- package.json
- compilerOptions
- support.js
- logoLayout.ts
- measure-logo-layout.mjs
- measure-abdomen.mjs
- recolor-glow.mjs
- measure-band-widths.mjs
- strip-cube-node.mjs
- analyze-logo.mjs
- decode-b64.mjs
- extract-textures.mjs
- find-bright-region.mjs
- design_system.py
- UI/UX Pro Max - Design Intelligence
- What You Must Do When Invoked
- graphify reference: extra exports and benchmark
- PiriLight Studio
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- CLAUDE.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- .claude/CLAUDE.md
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `clamp01()` - 19 edges
2. `PiriModel()` - 17 edges
3. `compilerOptions` - 16 edges
4. `UI/UX Pro Max - Design Intelligence` - 13 edges
5. `What You Must Do When Invoked` - 12 edges
6. `DesignSystemGenerator` - 11 edges
7. `/graphify` - 11 edges
8. `Reveal()` - 10 edges
9. `search()` - 9 edges
10. `walk()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `boot()` --references--> `react-dom`  [EXTRACTED]
  docs/references/luz-viva-system/support.js → package.json
- `createComponentFactory()` --references--> `react`  [EXTRACTED]
  docs/references/luz-viva-system/support.js → package.json
- `LogoRevealLayer()` --calls--> `getRevealProgress()`  [EXTRACTED]
  src/components/hero/IntroOverlay.tsx → src/lib/introTimeline.ts
- `PiriModel()` --calls--> `getHoverTargetFrac()`  [EXTRACTED]
  src/components/hero/PiriModel.tsx → src/lib/logoLayout.ts
- `PiriModel()` --calls--> `getModelScale()`  [EXTRACTED]
  src/components/hero/PiriModel.tsx → src/lib/logoLayout.ts

## Import Cycles
- None detected.

## Communities (34 total, 10 thin omitted)

### Community 0 - "PiriModel.tsx"
Cohesion: 0.07
Nodes (50): ABDOMEN_LOCAL, buildOrbitPoints(), ENTRANCE_POINTS, getGlowTexture(), NOSE_CORRECTION, ORBIT_CENTER, ORBIT_RADIUS, PiriModel() (+42 more)

### Community 1 - "App.tsx"
Cohesion: 0.07
Nodes (29): App(), Footer(), GlobalLightField(), Header(), SECTION_IDS, AboutSection(), FinalCTA(), MissionSection() (+21 more)

### Community 2 - "NightSky.tsx"
Cohesion: 0.09
Nodes (30): AmbientParticles(), buildSprite(), makeParticle(), Particle, Hero(), PiriModel, BeamLayer(), LogoRevealLayer() (+22 more)

### Community 4 - "devDependencies"
Cohesion: 0.09
Nodes (23): @gltf-transform/cli, @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions, devDependencies, @gltf-transform/cli, @gltf-transform/core, @gltf-transform/extensions (+15 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (23): motion, dependencies, motion, react, react-dom, @react-three/drei, @react-three/fiber, three (+15 more)

### Community 6 - "compilerOptions"
Cohesion: 0.09
Nodes (21): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+13 more)

### Community 7 - "support.js"
Cohesion: 0.07
Nodes (52): boot(), cdnScriptFor(), collectProps(), compileAttr(), compileTemplate(), contentKey(), createComponentFactory(), createExternalModules() (+44 more)

### Community 8 - "logoLayout.ts"
Cohesion: 0.18
Nodes (12): getHoverTargetFrac(), getLogoHeightPx(), getLogoWidthPx(), getModelScale(), LOGO_ASPECT, LOGO_BANDS, LOGO_WIDTH_BASE_PX, LOGO_WIDTH_CEILING_PX (+4 more)

### Community 9 - "measure-logo-layout.mjs"
Cohesion: 0.29
Nodes (4): bands, bg, img, rowDensity

### Community 10 - "measure-abdomen.mjs"
Cohesion: 0.33
Nodes (5): bodyMesh, count, io, pos, root

### Community 11 - "recolor-glow.mjs"
Cohesion: 0.47
Nodes (5): DEEP, HOT, lerp(), main(), smoothstep()

### Community 13 - "strip-cube-node.mjs"
Cohesion: 0.50
Nodes (3): cubeNode, io, root

### Community 21 - "design_system.py"
Cohesion: 0.06
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 22 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.05
Nodes (41): 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Layout & Responsive (HIGH), 5. Typography & Color (MEDIUM), 6. Animation (MEDIUM), 7. Style Selection (MEDIUM), 8. Charts & Data (LOW) (+33 more)

### Community 23 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 24 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 25 - "PiriLight Studio"
Cohesion: 0.25
Nodes (7): ⚠️ Editing the Hero, Getting started, PiriLight Studio, Production build, Project structure, Requirements, Where to edit things

### Community 26 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 27 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 28 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 29 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **189 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `react-dom` connect `package.json` to `support.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PiriModel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07137254901960784 - nodes in this community are weakly interconnected._
- **Should `NightSky.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09146341463414634 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._