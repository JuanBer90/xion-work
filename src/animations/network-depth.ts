const NETWORK_CENTER = { x: 550, y: 520 } as const;
const PERSPECTIVE = 1_500;
const DEPTH_VISUAL_GAIN = 1.65;
const REVOLUTION_DURATION = 22_000;

type Point3 = { x: number; y: number; z: number };
type Point2 = { x: number; y: number; scale: number };
type DensityPoint = Point3 & {
  radius: number;
  opacity: number;
  element: SVGCircleElement;
};

type ConnectionBinding = {
  nodeIndexes: readonly number[];
  sampleCount: number;
};

const STRUCTURAL_DEPTHS = [
  90, -85, 115, -25, -100, -95, 100, -125, 60, -120, 50, 130, -70, -130, 95,
  -90, 140, -140, 10, -60, 35, 120, -135, 120, -110, 145, -145, 110, -130,
  125, -90, 75, -70, 150,
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
  { nodeIndexes: [22, 2], sampleCount: 18 },
  { nodeIndexes: [22, 1, 0], sampleCount: 0 },
  { nodeIndexes: [22, 31], sampleCount: 0 },
  { nodeIndexes: [23, 2, 5], sampleCount: 0 },
  { nodeIndexes: [23, 31, 6], sampleCount: 0 },
  { nodeIndexes: [23, 7], sampleCount: 18 },
  { nodeIndexes: [24, 7, 8], sampleCount: 0 },
  { nodeIndexes: [24, 25], sampleCount: 18 },
  { nodeIndexes: [25, 8, 12], sampleCount: 0 },
  { nodeIndexes: [25, 11, 32], sampleCount: 0 },
  { nodeIndexes: [26, 12, 13], sampleCount: 0 },
  { nodeIndexes: [26, 27, 14], sampleCount: 0 },
  { nodeIndexes: [27, 15, 17], sampleCount: 0 },
  { nodeIndexes: [28, 16, 17], sampleCount: 0 },
  { nodeIndexes: [28, 29, 18], sampleCount: 0 },
  { nodeIndexes: [29, 3, 19], sampleCount: 0 },
  { nodeIndexes: [30, 4, 16], sampleCount: 0 },
  { nodeIndexes: [30, 33, 20], sampleCount: 0 },
  { nodeIndexes: [31, 20, 6], sampleCount: 0 },
  { nodeIndexes: [32, 10, 11], sampleCount: 0 },
  { nodeIndexes: [33, 19, 20], sampleCount: 0 },
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function depthOpacity(opacity: number, scale: number): number {
  return opacity * clamp(0.66 + (scale - 1) * 2.15, 0.48, 1.28);
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

/** Applies a continuous projected Y-axis rotation without rotating the SVG plane. */
export function startNetworkDepth(): () => void {
  const nodes = [...document.querySelectorAll<SVGCircleElement>('.network-node')];
  const paths = [...document.querySelectorAll<SVGPathElement>('.network-path')];
  const smallNodes = [...document.querySelectorAll<SVGCircleElement>('.spherical-small-node')];
  const microDots = [...document.querySelectorAll<SVGCircleElement>('.network-micro-dot')];
  const localPaths = [...document.querySelectorAll<SVGPathElement>('.spherical-local-path')];
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
  const smallPoints: DensityPoint[] = smallNodes.map((node) => ({
    x: Number(node.getAttribute('cx')),
    y: Number(node.getAttribute('cy')),
    z: Number(node.dataset.z ?? 0),
    radius: Number(node.getAttribute('r')),
    opacity: Number(node.dataset.opacity ?? 0.5),
    element: node,
  }));
  const microPoints: DensityPoint[] = microDots.map((dot) => ({
    x: Number(dot.getAttribute('cx')),
    y: Number(dot.getAttribute('cy')),
    z: Number(dot.dataset.z ?? 0),
    radius: Number(dot.getAttribute('r')),
    opacity: Number(dot.dataset.opacity ?? 0.2),
    element: dot,
  }));
  const originalLocalPaths = localPaths.map((path) => path.getAttribute('d') ?? '');
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
  for (const smallPoint of smallPoints) smallPoint.element.style.transform = '';
  for (const dotPoint of microPoints) dotPoint.element.style.transform = '';

  const reset = (): void => {
    for (const nodePoint of nodePoints) {
      nodePoint.node.setAttribute('cx', String(nodePoint.x));
      nodePoint.node.setAttribute('cy', String(nodePoint.y));
      nodePoint.node.setAttribute('r', String(nodePoint.radius));
    }
    for (let index = 0; index < paths.length; index += 1) {
      paths[index].setAttribute('d', originalPaths[index]);
    }
    for (const smallPoint of smallPoints) {
      smallPoint.element.setAttribute('cx', String(smallPoint.x));
      smallPoint.element.setAttribute('cy', String(smallPoint.y));
      smallPoint.element.setAttribute('r', String(smallPoint.radius));
      smallPoint.element.style.opacity = String(smallPoint.opacity);
    }
    for (const microPoint of microPoints) {
      microPoint.element.setAttribute('cx', String(microPoint.x));
      microPoint.element.setAttribute('cy', String(microPoint.y));
      microPoint.element.setAttribute('r', String(microPoint.radius));
      microPoint.element.style.opacity = String(microPoint.opacity);
    }
    for (let index = 0; index < localPaths.length; index += 1) {
      localPaths[index].setAttribute('d', originalLocalPaths[index]);
      localPaths[index].style.opacity = String(Number(localPaths[index].dataset.opacity ?? 0.24));
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

    const projectedSmallNodes = smallPoints.map((smallPoint) => project(smallPoint, angle));
    for (let index = 0; index < smallPoints.length; index += 1) {
      const source = smallPoints[index];
      const projected = projectedSmallNodes[index];
      source.element.setAttribute('cx', projected.x.toFixed(2));
      source.element.setAttribute('cy', projected.y.toFixed(2));
      source.element.setAttribute(
        'r',
        (source.radius * (0.96 + (projected.scale - 1) * 0.52)).toFixed(2),
      );
      source.element.style.opacity = String(depthOpacity(source.opacity, projected.scale));
    }

    for (let index = 0; index < localPaths.length; index += 1) {
      const path = localPaths[index];
      const from = Number(path.dataset.from);
      const to = Number(path.dataset.to);
      const fromPoint = projectedSmallNodes[from];
      const toPoint = projectedSmallNodes[to];
      if (!fromPoint || !toPoint) continue;
      path.setAttribute('d', pathFromPoints([fromPoint, toPoint]));
      const averageScale = (fromPoint.scale + toPoint.scale) / 2;
      path.style.opacity = String(depthOpacity(Number(path.dataset.opacity ?? 0.24), averageScale));
    }

    for (const microPoint of microPoints) {
      const projected = project(microPoint, angle);
      microPoint.element.setAttribute('cx', projected.x.toFixed(2));
      microPoint.element.setAttribute('cy', projected.y.toFixed(2));
      microPoint.element.setAttribute(
        'r',
        (microPoint.radius * (0.98 + (projected.scale - 1) * 0.3)).toFixed(2),
      );
      microPoint.element.style.opacity = String(depthOpacity(microPoint.opacity, projected.scale));
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
