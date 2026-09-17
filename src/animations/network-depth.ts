const NETWORK_CENTER = { x: 550, y: 520 } as const;
const PERSPECTIVE = 1_500;
const DEPTH_VISUAL_GAIN = 2.5;
const REVOLUTION_DURATION = 22_000;

type Point3 = { x: number; y: number; z: number };
type Point2 = { x: number; y: number; scale: number };

type ConnectionBinding = {
  nodeIndexes: readonly number[];
  sampleCount: number;
};

const STRUCTURAL_DEPTHS = [
  22, -30, 38, 6, -25, -18, 30, -35, 8, -28, 12, 38, -25, 25, -12, 6, 42,
  -30, -42, -10, 14, -34,
] as const;

const CONNECTIONS: readonly ConnectionBinding[] = [
  { nodeIndexes: [0, 2], sampleCount: 18 },
  { nodeIndexes: [1, 2, 5], sampleCount: 0 },
  { nodeIndexes: [0, 3, 20, 5], sampleCount: 0 },
  { nodeIndexes: [3, 4, 20], sampleCount: 0 },
  { nodeIndexes: [2, 7], sampleCount: 18 },
  { nodeIndexes: [5, 6, 7], sampleCount: 0 },
  { nodeIndexes: [20, 6, 8], sampleCount: 0 },
  { nodeIndexes: [7, 8, 12], sampleCount: 0 },
  { nodeIndexes: [6, 8, 9], sampleCount: 0 },
  { nodeIndexes: [10, 11, 12], sampleCount: 0 },
  { nodeIndexes: [10, 14, 15], sampleCount: 0 },
  { nodeIndexes: [11, 12, 13, 15], sampleCount: 0 },
  { nodeIndexes: [14, 10, 13], sampleCount: 0 },
  { nodeIndexes: [15, 9], sampleCount: 18 },
  { nodeIndexes: [17, 16, 14, 15], sampleCount: 0 },
  { nodeIndexes: [17, 4], sampleCount: 18 },
  { nodeIndexes: [4, 16, 3], sampleCount: 0 },
  { nodeIndexes: [3, 18, 16], sampleCount: 0 },
  { nodeIndexes: [1, 3], sampleCount: 18 },
  { nodeIndexes: [2, 20], sampleCount: 18 },
  { nodeIndexes: [6, 11], sampleCount: 18 },
  { nodeIndexes: [16, 20], sampleCount: 0 },
  { nodeIndexes: [8, 7], sampleCount: 18 },
  { nodeIndexes: [13, 14], sampleCount: 18 },
];

const LABEL_DEPTHS = [38, 30, 42, 38] as const;
const FRAGMENT_DEPTHS = [20, -18, 8, 12, -30] as const;

function project(point: Point3, angle: number): Point2 {
  const relativeX = point.x - NETWORK_CENTER.x;
  const visualZ = point.z * DEPTH_VISUAL_GAIN;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotatedX = relativeX * cosine + visualZ * sine;
  const rotatedZ = visualZ * cosine - relativeX * sine;
  const scale = PERSPECTIVE / (PERSPECTIVE - rotatedZ);
  const restingScale = PERSPECTIVE / (PERSPECTIVE - visualZ);
  const restingX = NETWORK_CENTER.x + relativeX * restingScale;
  const restingY = NETWORK_CENTER.y + (point.y - NETWORK_CENTER.y) * restingScale;
  const projectedX = NETWORK_CENTER.x + rotatedX * scale;
  const projectedY = NETWORK_CENTER.y + (point.y - NETWORK_CENTER.y) * scale;

  return {
    x: point.x + (projectedX - restingX),
    y: point.y + (projectedY - restingY),
    scale,
  };
}

function pathFromPoints(points: readonly Point2[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

function samplePath(
  path: SVGPathElement,
  start: Point3,
  end: Point3,
  angle: number,
  count: number,
): string {
  const length = path.getTotalLength();
  const points = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const point = path.getPointAtLength(length * progress);
    return project(
      {
        x: point.x,
        y: point.y,
        z: start.z + (end.z - start.z) * progress,
      },
      angle,
    );
  });
  return pathFromPoints(points);
}

/** Applies a shallow, projected Y-axis oscillation without rotating the SVG plane. */
export function startNetworkDepth(): () => void {
  const nodes = [...document.querySelectorAll<SVGCircleElement>('.network-node')];
  const paths = [...document.querySelectorAll<SVGPathElement>('.network-path')];
  const microDots = [...document.querySelectorAll<SVGCircleElement>('.network-micro-dot')];
  const labels = [...document.querySelectorAll<SVGTextElement>('.network-label')];
  const fragments = [...document.querySelectorAll<SVGPathElement>('.network-fragment')];

  if (nodes.length !== STRUCTURAL_DEPTHS.length || paths.length !== CONNECTIONS.length) {
    return () => undefined;
  }

  const nodePoints = nodes.map((node, index) => ({
    x: Number(node.getAttribute('cx')),
    y: Number(node.getAttribute('cy')),
    z: STRUCTURAL_DEPTHS[index] ?? 0,
    radius: Number(node.getAttribute('r')),
    node,
  }));
  const originalPaths = paths.map((path) => path.getAttribute('d') ?? '');
  const microPoints = microDots.map((dot, index) => ({
    x: Number(dot.getAttribute('cx')),
    y: Number(dot.getAttribute('cy')),
    z: ((index * 29) % 41) - 20,
    radius: Number(dot.getAttribute('r')),
    dot,
  }));
  const labelPoints = labels.map((label, index) => ({
    x: Number(label.getAttribute('x')),
    y: Number(label.getAttribute('y')),
    z: LABEL_DEPTHS[index] ?? 0,
    label,
  }));
  const fragmentPoints = fragments.map((fragment, index) => {
    const box = fragment.getBBox();
    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      z: FRAGMENT_DEPTHS[index] ?? 0,
      fragment,
    };
  });

  for (const nodePoint of nodePoints) nodePoint.node.style.transform = '';
  for (const dotPoint of microPoints) dotPoint.dot.style.transform = '';

  const reset = (): void => {
    for (const nodePoint of nodePoints) {
      nodePoint.node.setAttribute('cx', String(nodePoint.x));
      nodePoint.node.setAttribute('cy', String(nodePoint.y));
      nodePoint.node.setAttribute('r', String(nodePoint.radius));
    }
    for (let index = 0; index < paths.length; index += 1) {
      paths[index].setAttribute('d', originalPaths[index]);
    }
    for (const microPoint of microPoints) {
      microPoint.dot.setAttribute('cx', String(microPoint.x));
      microPoint.dot.setAttribute('cy', String(microPoint.y));
      microPoint.dot.setAttribute('r', String(microPoint.radius));
    }
    for (const labelPoint of labelPoints) {
      labelPoint.label.setAttribute('x', String(labelPoint.x));
      labelPoint.label.setAttribute('y', String(labelPoint.y));
    }
    for (const fragmentPoint of fragmentPoints) {
      fragmentPoint.fragment.removeAttribute('transform');
    }
  };

  let frame = 0;
  let startedAt = 0;
  let active = true;

  const render = (time: number): void => {
    if (!active) return;
    if (!startedAt) startedAt = time;
    const angle = ((time - startedAt) % REVOLUTION_DURATION) / REVOLUTION_DURATION * Math.PI * 2;
    const projectedNodes = nodePoints.map((nodePoint) => project(nodePoint, angle));

    for (let index = 0; index < nodePoints.length; index += 1) {
      const source = nodePoints[index];
      const projected = projectedNodes[index];
      const depthPresence = (source.z / 50) * 0.035;
      source.node.setAttribute('cx', projected.x.toFixed(2));
      source.node.setAttribute('cy', projected.y.toFixed(2));
      source.node.setAttribute('r', (source.radius * (projected.scale + depthPresence)).toFixed(2));
    }

    for (let index = 0; index < paths.length; index += 1) {
      const binding = CONNECTIONS[index];
      const path = paths[index];
      if (Math.abs(angle) < 0.00001) {
        path.setAttribute('d', originalPaths[index]);
        continue;
      }
      if (binding.sampleCount) {
        const start = nodePoints[binding.nodeIndexes[0]];
        const end = nodePoints[binding.nodeIndexes.at(-1) ?? 0];
        path.setAttribute('d', originalPaths[index]);
        path.setAttribute('d', samplePath(path, start, end, angle, binding.sampleCount));
        continue;
      }
      path.setAttribute(
        'd',
        pathFromPoints(binding.nodeIndexes.map((nodeIndex) => projectedNodes[nodeIndex])),
      );
    }

    for (const microPoint of microPoints) {
      const projected = project(microPoint, angle);
      microPoint.dot.setAttribute('cx', projected.x.toFixed(2));
      microPoint.dot.setAttribute('cy', projected.y.toFixed(2));
      microPoint.dot.setAttribute('r', (microPoint.radius * (0.98 + (projected.scale - 1) * 0.3)).toFixed(2));
    }

    for (const labelPoint of labelPoints) {
      const projected = project(labelPoint, angle);
      labelPoint.label.setAttribute('x', projected.x.toFixed(2));
      labelPoint.label.setAttribute('y', projected.y.toFixed(2));
    }

    for (const fragmentPoint of fragmentPoints) {
      const projected = project(fragmentPoint, angle);
      fragmentPoint.fragment.setAttribute(
        'transform',
        `translate(${(projected.x - fragmentPoint.x).toFixed(2)} ${(projected.y - fragmentPoint.y).toFixed(2)})`,
      );
    }

    frame = window.requestAnimationFrame(render);
  };

  frame = window.requestAnimationFrame(render);
  return () => {
    active = false;
    window.cancelAnimationFrame(frame);
    reset();
  };
}
