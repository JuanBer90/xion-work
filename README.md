# xion.work

Static site foundation for scroll-driven animation (Vite, TypeScript, Anime.js).

## Requirements

- Node.js ^20.19.0 or >=22.12.0 (required by Vite 8)

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

## Production build

```bash
npm run build
```

Output is written to `dist/`. Preview locally:

```bash
npm run preview
```

## Network intro options

`initNetworkIntro()` accepts optional configuration. Defaults preserve the current behavior (continuous rotation after the build animation).

```ts
import { initNetworkIntro } from '@/animations/network-intro';

initNetworkIntro({
  rotation: {
    enabled: true, // default
  },
});
```

Set `rotation.enabled` to `false` to keep the network static in its final orientation after the intro completes (no continuous rotation).

## Project layout

```
src/
  animations/   # Anime.js timelines and shared animation helpers
  config/       # Intro/scene option types and defaults
  scenes/       # Scroll-driven scene setup
  components/   # DOM/SVG building blocks
  styles/       # Global CSS
  utils/        # Motion, pointer, and shared utilities
  main.ts       # Entry point
```
