/** Whether the user prefers reduced motion (respect in Anime.js timelines). */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
