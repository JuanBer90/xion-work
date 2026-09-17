/** Whether the user prefers reduced motion (respect in Anime.js timelines). */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Subscribe to prefers-reduced-motion changes. Returns unsubscribe. */
export function onReducedMotionChange(
  callback: (reduced: boolean) => void,
): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = () => callback(mq.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
