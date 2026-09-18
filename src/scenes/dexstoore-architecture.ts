import { MOBILE_AMBIENT_HUBS, mountAmbientNetworkLayer } from './dexstoore-ambient-network.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 720;
const MOBILE_VIEW_WIDTH = 420;
const MOBILE_VIEW_BOTTOM_PAD = 64;
const MOBILE_AMBIENT_BOTTOM_PAD = 24;
const WORK_SYSTEM_MOBILE_BREAKPOINT = '(max-width: 760px)';

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

type NodeLayoutSpec = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor?: 'start' | 'end' | 'middle';
};

export type WorkNode = {
  id: WorkNodeId;
  tone: WorkTone;
  x: number;
  y: number;
  title: string;
  support: string;
  labelX: number;
  labelY: number;
  labelAnchor?: 'start' | 'end' | 'middle';
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

const NODE_COPY: Record<
  WorkNodeId,
  Pick<WorkNode, 'tone' | 'title' | 'support' | 'visual'>
> = {
  storefront: {
    tone: 'orange',
    title: 'Storefront',
    support: 'Browse · Checkout · Purchase',
    visual: scaleNodeVisual(NODE_VISUALS.storefront),
  },
  'commerce-api': {
    tone: 'cyan',
    title: 'Commerce API',
    support: 'Products · Orders · Customers',
    visual: scaleNodeVisual(NODE_VISUALS['commerce-api']),
  },
  'order-engine': {
    tone: 'violet',
    title: 'Order Engine',
    support: 'Processing · Assignment · Fulfillment',
    visual: scaleNodeVisual(NODE_VISUALS['order-engine']),
  },
  operations: {
    tone: 'green',
    title: 'Operations',
    support: 'Manage · Support · Scale',
    visual: scaleNodeVisual(NODE_VISUALS.operations),
  },
  fulfillment: {
    tone: 'blue',
    title: 'Fulfillment',
    support: 'Automated Delivery',
    visual: scaleNodeVisual(NODE_VISUALS.fulfillment),
  },
  email: {
    tone: 'red',
    title: 'Email',
    support: 'Delivery · Receipts',
    visual: scaleNodeVisual(NODE_VISUALS.email),
  },
  whatsapp: {
    tone: 'yellow',
    title: 'WhatsApp',
    support: 'Twilio Integration',
    visual: scaleNodeVisual(NODE_VISUALS.whatsapp),
  },
};

const DESKTOP_NODE_LAYOUT: Record<WorkNodeId, NodeLayoutSpec> = {
  storefront: { x: 392, y: 88, labelX: 434, labelY: 84 },
  'commerce-api': { x: 404, y: 206, labelX: 446, labelY: 202 },
  'order-engine': { x: 388, y: 334, labelX: 430, labelY: 330 },
  operations: { x: 108, y: 498, labelX: 150, labelY: 494 },
  fulfillment: { x: 648, y: 486, labelX: 690, labelY: 482 },
  email: { x: 528, y: 628, labelX: 570, labelY: 624 },
  whatsapp: { x: 752, y: 618, labelX: 794, labelY: 614 },
};

/** ~50px screen shift at 390px viewport (420-unit viewBox). */
const MOBILE_COMMERCE_API_SHIFT_X = Math.round(50 * (MOBILE_VIEW_WIDTH / 390));

const MOBILE_NODE_LAYOUT: Record<WorkNodeId, NodeLayoutSpec> = {
  storefront: {
    x: 160,
    y: 84,
    labelX: 232,
    labelY: 64,
    labelAnchor: 'start',
  },
  'commerce-api': {
    x: 165,
    y: 182,
    labelX:
      156 +
      NODE_COPY['commerce-api'].visual.spread * NODE_COPY['commerce-api'].visual.outerRingScale +
      MOBILE_COMMERCE_API_SHIFT_X,
    labelY: 162,
    labelAnchor: 'start',
  },
  'order-engine': {
    x: 160,
    y: 280,
    labelX: 234,
    labelY: 271,
    labelAnchor: 'start',
  },
  operations: { x: 90, y: 387, labelX: 50, labelY: 440, labelAnchor: 'start' },
  fulfillment: { x: 220, y: 386, labelX: 270, labelY: 380, labelAnchor: 'start' },
  email: { x: 160, y: 470, labelX: 140, labelY: 510, labelAnchor: 'start' },
  whatsapp: { x: 290, y: 480, labelX: 280, labelY: 520, labelAnchor: 'start' },
};

function assembleWorkNodes(layout: Record<WorkNodeId, NodeLayoutSpec>): WorkNode[] {
  return (Object.keys(NODE_COPY) as WorkNodeId[]).map((id) => ({
    id,
    ...NODE_COPY[id],
    ...layout[id],
  }));
}

export const DEXSTOORE_NODES: readonly WorkNode[] = assembleWorkNodes(DESKTOP_NODE_LAYOUT);

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

function nodeById(nodes: readonly WorkNode[], id: WorkNodeId): WorkNode {
  const node = nodes.find((entry) => entry.id === id);
  if (!node) throw new Error(`Unknown work node: ${id}`);
  return node;
}

function nodeReach(node: WorkNode): number {
  return node.visual.spread * 0.42;
}

function desktopConnectionPath(connection: WorkConnection, from: WorkNode, to: WorkNode): string {
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
    case 'fulfillment-email': {
      const startEmailX = from.x - 4;
      const startEmailY = from.y + nodeReach(from);
      return `M${startEmailX} ${startEmailY} C${startEmailX - 70} ${startEmailY + 55} ${endX + 10} ${endY - 55} ${endX} ${endY}`;
    }
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

function mobileConnectionPath(connection: WorkConnection, from: WorkNode, to: WorkNode): string {
  const startX = from.x;
  const startY = from.y + nodeReach(from);
  const endX = to.x;
  const endY = to.y - nodeReach(to);
  const midY = (startY + endY) / 2;

  switch (connection.id) {
    case 'storefront-commerce-api':
      return `M${startX} ${startY} C${startX - 18} ${midY - 12} ${endX + 14} ${midY + 8} ${endX} ${endY}`;
    case 'commerce-api-order-engine':
      return `M${startX} ${startY} C${startX + 16} ${midY - 10} ${endX - 12} ${midY + 6} ${endX} ${endY}`;
    case 'order-engine-operations':
      return `M${startX} ${startY} C${startX - 72} ${startY + 42} ${endX + 22} ${endY - 52} ${endX} ${endY}`;
    case 'order-engine-fulfillment':
      return `M${startX} ${startY} C${startX + 72} ${startY + 40} ${endX - 22} ${endY - 50} ${endX} ${endY}`;
    case 'fulfillment-email':
      return `M${from.x - 8} ${from.y + nodeReach(from)} C${from.x - 58} ${from.y + 52} ${endX + 28} ${endY - 48} ${endX} ${endY}`;
    case 'fulfillment-whatsapp':
      return `M${from.x + 8} ${from.y + nodeReach(from)} C${from.x + 52} ${from.y + 50} ${endX - 24} ${endY - 46} ${endX} ${endY}`;
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

function buildConnectionPath(
  connection: WorkConnection,
  nodes: readonly WorkNode[],
  mobileLayout: boolean,
): string {
  const from = nodeById(nodes, connection.from);
  const to = nodeById(nodes, connection.to);
  if (mobileLayout) return mobileConnectionPath(connection, from, to);
  return desktopConnectionPath(connection, from, to);
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

function mobileSupportBulletLines(node: WorkNode): string[] {
  if (node.id === 'whatsapp') return ['Twilio', 'Integration'];
  return node.support.split(' · ').map((part) => part.trim());
}

const MOBILE_BULLET_GAP_AFTER_TITLE = 13;
const MOBILE_BULLET_LINE_STEP = 11;

function mobileLabelBlockBottom(node: WorkNode): number {
  const bulletCount = mobileSupportBulletLines(node).length;
  return node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + bulletCount * MOBILE_BULLET_LINE_STEP;
}

function mobileContentBottom(nodes: readonly WorkNode[]): number {
  let maxY = 0;
  for (const node of nodes) {
    const haloBottom = node.y + node.visual.spread * node.visual.outerRingScale;
    maxY = Math.max(maxY, haloBottom, mobileLabelBlockBottom(node));
  }
  return maxY;
}

function mobileViewHeight(nodes: readonly WorkNode[]): number {
  return mobileContentBottom(nodes) + MOBILE_VIEW_BOTTOM_PAD;
}

function labelHorizontalBounds(
  node: WorkNode,
  stackedMobileLabels: boolean,
): { left: number; right: number; bottom: number } {
  if (stackedMobileLabels) {
    const blockWidth = 96;
    const bulletCount = mobileSupportBulletLines(node).length;
    const bottom = node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + bulletCount * MOBILE_BULLET_LINE_STEP;
    if (node.labelAnchor === 'middle') {
      return {
        left: node.labelX - blockWidth / 2,
        right: node.labelX + blockWidth / 2,
        bottom,
      };
    }
    if (node.labelAnchor === 'end') {
      return { left: node.labelX - blockWidth, right: node.labelX + 6, bottom };
    }
    return { left: node.labelX - 4, right: node.labelX + blockWidth, bottom };
  }

  const labelWidth = 198;
  const bottom = node.labelY + 26;
  if (node.labelAnchor === 'end') {
    return { left: node.labelX - labelWidth, right: node.labelX + 8, bottom };
  }
  if (node.labelAnchor === 'middle') {
    return { left: node.labelX - labelWidth / 2, right: node.labelX + labelWidth / 2, bottom };
  }
  return { left: node.labelX - 6, right: node.labelX + labelWidth, bottom };
}

function hitAreaForNode(
  node: WorkNode,
  viewWidth: number,
  stackedMobileLabels = false,
): { x: number; y: number; width: number; height: number } {
  const pad = node.visual.spread * 1.08;
  const labelBounds = labelHorizontalBounds(node, stackedMobileLabels);

  const left = Math.max(8, Math.min(node.x - pad, labelBounds.left));
  const top = Math.min(node.y - pad, node.labelY - 14);
  const right = Math.min(viewWidth - 8, Math.max(node.x + pad, labelBounds.right));
  const bottom = Math.max(node.y + pad, labelBounds.bottom);

  return {
    x: left,
    y: top,
    width: Math.max(right - left, pad * 2),
    height: Math.max(bottom - top, pad * 2),
  };
}

function appendNodeLabels(
  labelGroup: SVGGElement,
  node: WorkNode,
  stackedMobileLabels: boolean,
): void {
  const labelAnchor = node.labelAnchor ?? 'start';

  const title = document.createElementNS(SVG_NS, 'text');
  title.setAttribute('class', 'work-label work-label__title');
  title.setAttribute('x', String(node.labelX));
  title.setAttribute('y', String(node.labelY));
  title.setAttribute('text-anchor', labelAnchor);
  title.textContent = node.title;
  labelGroup.append(title);

  if (!stackedMobileLabels) {
    const support = document.createElementNS(SVG_NS, 'text');
    support.setAttribute('class', 'work-label work-label__support');
    support.setAttribute('x', String(node.labelX));
    support.setAttribute('y', String(node.labelY + 18));
    support.setAttribute('text-anchor', labelAnchor);
    support.textContent = node.support;
    labelGroup.append(support);
    return;
  }

  labelGroup.classList.add('work-label-group--mobile-stack');
  const bullets = mobileSupportBulletLines(node);
  for (const [index, line] of bullets.entries()) {
    const bullet = document.createElementNS(SVG_NS, 'text');
    bullet.setAttribute('class', 'work-label work-label__bullet');
    bullet.setAttribute('x', String(node.labelX));
    bullet.setAttribute('y', String(node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + index * MOBILE_BULLET_LINE_STEP));
    bullet.setAttribute('text-anchor', labelAnchor);
    bullet.textContent = `· ${line}`;
    labelGroup.append(bullet);
  }
}

function buildVisualNode(
  node: WorkNode,
  viewWidth: number,
  stackedMobileLabels = false,
): SVGGElement {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'work-node-group');
  group.dataset.workNode = node.id;

  const interactive = document.createElementNS(SVG_NS, 'g');
  interactive.setAttribute('class', 'work-node__interactive');
  interactive.style.setProperty('--work-node-origin-x', `${node.x}px`);
  interactive.style.setProperty('--work-node-origin-y', `${node.y}px`);

  const hit = hitAreaForNode(node, viewWidth, stackedMobileLabels);
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

  appendNodeLabels(labelGroup, node, stackedMobileLabels);
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
  const mobileLayout = window.matchMedia(WORK_SYSTEM_MOBILE_BREAKPOINT).matches;
  const nodes = mobileLayout ? assembleWorkNodes(MOBILE_NODE_LAYOUT) : DEXSTOORE_NODES;
  const stackedMobileLabels = mobileLayout;
  const viewWidth = mobileLayout ? MOBILE_VIEW_WIDTH : VIEW_WIDTH;
  const mobileContentMaxY = mobileLayout ? mobileContentBottom(nodes) : 0;
  const viewHeight = mobileLayout ? mobileViewHeight(nodes) : VIEW_HEIGHT;
  const ambientHeight = mobileLayout
    ? mobileContentMaxY + MOBILE_AMBIENT_BOTTOM_PAD
    : viewHeight;

  container.classList.toggle('work-section__system--mobile', mobileLayout);
  if (mobileLayout) {
    container.style.setProperty('--work-system-aspect', String(viewWidth / viewHeight));
  } else {
    container.style.removeProperty('--work-system-aspect');
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'work-system__svg');
  svg.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`);
  svg.setAttribute('role', 'presentation');

  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);

  const ambientGroup = document.createElementNS(SVG_NS, 'g');
  ambientGroup.setAttribute('class', 'work-system__ambient');
  const ambient = mountAmbientNetworkLayer(
    ambientGroup,
    viewWidth,
    ambientHeight,
    nodes,
    mobileLayout ? MOBILE_AMBIENT_HUBS : undefined,
  );

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
    const from = nodeById(nodes, connection.from);
    const to = nodeById(nodes, connection.to);
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
    path.setAttribute('d', buildConnectionPath(connection, nodes, mobileLayout));
    path.dataset.workConnection = connection.id;
    pathsGroup.append(path);
    paths.push(path);
    linkDots.push(...appendPathMicrodots(linkDotsGroup, path, connection.toTone));
  }

  const nodesGroup = document.createElementNS(SVG_NS, 'g');
  nodesGroup.setAttribute('class', 'work-system__nodes');

  const nodeGroups: SVGGElement[] = [];
  for (const node of nodes) {
    const group = buildVisualNode(node, viewWidth, stackedMobileLabels);
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
