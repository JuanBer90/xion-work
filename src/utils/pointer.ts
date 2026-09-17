export type PointerCoords = {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
};

/** Normalized pointer position within an element (0–1), for future interactions. */
export function getPointerCoords(
  event: PointerEvent,
  element: Element,
): PointerCoords {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const w = rect.width || 1;
  const h = rect.height || 1;

  return {
    x,
    y,
    normalizedX: x / w,
    normalizedY: y / h,
  };
}
