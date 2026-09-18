export type WorkTone = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet';

export type AmbientExclusionNode = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  visual: { spread: number };
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const AMBIENT_HUBS = [
  { x: 404, y: 206, bias: 1.05 },
  { x: 388, y: 334, bias: 1.35 },
  { x: 108, y: 498, bias: 1.0 },
  { x: 648, y: 486, bias: 1.08 },
] as const;

export const AMBIENT_PARTICLE_BUDGET = {
  desktop: 1_280,
  tablet: 720,
  mobile: 380,
} as const;

export function ambientParticleCountForViewport(): number {
  if (window.matchMedia('(max-width: 760px)').matches) {
    return AMBIENT_PARTICLE_BUDGET.mobile;
  }
  if (window.matchMedia('(max-width: 1050px)').matches) {
    return AMBIENT_PARTICLE_BUDGET.tablet;
  }
  return AMBIENT_PARTICLE_BUDGET.desktop;
}

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43_758.545_312_3;
  return value - Math.floor(value);
}

function pickTone(index: number): WorkTone {
  const roll = seeded(index, 19);
  if (roll < 0.34) return 'cyan';
  if (roll < 0.58) return 'blue';
  if (roll < 0.72) return 'cyan';
  if (roll < 0.8) return 'green';
  if (roll < 0.87) return 'orange';
  if (roll < 0.93) return 'violet';
  if (roll < 0.97) return 'red';
  return 'yellow';
}

type AmbientParticle = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  tone: WorkTone;
  tier: 'micro' | 'mid' | 'accent';
};

function isExcluded(x: number, y: number, nodes: readonly AmbientExclusionNode[]): boolean {
  for (const node of nodes) {
    const coreClearance = node.visual.spread * 0.42;
    if (Math.hypot(x - node.x, y - node.y) < coreClearance) return true;
    if (
      x > node.labelX - 10 &&
      x < node.labelX + 196 &&
      y > node.labelY - 16 &&
      y < node.labelY + 24
    ) {
      return true;
    }
  }
  return false;
}

function samplePosition(
  index: number,
  width: number,
  height: number,
  nodes: readonly AmbientExclusionNode[],
): { x: number; y: number } | null {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const salt = attempt * 17;
    let x: number;
    let y: number;

    if (seeded(index, 2 + salt) < 0.58) {
      const hubIndex = Math.floor(seeded(index, 3 + salt) * AMBIENT_HUBS.length);
      const hub = AMBIENT_HUBS[hubIndex] ?? AMBIENT_HUBS[1];
      const spreadX = 130 + hub.bias * 95;
      const spreadY = 105 + hub.bias * 85;
      x = hub.x + (seeded(index, 5 + salt) - 0.5) * spreadX * 2;
      y = hub.y + (seeded(index, 7 + salt) - 0.5) * spreadY * 2;
    } else {
      x = 16 + seeded(index, 9 + salt) * (width - 32);
      y = 16 + seeded(index, 11 + salt) * (height - 32);
    }

    if (x < 12 || y < 12 || x > width - 12 || y > height - 12) continue;
    if (isExcluded(x, y, nodes)) continue;
    return { x, y };
  }
  return null;
}

function particleTier(index: number): AmbientParticle['tier'] {
  const roll = seeded(index, 23);
  if (roll < 0.74) return 'micro';
  if (roll < 0.93) return 'mid';
  return 'accent';
}

function tierVisuals(tier: AmbientParticle['tier'], index: number): { radius: number; opacity: number } {
  if (tier === 'micro') {
    return {
      radius: 0.8 + seeded(index, 29) * 0.55,
      opacity: 0.08 + seeded(index, 31) * 0.08,
    };
  }
  if (tier === 'mid') {
    return {
      radius: 1.25 + seeded(index, 33) * 0.4,
      opacity: 0.18 + seeded(index, 35) * 0.11,
    };
  }
  return {
    radius: 1.65 + seeded(index, 37) * 0.85,
    opacity: 0.3 + seeded(index, 39) * 0.14,
  };
}

export function generateAmbientParticles(
  count: number,
  width: number,
  height: number,
  nodes: readonly AmbientExclusionNode[],
): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  let index = 0;
  let guard = 0;

  while (particles.length < count && guard < count * 14) {
    const position = samplePosition(index, width, height, nodes);
    guard += 1;
    index += 1;
    if (!position) continue;

    const tier = particleTier(index);
    const visuals = tierVisuals(tier, index);
    particles.push({
      x: position.x,
      y: position.y,
      radius: visuals.radius,
      opacity: visuals.opacity,
      tone: pickTone(index),
      tier,
    });
  }

  return particles;
}

type AmbientConnection = {
  from: number;
  to: number;
  tone: WorkTone;
  bend: number;
};

export function generateAmbientConnections(
  particles: readonly AmbientParticle[],
  maxDistance: number,
): AmbientConnection[] {
  const connections: AmbientConnection[] = [];
  const cellSize = 44;
  const buckets = new Map<string, number[]>();

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);
    const key = `${cellX}:${cellY}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(index);
    buckets.set(key, bucket);
  }

  const seen = new Set<string>();

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index];
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);

    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const bucket = buckets.get(`${cellX + offsetX}:${cellY + offsetY}`);
        if (!bucket) continue;

        for (const otherIndex of bucket) {
          if (otherIndex <= index) continue;
          const other = particles[otherIndex];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance > maxDistance || distance < 10) continue;
          if (seeded(index * 1_000 + otherIndex, 41) > 0.11) continue;

          const edgeKey = `${index}-${otherIndex}`;
          if (seen.has(edgeKey)) continue;
          seen.add(edgeKey);

          const toneRoll = seeded(index + otherIndex, 43);
          const tone: WorkTone =
            toneRoll < 0.62 ? 'cyan' : toneRoll < 0.84 ? 'blue' : pickTone(index + otherIndex);

          connections.push({
            from: index,
            to: otherIndex,
            tone,
            bend: (seeded(index + otherIndex, 47) - 0.5) * 14,
          });
        }
      }
    }
  }

  return connections;
}

export function mountAmbientNetworkLayer(
  ambientGroup: SVGGElement,
  width: number,
  height: number,
  nodes: readonly AmbientExclusionNode[],
): { ambientDots: SVGCircleElement[]; ambientPaths: SVGPathElement[] } {
  ambientGroup.setAttribute('pointer-events', 'none');

  const particleCount = ambientParticleCountForViewport();
  const particles = generateAmbientParticles(particleCount, width, height, nodes);
  const connections = generateAmbientConnections(particles, 38);

  const ambientDots: SVGCircleElement[] = [];
  const ambientPaths: SVGPathElement[] = [];

  for (const [index, particle] of particles.entries()) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute(
      'class',
      `work-micro work-micro--ambient work-micro--ambient-${particle.tier} tone-${particle.tone}`,
    );
    circle.setAttribute('cx', particle.x.toFixed(2));
    circle.setAttribute('cy', particle.y.toFixed(2));
    circle.setAttribute('r', particle.radius.toFixed(2));
    circle.dataset.opacity = particle.opacity.toFixed(3);
    circle.dataset.ambientIndex = String(index);
    ambientGroup.append(circle);
    ambientDots.push(circle);
  }

  for (const connection of connections) {
    const from = particles[connection.from];
    const to = particles[connection.to];
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', `work-path work-path--ambient tone-${connection.tone}`);
    const midX = (from.x + to.x) / 2 + connection.bend;
    const midY = (from.y + to.y) / 2 - connection.bend * 0.65;
    path.setAttribute(
      'd',
      `M${from.x.toFixed(2)} ${from.y.toFixed(2)} Q${midX.toFixed(2)} ${midY.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
    );
    path.dataset.opacity = (0.05 + seeded(connection.from + connection.to, 51) * 0.05).toFixed(3);
    ambientGroup.append(path);
    ambientPaths.push(path);
  }

  for (let index = 0; index < 18; index += 1) {
    const path = document.createElementNS(SVG_NS, 'path');
    const tone = pickTone(index + 400);
    path.setAttribute('class', `work-path work-path--arc tone-${tone}`);
    const x = 48 + seeded(index, 61) * (width - 96);
    const y = 40 + seeded(index, 67) * (height - 120);
    const sweep = 34 + seeded(index, 71) * 72;
    path.setAttribute(
      'd',
      `M${x.toFixed(1)} ${y.toFixed(1)} A${sweep.toFixed(1)} ${sweep.toFixed(1)} 0 0 1 ${(x + sweep * 0.75).toFixed(1)} ${(y + sweep * 0.32).toFixed(1)}`,
    );
    path.dataset.opacity = (0.04 + seeded(index, 73) * 0.04).toFixed(3);
    ambientGroup.append(path);
    ambientPaths.push(path);
  }

  return { ambientDots, ambientPaths };
}
