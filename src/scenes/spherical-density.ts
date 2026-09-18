const SVG_NS = 'http://www.w3.org/2000/svg';
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SPHERE_CENTER = { x: 550, y: 520 } as const;
const SMALL_NODE_COUNT = 126;
const MICRO_DOT_COUNT = 240;
const LOCAL_CONNECTION_COUNT = 48;

type Tone = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet';

type SpherePoint = {
  x: number;
  y: number;
  z: number;
  unitX: number;
  unitY: number;
  unitZ: number;
  tone: Tone;
  radius: number;
  opacity: number;
};

type LocalConnection = { from: number; to: number; tone: Tone };

export type MountedSphericalDensity = {
  smallNodes: SVGCircleElement[];
  microDots: SVGCircleElement[];
  localPaths: SVGPathElement[];
};

const REGION_CENTERS: readonly { tone: Tone; x: number; y: number; z: number }[] = [
  { tone: 'red', x: -0.48, y: 0.62, z: 0.2 },
  { tone: 'orange', x: 0.34, y: 0.5, z: 0.58 },
  { tone: 'yellow', x: 0.78, y: 0.08, z: -0.2 },
  { tone: 'green', x: 0.42, y: -0.46, z: 0.46 },
  { tone: 'cyan', x: -0.08, y: -0.72, z: 0.18 },
  { tone: 'blue', x: -0.67, y: -0.44, z: -0.3 },
  { tone: 'violet', x: -0.62, y: -0.06, z: 0.48 },
];

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toneForPoint(x: number, y: number, z: number, index: number): Tone {
  let bestTone: Tone = 'red';
  let bestScore = -Infinity;
  for (const region of REGION_CENTERS) {
    const score = x * region.x + y * region.y + z * region.z;
    if (score > bestScore) {
      bestScore = score;
      bestTone = region.tone;
    }
  }
  const currentIndex = REGION_CENTERS.findIndex((region) => region.tone === bestTone);
  const alternate = REGION_CENTERS[(currentIndex + 1) % REGION_CENTERS.length];
  return seeded(index, 9) > 0.93 ? alternate.tone : bestTone;
}

function createSpherePoint(index: number, total: number, variant: number, micro: boolean): SpherePoint {
  const progress = (index + 0.5) / total;
  const latitude = clamp(1 - 2 * progress + (seeded(index, variant + 1) - 0.5) * 0.075, -0.99, 0.99);
  const ring = Math.sqrt(1 - latitude * latitude);
  const longitude = index * GOLDEN_ANGLE + (seeded(index, variant + 2) - 0.5) * 0.24;
  const unitX = Math.cos(longitude) * ring;
  const unitZ = Math.sin(longitude) * ring;
  const unitY = latitude;
  const radial = micro
    ? 0.96 + seeded(index, variant + 3) * 0.08
    : 0.94 + seeded(index, variant + 3) * 0.12;

  return {
    x: SPHERE_CENTER.x + unitX * 292 * radial,
    y: SPHERE_CENTER.y - unitY * 324 * radial,
    z: unitZ * 182 * radial,
    unitX,
    unitY,
    unitZ,
    tone: toneForPoint(unitX, unitY, unitZ, index + variant * 17),
    radius: micro
      ? 0.82 + seeded(index, variant + 4) * 0.62
      : 2.15 + seeded(index, variant + 4) * 1.95,
    opacity: micro
      ? 0.09 + seeded(index, variant + 5) * 0.17
      : 0.36 + seeded(index, variant + 5) * 0.28,
  };
}

function createLocalConnections(points: readonly SpherePoint[]): LocalConnection[] {
  const connections: LocalConnection[] = [];
  const used = new Set<string>();

  const appendConnection = (index: number, neighborOffset: number): void => {
    if (connections.length >= LOCAL_CONNECTION_COUNT) return;
    const source = points[index];
    const candidates = points
      .map((candidate, candidateIndex) => ({
        index: candidateIndex,
        distance:
          (source.unitX - candidate.unitX) ** 2 +
          (source.unitY - candidate.unitY) ** 2 +
          (source.unitZ - candidate.unitZ) ** 2,
      }))
      .filter((candidate) => candidate.index !== index && candidate.distance > 0.006)
      .sort((left, right) => left.distance - right.distance);
    const neighbor = candidates[neighborOffset % Math.min(3, candidates.length)];
    if (!neighbor) return;
    const key = [index, neighbor.index].sort((left, right) => left - right).join(':');
    if (used.has(key)) return;
    used.add(key);
    connections.push({ from: index, to: neighbor.index, tone: source.tone });
  };

  for (let index = 0; index < points.length && connections.length < LOCAL_CONNECTION_COUNT; index += 1) {
    if (seeded(index, 19) < 0.58) continue;
    appendConnection(index, Math.floor(seeded(index, 23) * 3));
  }

  for (let index = 0; index < points.length && connections.length < LOCAL_CONNECTION_COUNT; index += 1) {
    appendConnection(index, Math.floor(seeded(index, 31) * 3));
  }

  return connections;
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function appendPoint(
  group: SVGGElement,
  point: SpherePoint,
  index: number,
  className: string,
): SVGCircleElement {
  const circle = svgElement('circle');
  circle.classList.add(className, `tone-${point.tone}`);
  circle.dataset.index = String(index);
  circle.dataset.z = String(point.z);
  circle.dataset.opacity = String(point.opacity);
  circle.style.setProperty('--point-opacity', String(point.opacity));
  circle.setAttribute('cx', point.x.toFixed(2));
  circle.setAttribute('cy', point.y.toFixed(2));
  circle.setAttribute('r', point.radius.toFixed(2));
  group.append(circle);
  return circle;
}

/** Mounts deterministic Fibonacci-sphere density once; projection owns all later updates. */
export function mountSphericalDensity(): MountedSphericalDensity {
  const smallGroup = document.querySelector('[data-network-small-nodes]');
  const microGroup = document.querySelector('[data-network-micro]');
  const localGroup = document.querySelector('[data-network-local-paths]');
  if (
    !(smallGroup instanceof SVGGElement) ||
    !(microGroup instanceof SVGGElement) ||
    !(localGroup instanceof SVGGElement)
  ) {
    return { smallNodes: [], microDots: [], localPaths: [] };
  }

  const smallPoints = Array.from({ length: SMALL_NODE_COUNT }, (_, index) =>
    createSpherePoint(index, SMALL_NODE_COUNT, 0, false),
  );
  const microPoints = Array.from({ length: MICRO_DOT_COUNT }, (_, index) =>
    createSpherePoint(index, MICRO_DOT_COUNT, 47, true),
  );
  const localConnections = createLocalConnections(smallPoints);
  smallGroup.replaceChildren();
  microGroup.replaceChildren();
  localGroup.replaceChildren();

  const smallNodes = smallPoints.map((point, index) =>
    appendPoint(smallGroup, point, index, 'spherical-small-node'),
  );
  const microDots = microPoints.map((point, index) =>
    appendPoint(microGroup, point, index, 'network-micro-dot'),
  );
  const localPaths = localConnections.map((connection) => {
    const start = smallPoints[connection.from];
    const end = smallPoints[connection.to];
    const path = svgElement('path');
    path.classList.add('spherical-local-path', `tone-${connection.tone}`);
    path.dataset.from = String(connection.from);
    path.dataset.to = String(connection.to);
    path.dataset.opacity = String(0.16 + seeded(connection.from + connection.to, 31) * 0.16);
    path.setAttribute('d', `M${start.x.toFixed(2)} ${start.y.toFixed(2)} L${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
    localGroup.append(path);
    return path;
  });

  return { smallNodes, microDots, localPaths };
}
