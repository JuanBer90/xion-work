# XION / WORK

Source code for [xion.work](https://xion.work), a scroll-driven software engineering portfolio built around backend, web, mobile, cloud, integrations, and AI work.

## Stack

- TypeScript and Vite
- Anime.js for interface and section animations
- [worldbuild-js](https://github.com/JuanBer90/worldbuild-js) for the hero globe
- Native SVG and CSS for the work-system visualizations

## Development

Requires Node.js 24 (`>=24 <25`) and npm.

```bash
npm install
npm run dev
```

The development server prints the local URL. Build, preview, and test with:

```bash
npm test
npm run build
npm run preview
```

## Project structure

```
src/
  animations/          # Hero and selected-work animation controllers
  network/             # Capability and work-node emphasis interactions
  scene/               # Scroll-driven scene lifecycle
  scenes/              # Hero and project-specific architecture definitions
  styles/              # Global, responsive, and section styles
  work-architecture/   # Reusable SVG architecture renderer and layout utilities
  main.ts              # Application entry point
```

`work-architecture` keeps the shared rendering concerns—nodes, connections, ambient particles, responsive layouts, and cleanup—separate from each portfolio system's configuration. The hero globe is provided by the published `worldbuild-js` npm package rather than a vendored implementation.

## Deployment

Pushes to `main` are built and deployed through the included GitHub Pages workflow.

## License

This repository is source-visible for review and reference. See [LICENSE](LICENSE).
