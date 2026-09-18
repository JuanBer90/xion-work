import { architectureConnectionAnchors } from '@/work-architecture/connection-anchors.ts';
import type {
  ArchitectureConnectionPathContext,
  ArchitectureNodeVisualSpec,
  WorkArchitectureDefinition,
} from '@/work-architecture/types.ts';

export type DexstooreNodeId =
  | 'storefront'
  | 'commerce-api'
  | 'order-engine'
  | 'operations'
  | 'fulfillment'
  | 'email'
  | 'whatsapp';

const NODE_BODY_SCALE = 1.3;
const RING_RADIUS_SCALE = 1.14;

function scaleNodeVisual(base: ArchitectureNodeVisualSpec): ArchitectureNodeVisualSpec {
  return {
    ...base,
    coreRadius: base.coreRadius * NODE_BODY_SCALE,
    spread: base.spread * NODE_BODY_SCALE,
    particleCount: Math.round(base.particleCount * 1.06),
    innerRingScale: base.innerRingScale * RING_RADIUS_SCALE,
    outerRingScale: base.outerRingScale * RING_RADIUS_SCALE,
  };
}

const NODE_VISUALS: Record<DexstooreNodeId, ArchitectureNodeVisualSpec> = {
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

const commerceApiVisual = scaleNodeVisual(NODE_VISUALS['commerce-api']);
const MOBILE_VIEW_WIDTH = 420;
const MOBILE_COMMERCE_API_SHIFT_X = Math.round(50 * (MOBILE_VIEW_WIDTH / 390));

function dexstooreDesktopConnectionPath({
  connection,
  from,
  to,
  nodeReach,
}: ArchitectureConnectionPathContext<DexstooreNodeId>): string {
  const { startX, startY, endX, endY } = architectureConnectionAnchors(from, to, nodeReach);

  switch (connection.id) {
    case 'storefront-commerce-api':
    case 'commerce-api-order-engine':
      return `M${startX} ${startY} L${endX} ${endY}`;
    case 'order-engine-operations':
      return `M${startX} ${startY} C${startX - 140} ${startY + 70} ${endX + 50} ${endY - 110} ${endX} ${endY}`;
    case 'order-engine-fulfillment':
      return `M${startX} ${startY} C${startX + 130} ${startY + 60} ${endX - 60} ${endY - 100} ${endX} ${endY}`;
    case 'fulfillment-whatsapp':
      return `M${startX} ${startY} C${from.x + 55} ${from.y + 95} ${to.x - 25} ${to.y - 70} ${endX} ${endY}`;
    case 'fulfillment-email': {
      const startEmailX = startX - 4;
      const startEmailY = startY;
      return `M${startEmailX} ${startEmailY} C${startEmailX - 70} ${startEmailY + 55} ${endX + 10} ${endY - 55} ${endX} ${endY}`;
    }
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

function dexstooreMobileConnectionPath({
  connection,
  from,
  to,
  nodeReach,
}: ArchitectureConnectionPathContext<DexstooreNodeId>): string {
  const { startX, startY, endX, endY } = architectureConnectionAnchors(from, to, nodeReach);
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
      return `M${startX - 8} ${startY} C${from.x - 58} ${from.y + 52} ${endX + 28} ${endY - 48} ${endX} ${endY}`;
    case 'fulfillment-whatsapp':
      return `M${startX + 8} ${startY} C${from.x + 52} ${from.y + 50} ${to.x - 24} ${endY - 46} ${endX} ${endY}`;
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

export const DEXSTOORE_ARCHITECTURE: WorkArchitectureDefinition<DexstooreNodeId> = {
  mobileBreakpoint: '(max-width: 760px)',
  viewport: {
    desktop: { width: 960, height: 720 },
    mobile: {
      width: MOBILE_VIEW_WIDTH,
      viewBottomPad: 0,
      ambientBottomPad: 4,
    },
  },
  ambient: {
    desktopHubs: [
      { x: 404, y: 206, bias: 1.05 },
      { x: 388, y: 334, bias: 1.35 },
      { x: 108, y: 498, bias: 1.0 },
      { x: 648, y: 486, bias: 1.08 },
    ],
    mobileHubs: [
      { x: 196, y: 172, bias: 1.05 },
      { x: 252, y: 231, bias: 1.35 },
      { x: 108, y: 417, bias: 1.0 },
      { x: 328, y: 346, bias: 1.08 },
    ],
  },
  connectionPath: {
    desktop: dexstooreDesktopConnectionPath,
    mobile: dexstooreMobileConnectionPath,
  },
  nodes: [
    {
      id: 'storefront',
      tone: 'orange',
      title: 'Storefront',
      support: 'Browse · Checkout · Purchase',
      visual: scaleNodeVisual(NODE_VISUALS.storefront),
      desktop: { x: 392, y: 88, labelX: 434, labelY: 84 },
      mobile: {
        x: 160,
        y: 84,
        labelX: 232,
        labelY: 64,
        labelAnchor: 'start',
      },
    },
    {
      id: 'commerce-api',
      tone: 'cyan',
      title: 'Commerce API',
      support: 'Products · Orders · Customers',
      visual: commerceApiVisual,
      desktop: { x: 404, y: 206, labelX: 446, labelY: 202 },
      mobile: {
        x: 165,
        y: 182,
        labelX:
          156 +
          commerceApiVisual.spread * commerceApiVisual.outerRingScale +
          MOBILE_COMMERCE_API_SHIFT_X,
        labelY: 162,
        labelAnchor: 'start',
      },
    },
    {
      id: 'order-engine',
      tone: 'violet',
      title: 'Order Engine',
      support: 'Processing · Assignment · Fulfillment',
      visual: scaleNodeVisual(NODE_VISUALS['order-engine']),
      hubCore: true,
      desktop: { x: 388, y: 334, labelX: 430, labelY: 330 },
      mobile: {
        x: 160,
        y: 280,
        labelX: 234,
        labelY: 271,
        labelAnchor: 'start',
      },
    },
    {
      id: 'operations',
      tone: 'green',
      title: 'Operations',
      support: 'Manage · Support · Scale',
      visual: scaleNodeVisual(NODE_VISUALS.operations),
      desktop: { x: 108, y: 498, labelX: 150, labelY: 494 },
      mobile: { x: 90, y: 387, labelX: 50, labelY: 440, labelAnchor: 'start' },
    },
    {
      id: 'fulfillment',
      tone: 'blue',
      title: 'Fulfillment',
      support: 'Automated Delivery',
      visual: scaleNodeVisual(NODE_VISUALS.fulfillment),
      desktop: { x: 648, y: 486, labelX: 690, labelY: 482 },
      mobile: { x: 220, y: 386, labelX: 270, labelY: 380, labelAnchor: 'start' },
    },
    {
      id: 'email',
      tone: 'red',
      title: 'Email',
      support: 'Delivery · Receipts',
      visual: scaleNodeVisual(NODE_VISUALS.email),
      desktop: { x: 528, y: 628, labelX: 570, labelY: 624 },
      mobile: { x: 160, y: 470, labelX: 140, labelY: 510, labelAnchor: 'start' },
    },
    {
      id: 'whatsapp',
      tone: 'yellow',
      title: 'WhatsApp',
      support: 'Twilio Integration',
      visual: scaleNodeVisual(NODE_VISUALS.whatsapp),
      mobileSupportLines: ['Twilio', 'Integration'],
      desktop: { x: 752, y: 618, labelX: 794, labelY: 614 },
      mobile: { x: 290, y: 480, labelX: 280, labelY: 520, labelAnchor: 'start' },
    },
  ],
  connections: [
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
  ],
};
