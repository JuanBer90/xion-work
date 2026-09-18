import { mountAmbientNetworkLayer } from './dexstoore-ambient-network.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 720;

export type WorkNodeId =
  | 'storefront'
  | 'commerce-api'
  | 'order-engine'
  | 'operations'
  | 'fulfillment'
  | 'email'
  | 'whatsapp';

export type WorkTone = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet';

type NodeWeight = 'sm' | 'md' | 'lg' | 'xl';

type NodeVisualSpec = {
  weight: NodeWeight;
  coreRadius: number;
  spread: number;
  particleCount: number;
  innerRingScale: number;
  outerRingScale: number;
  microMarks: number;
};

const NODE_BODY_SCALE = 1.3;
const RING_RADIUS_SCALE = 1.14;

function scaleNodeVisual(base: NodeVisualSpec): NodeVisualSpec {
  return {
    ...base,
    coreRadius: base.coreRadius * NODE_BODY_SCALE,
    spread: base.spread * NODE_BODY_SCALE,
    particleCount: Math.round(base.particleCount * 1.06),
    innerRingScale: base.innerRingScale * RING_RADIUS_SCALE,
    outerRingScale: base.outerRingScale * RING_RADIUS_SCALE,
  };
}

export type WorkNode = {
  id: WorkNodeId;
  tone: WorkTone;
  x: number;
  y: number;
  title: string;
  support: string;
  labelX: number;
  labelY: number;
  visual: NodeVisualSpec;
};

export type WorkConnection = {
  id: string;
  from: WorkNodeId;
  to: WorkNodeId;
  fromTone: WorkTone;
  toTone: WorkTone;
};

const NODE_VISUALS: Record<WorkNodeId, NodeVisualSpec> = {
  storefront: {
    weight: 'md',
    coreRadius: 3.2,
    spread: 22,
    particleCount: 52,
    innerRingScale: 0.52,
    outerRingScale: 0.94,
    microMarks: 5,
  },
  'commerce-api': {
    weight: 'lg',
    coreRadius: 3.6,
    spread: 27,
    particleCount: 72,
    innerRingScale: 0.5,
    outerRingScale: 0.96,
    microMarks: 6,
  },
  'order-engine': {
    weight: 'xl',
    coreRadius: 4.2,
    spread: 36,
    particleCount: 108,
    innerRingScale: 0.48,
    outerRingScale: 1.02,
    microMarks: 8,
  },
  operations: {
    weight: 'md',
    coreRadius: 2.8,
    spread: 19,
    particleCount: 44,
    innerRingScale: 0.54,
    outerRingScale: 0.9,
    microMarks: 4,
  },
  fulfillment: {
    weight: 'lg',
    coreRadius: 3.4,
    spread: 25,
    particleCount: 66,
    innerRingScale: 0.51,
    outerRingScale: 0.95,
    microMarks: 6,
  },
  email: {
    weight: 'sm',
    coreRadius: 2.4,
    spread: 14,
    particleCount: 30,
    innerRingScale: 0.56,
    outerRingScale: 0.88,
    microMarks: 3,
  },
  whatsapp: {
    weight: 'sm',
    coreRadius: 2.4,
    spread: 14,
    particleCount: 30,
    innerRingScale: 0.56,
    outerRingScale: 0.88,
    microMarks: 3,
  },
};

export const DEXSTOORE_NODES: readonly WorkNode[] = [
  {
    id: 'storefront',
    tone: 'orange',
    x: 392,
    y: 88,
    title: 'Storefront',
    support: 'Browse · Checkout · Purchase',
    labelX: 434,
    labelY: 84,
    visual: scaleNodeVisual(NODE_VISUALS.storefront),
  },
  {
    id: 'commerce-api',
    tone: 'cyan',
    x: 404,
    y: 206,
    title: 'Commerce API',
    support: 'Products · Orders · Customers',
    labelX: 446,
    labelY: 202,
    visual: scaleNodeVisual(NODE_VISUALS['commerce-api']),
  },
  {
    id: 'order-engine',
    tone: 'violet',
    x: 388,
    y: 334,
    title: 'Order Engine',
    support: 'Processing · Assignment · Fulfillment',
    labelX: 430,
    labelY: 330,
    visual: scaleNodeVisual(NODE_VISUALS['order-engine']),
  },
  {
    id: 'operations',
    tone: 'green',
    x: 108,
    y: 498,
    title: 'Operations',
    support: 'Manage · Support · Scale',
    labelX: 150,
    labelY: 494,
    visual: scaleNodeVisual(NODE_VISUALS.operations),
  },
  {
    id: 'fulfillment',
    tone: 'blue',
    x: 648,
    y: 486,
    title: 'Fulfillment',
    support: 'Automated Delivery',
    labelX: 690,
    labelY: 482,
    visual: scaleNodeVisual(NODE_VISUALS.fulfillment),
  },
  {
    id: 'email',
    tone: 'red',
    x: 528,
    y: 628,
    title: 'Email',
    support: 'Delivery · Receipts',
    labelX: 570,
    labelY: 624,
    visual: scaleNodeVisual(NODE_VISUALS.email),
  },
  {
    id: 'whatsapp',
    tone: 'yellow',
    x: 752,
    y: 618,
    title: 'WhatsApp',
    support: 'Twilio Integration',
    labelX: 794,
    labelY: 614,
    visual: scaleNodeVisual(NODE_VISUALS.whatsapp),
  },
];

export const DEXSTOORE_CONNECTIONS: readonly WorkConnection[] = [
  {
    id: 'storefront-commerce-api',
    from: 'storefront',
    to: 'commerce-api',
    fromTone: 'orange',
    toTone: 'cyan',
  },
  {
    id: 'commerce-api-order-engine',
    from: 'commerce-api',
    to: 'order-engine',
    fromTone: 'cyan',
    toTone: 'violet',
  },
  {
    id: 'order-engine-operations',
    from: 'order-engine',
    to: 'operations',
    fromTone: 'violet',
    toTone: 'green',
  },
  {
    id: 'order-engine-fulfillment',
    from: 'order-engine',
    to: 'fulfillment',
    fromTone: 'violet',
    toTone: 'blue',
  },
  {
    id: 'fulfillment-email',
    from: 'fulfillment',
    to: 'email',
    fromTone: 'blue',
    toTone: 'red',
  },
  {
    id: 'fulfillment-whatsapp',
    from: 'fulfillment',
    to: 'whatsapp',
    fromTone: 'blue',
    toTone: 'yellow',
  },
];

function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43_758.545_312_3;
  return value - Math.floor(value);
}

function nodeById(id: WorkNodeId): WorkNode {
  const node = DEXSTOORE_NODES.find((entry) => entry.id === id);
  if (!node) throw new Error(`Unknown work node: ${id}`);
  return node;
}

function nodeReach(node: WorkNode): number {
  return node.visual.spread * 0.42;
}

function connectionPath(connection: WorkConnection): string {
  const from = nodeById(connection.from);
  const to = nodeById(connection.to);
  const startX = from.x;
  const startY = from.y + nodeReach(from);
  const endX = to.x;
  const endY = to.y - nodeReach(to);

  switch (connection.id) {
    case 'storefront-commerce-api':
    case 'commerce-api-order-engine':
      return `M${startX} ${startY} L${endX} ${endY}`;
    case 'order-engine-operations':
      return `M${startX} ${startY} C${startX - 140} ${startY + 70} ${endX + 50} ${endY - 110} ${endX} ${endY}`;
    case 'order-engine-fulfillment':
      return `M${startX} ${startY} C${startX + 130} ${startY + 60} ${endX - 60} ${endY - 100} ${endX} ${endY}`;
    case 'fulfillment-whatsapp':
      return `M${from.x} ${from.y + nodeReach(from)} C${from.x + 55} ${from.y + 95} ${to.x - 25} ${to.y - 70} ${endX} ${endY}`;
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

function fulfillmentEmailPath(from: WorkNode, to: WorkNode): string {
  const startX = from.x - 4;
  const startY = from.y + nodeReach(from);
  const endX = to.x;
  const endY = to.y - nodeReach(to);
  return `M${startX} ${startY} C${startX - 70} ${startY + 55} ${endX + 10} ${endY - 55} ${endX} ${endY}`;
}

function buildConnectionPath(connection: WorkConnection): string {
  if (connection.id === 'fulfillment-email') {
    return fulfillmentEmailPath(nodeById(connection.from), nodeById(connection.to));
  }
  return connectionPath(connection);
}

function appendParticleCloud(
  parent: SVGGElement,
  node: WorkNode,
): SVGCircleElement[] {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', `work-node__particles tone-${node.tone}`);
  const particles: SVGCircleElement[] = [];
  const { x, y, visual } = node;

  for (let index = 0; index < visual.particleCount; index += 1) {
    const angle = seeded(index, node.id.length) * Math.PI * 2;
    const distance = visual.spread * (0.12 + seeded(index, 19) ** 1.35 * 0.88);
    const radius = 0.35 + seeded(index, 23) * 0.85;
    const opacity = 0.18 + seeded(index, 29) * 0.62;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('class', 'work-node__particle');
    circle.setAttribute('cx', (x + Math.cos(angle) * distance).toFixed(2));
    circle.setAttribute('cy', (y + Math.sin(angle) * distance).toFixed(2));
    circle.setAttribute('r', radius.toFixed(2));
    circle.dataset.opacity = opacity.toFixed(3);
    group.append(circle);
    particles.push(circle);
  }

  parent.append(group);
  return particles;
}

function appendMicroMarks(parent: SVGGElement, node: WorkNode): void {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', `work-node__marks tone-${node.tone}`);
  const ringRadius = node.visual.spread * node.visual.outerRingScale;
  for (let index = 0; index < node.visual.microMarks; index += 1) {
    const angle = seeded(index, 41) * Math.PI * 2;
    const mark = document.createElementNS(SVG_NS, 'circle');
    mark.setAttribute('class', 'work-node__mark');
    mark.setAttribute('cx', (node.x + Math.cos(angle) * ringRadius).toFixed(2));
    mark.setAttribute('cy', (node.y + Math.sin(angle) * ringRadius).toFixed(2));
    mark.setAttribute('r', '0.75');
    group.append(mark);
  }
  parent.append(group);
}

function hitAreaForNode(node: WorkNode): { x: number; y: number; width: number; height: number } {
  const pad = node.visual.spread * 1.08;
  const left = node.x - pad;
  const top = node.y - pad;
  const right = Math.min(VIEW_WIDTH - 8, node.labelX + 196);
  const bottom = node.labelY + 24;
  return {
    x: left,
    y: top,
    width: Math.max(right - left, pad * 2),
    height: Math.max(bottom - top, pad * 2),
  };
}

function buildVisualNode(node: WorkNode): SVGGElement {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'work-node-group');
  group.dataset.workNode = node.id;

  const interactive = document.createElementNS(SVG_NS, 'g');
  interactive.setAttribute('class', 'work-node__interactive');
  interactive.style.setProperty('--work-node-origin-x', `${node.x}px`);
  interactive.style.setProperty('--work-node-origin-y', `${node.y}px`);

  const hit = hitAreaForNode(node);
  const hitRect = document.createElementNS(SVG_NS, 'rect');
  hitRect.setAttribute('class', 'work-node-hit');
  hitRect.setAttribute('x', hit.x.toFixed(1));
  hitRect.setAttribute('y', hit.y.toFixed(1));
  hitRect.setAttribute('width', hit.width.toFixed(1));
  hitRect.setAttribute('height', hit.height.toFixed(1));
  hitRect.setAttribute('fill', 'transparent');
  hitRect.setAttribute('tabindex', '0');
  hitRect.setAttribute('role', 'button');
  hitRect.setAttribute('aria-label', `${node.title}: ${node.support}`);

  const visual = document.createElementNS(SVG_NS, 'g');
  visual.setAttribute('class', 'work-node__visual');
  appendParticleCloud(visual, node);

  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('class', `work-node-ring work-node-ring--inner tone-${node.tone}`);
  innerRing.setAttribute('cx', String(node.x));
  innerRing.setAttribute('cy', String(node.y));
  innerRing.setAttribute('r', String(node.visual.spread * node.visual.innerRingScale));

  const outerRing = document.createElementNS(SVG_NS, 'circle');
  outerRing.setAttribute('class', `work-node-ring work-node-ring--outer tone-${node.tone}`);
  outerRing.setAttribute('cx', String(node.x));
  outerRing.setAttribute('cy', String(node.y));
  outerRing.setAttribute('r', String(node.visual.spread * node.visual.outerRingScale));

  visual.append(innerRing, outerRing);
  appendMicroMarks(visual, node);

  const core = document.createElementNS(SVG_NS, 'circle');
  core.setAttribute('class', `work-node__core tone-${node.tone}${node.id === 'order-engine' ? ' work-node__core--hub' : ''}`);
  core.setAttribute('cx', String(node.x));
  core.setAttribute('cy', String(node.y));
  core.setAttribute('r', String(node.visual.coreRadius));
  visual.append(core);

  const labelGroup = document.createElementNS(SVG_NS, 'g');
  labelGroup.setAttribute('class', 'work-label-group');
  labelGroup.dataset.workLabel = node.id;

  const title = document.createElementNS(SVG_NS, 'text');
  title.setAttribute('class', 'work-label work-label__title');
  title.setAttribute('x', String(node.labelX));
  title.setAttribute('y', String(node.labelY));
  title.setAttribute('text-anchor', 'start');
  title.textContent = node.title;

  const support = document.createElementNS(SVG_NS, 'text');
  support.setAttribute('class', 'work-label work-label__support');
  support.setAttribute('x', String(node.labelX));
  support.setAttribute('y', String(node.labelY + 18));
  support.setAttribute('text-anchor', 'start');
  support.textContent = node.support;

  labelGroup.append(title, support);
  interactive.append(visual, labelGroup);
  group.append(interactive, hitRect);

  return group;
}

function appendPathMicrodots(
  parent: SVGGElement,
  path: SVGPathElement,
  tone: WorkTone,
): SVGCircleElement[] {
  const dots: SVGCircleElement[] = [];
  const length = path.getTotalLength();
  const count = 4;
  for (let index = 0; index < count; index += 1) {
    const point = path.getPointAtLength((length * (index + 1)) / (count + 1));
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('class', `work-link-dot tone-${tone}`);
    circle.setAttribute('cx', point.x.toFixed(2));
    circle.setAttribute('cy', point.y.toFixed(2));
    circle.setAttribute('r', '0.75');
    circle.dataset.opacity = String(0.22 + seeded(index, 79) * 0.35);
    parent.append(circle);
    dots.push(circle);
  }
  return dots;
}

export type MountedDexstooreSystem = {
  svg: SVGSVGElement;
  paths: SVGPathElement[];
  nodeGroups: SVGGElement[];
  ambientDots: SVGCircleElement[];
  ambientPaths: SVGPathElement[];
  linkDots: SVGCircleElement[];
};

export function mountDexstooreSystem(container: HTMLElement): MountedDexstooreSystem {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'work-system__svg');
  svg.setAttribute('viewBox', `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
  svg.setAttribute('role', 'presentation');

  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);

  const ambientGroup = document.createElementNS(SVG_NS, 'g');
  ambientGroup.setAttribute('class', 'work-system__ambient');
  const ambient = mountAmbientNetworkLayer(ambientGroup, VIEW_WIDTH, VIEW_HEIGHT, DEXSTOORE_NODES);

  const pathsGroup = document.createElementNS(SVG_NS, 'g');
  pathsGroup.setAttribute('class', 'work-system__paths');

  const linkDotsGroup = document.createElementNS(SVG_NS, 'g');
  linkDotsGroup.setAttribute('class', 'work-system__link-dots');

  const paths: SVGPathElement[] = [];
  const linkDots: SVGCircleElement[] = [];

  for (const connection of DEXSTOORE_CONNECTIONS) {
    const gradientId = `work-link-${connection.id}`;
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    const from = nodeById(connection.from);
    const to = nodeById(connection.to);
    gradient.setAttribute('x1', String(from.x));
    gradient.setAttribute('y1', String(from.y));
    gradient.setAttribute('x2', String(to.x));
    gradient.setAttribute('y2', String(to.y));

    const stopA = document.createElementNS(SVG_NS, 'stop');
    stopA.setAttribute('offset', '0%');
    stopA.setAttribute('class', `work-link-stop tone-${connection.fromTone}`);
    stopA.setAttribute('stop-opacity', '0.72');

    const stopB = document.createElementNS(SVG_NS, 'stop');
    stopB.setAttribute('offset', '100%');
    stopB.setAttribute('class', `work-link-stop tone-${connection.toTone}`);
    stopB.setAttribute('stop-opacity', '0.5');

    gradient.append(stopA, stopB);
    defs.append(gradient);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'work-path work-path--link');
    path.setAttribute('stroke', `url(#${gradientId})`);
    path.setAttribute('d', buildConnectionPath(connection));
    path.dataset.workConnection = connection.id;
    pathsGroup.append(path);
    paths.push(path);
    linkDots.push(...appendPathMicrodots(linkDotsGroup, path, connection.toTone));
  }

  const nodesGroup = document.createElementNS(SVG_NS, 'g');
  nodesGroup.setAttribute('class', 'work-system__nodes');

  const nodeGroups: SVGGElement[] = [];
  for (const node of DEXSTOORE_NODES) {
    const group = buildVisualNode(node);
    nodesGroup.append(group);
    nodeGroups.push(group);
  }

  svg.append(ambientGroup, pathsGroup, linkDotsGroup, nodesGroup);
  container.replaceChildren(svg);

  return {
    svg,
    paths,
    nodeGroups,
    ambientDots: ambient.ambientDots,
    ambientPaths: ambient.ambientPaths,
    linkDots,
  };
}
