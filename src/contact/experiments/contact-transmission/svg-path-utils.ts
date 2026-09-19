export function findClosestPathLength(
  path: SVGPathElement,
  x: number,
  y: number,
  samples = 96,
): number {
  const total = path.getTotalLength();
  let bestLength = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i <= samples; i += 1) {
    const length = (i / samples) * total;
    const point = path.getPointAtLength(length);
    const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestLength = length;
    }
  }

  return bestLength;
}

export function getPathTangentAngle(path: SVGPathElement, length: number): number {
  const total = path.getTotalLength();
  const delta = Math.min(0.75, total * 0.01);
  const before = path.getPointAtLength(Math.max(0, length - delta));
  const after = path.getPointAtLength(Math.min(total, length + delta));
  return (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}
