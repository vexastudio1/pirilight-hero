# PiriLight Studio

Website for **PiriLight Studio** — a digital studio that helps good businesses become more visible, credible and
memorable online. Built with React, TypeScript, Vite, and Three.js (via react-three-fiber) for the animated hero
sequence.

## Requirements

- Node.js 18 or newer

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server (default: `http://localhost:5173`).

## Production build

```bash
npm run build
```

Type-checks the project (`tsc -b`) and outputs a production build to `dist/`.

```bash
npm run preview
```

Serves the last production build locally, for a final check before deploying.

## Project structure

```
src/
├── assets/          Bundled binary assets imported directly by components (e.g. textures)
│   └── textures/
├── components/
│   ├── hero/         The hero animation sequence — see warning below
│   ├── layout/        Header and Footer
│   ├── sections/       One component per homepage section (Problem, Mission, Services, …)
│   └── ui/             Small reusable pieces (currently: the Reveal scroll-in wrapper)
├── data/             Editable content arrays (services, process steps, portfolio, nav links, …)
├── hooks/            Reusable React hooks (scroll/reveal/intersection-observer logic)
├── lib/              Pure, framework-free logic: animation timelines, easing, shared mutable state
├── styles/           global.css — the whole site's styling, including the light-progression system
├── App.tsx            Page composition (Header + all sections + Footer)
└── main.tsx            React entry point
```

`public/` holds assets referenced by absolute URL rather than imported — the PiriLight logo, favicon, and the 3D
model (`.glb`) files. These must stay in `public/` (not `src/assets/`): they're loaded at runtime by fixed paths
like `/brand/pirilight-logo.png` and `/models/piri.optimized.glb`, not bundled/hashed by Vite.

`scripts/` contains standalone Node scripts used to prepare 3D/image assets (measuring the logo layout, extracting
textures from the GLB, etc.). They are not part of the website build — run individually with `node scripts/<file>.mjs`
if you ever need to reprocess an asset. `design-source/` holds the original Blender source file for the Piri model.

## ⚠️ Editing the Hero

`src/components/hero/` (`Hero.tsx`, `NightSky.tsx`, `PiriModel.tsx`, `IntroOverlay.tsx`, `AmbientParticles.tsx`) plus
`src/lib/introState.ts`, `introTimeline.ts`, `logoLayout.ts`, `scrollState.ts`, `scrollTimeline.ts` implement the
hero's one-shot cinematic intro (Piri's flight, the logo reveal, the beam) and the scroll-driven transition into the
Problem section. This is carefully timed and cross-referenced code — the 3D scene and the DOM overlays share a single
clock (`introState`) so they never drift out of sync. Avoid casual edits here; small numeric changes (in
`introTimeline.ts` or `scrollTimeline.ts`) are safe to tune, but structural changes should be made carefully and
tested by scrolling through the full sequence afterward, including scrolling before the intro finishes.

## Where to edit things

| What you want to change | Where |
|---|---|
| Website copy (headings, body text) | Directly inside each `src/components/sections/*.tsx` file |
| Services, process steps, portfolio projects, principles, nav links | `src/data/*.ts` |
| Portfolio project images | Currently CSS placeholders in `PortfolioSection.tsx` — replace with real `<img>` tags once assets exist |
| Colors, spacing, the darkness-to-light progression per section | `src/styles/global.css` (see the `LIGHT PROGRESSION SYSTEM` comment block — one table of custom properties per section) |
| Logo / favicon / 3D model files | `public/brand/`, `public/models/` |
| Future Piri animation moments | Look for `piri-*-anchor` class names (in `ProblemSection`, `ServicesSection`, `PortfolioSection`, `AboutSection`, `FinalCTA`) — placeholder hooks reserved for later |

All visible website copy is written in European Portuguese; keep it that way when editing.
