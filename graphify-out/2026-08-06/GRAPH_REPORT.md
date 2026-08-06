# Graph Report - PiriLight-Hero  (2026-08-06)

## Corpus Check
- 82 files · ~455,987 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 983 edges · 43 communities (32 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68f4aab2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PiriModel.tsx
- Header.tsx
- App.tsx
- vercel.json
- devDependencies
- package.json
- compilerOptions
- support.js
- ProjectEnquiryForm.tsx
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
- logoLayout.ts
- NightSky.tsx
- Reveal.tsx
- router.tsx
- ProjectDetailPage.tsx
- PrinciplesSection.tsx
- ProcessSection.tsx
- ServicesSection.tsx

## God Nodes (most connected - your core abstractions)
1. `clamp01()` - 29 edges
2. `PiriModel()` - 18 edges
3. `compilerOptions` - 16 edges
4. `UI/UX Pro Max - Design Intelligence` - 13 edges
5. `Reveal()` - 12 edges
6. `easeOutCubic()` - 12 edges
7. `What You Must Do When Invoked` - 12 edges
8. `DesignSystemGenerator` - 11 edges
9. `/graphify` - 11 edges
10. `PiriAboutScene()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `boot()` --references--> `react-dom`  [EXTRACTED]
  docs/references/luz-viva-system/support.js → package.json
- `createComponentFactory()` --references--> `react`  [EXTRACTED]
  docs/references/luz-viva-system/support.js → package.json
- `getSubjectOpacity()` --calls--> `clamp01()`  [EXTRACTED]
  src/lib/scrollTimeline.ts → src/lib/introTimeline.ts
- `AppRoutes()` --calls--> `getProjectBySlug()`  [EXTRACTED]
  src/App.tsx → src/data/portfolio.ts
- `BeamLayer()` --calls--> `getAbdomenCharge()`  [EXTRACTED]
  src/components/hero/IntroOverlay.tsx → src/lib/introTimeline.ts

## Import Cycles
- None detected.

## Communities (43 total, 11 thin omitted)

### Community 0 - "PiriModel.tsx"
Cohesion: 0.06
Nodes (83): applyWingFlap(), flapQuat, FLIGHT_POINTS_FRAC, PiriAboutScene(), PiriAboutSceneProps, REDUCED_MOTION_START, setOpacity(), twistQuat (+75 more)

### Community 1 - "Header.tsx"
Cohesion: 0.23
Nodes (9): Header(), SECTION_IDS, NAV_CTA_LABEL, NAV_LINKS, NavLink, useActiveSection(), useHeroReleased(), useMediaQuery() (+1 more)

### Community 2 - "App.tsx"
Cohesion: 0.22
Nodes (7): App(), AppRoutes(), Footer(), GlobalLightField(), PiriFlybyMoment(), PiriFlybyScene, useRouter()

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

### Community 8 - "ProjectEnquiryForm.tsx"
Cohesion: 0.15
Nodes (9): BUDGET_OPTIONS, FieldErrors, HOW_FOUND_OPTIONS, INITIAL_FORM_DATA, PROJECT_TYPE_OPTIONS, ProjectEnquiryForm(), ProjectEnquiryFormData, REQUIRED_FIELD_ORDER (+1 more)

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

### Community 35 - "logoLayout.ts"
Cohesion: 0.18
Nodes (12): getHoverTargetFrac(), getLogoHeightPx(), getLogoWidthPx(), getModelScale(), LOGO_ASPECT, LOGO_BANDS, LOGO_WIDTH_BASE_PX, LOGO_WIDTH_CEILING_PX (+4 more)

### Community 36 - "NightSky.tsx"
Cohesion: 0.06
Nodes (43): AmbientParticles(), buildSprite(), makeParticle(), Particle, Hero(), PiriModel, BeamLayer(), LogoRevealLayer() (+35 more)

### Community 37 - "Reveal.tsx"
Cohesion: 0.21
Nodes (8): AboutSection(), MissionSection(), PiriAboutMoment(), PiriAboutScene, ProblemSection(), Reveal(), RevealProps, useReveal()

### Community 38 - "router.tsx"
Cohesion: 0.20
Nodes (9): FinalCTA(), Link, LinkProps, RouterContext, RouterContextValue, RouterProvider(), BENEFITS, icons (+1 more)

### Community 39 - "ProjectDetailPage.tsx"
Cohesion: 0.25
Nodes (8): PortfolioSection(), getProjectBySlug(), PORTFOLIO_PROJECTS, PortfolioProject, CaseStudySection, icons, ProjectDetailPage(), ProjectDetailPageProps

### Community 40 - "PrinciplesSection.tsx"
Cohesion: 0.50
Nodes (3): PrinciplesSection(), Principle, PRINCIPLES

### Community 41 - "ProcessSection.tsx"
Cohesion: 0.50
Nodes (3): ProcessSection(), PROCESS_STAGES, ProcessStage

### Community 42 - "ServicesSection.tsx"
Cohesion: 0.50
Nodes (3): ServicesSection(), Service, SERVICES

## Knowledge Gaps
- **215 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `clamp01()` connect `PiriModel.tsx` to `NightSky.tsx`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PiriModel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05542283803153368 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._