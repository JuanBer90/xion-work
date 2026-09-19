import type {
  ArchitectureConnectionPathContext,
  ArchitectureNodeVisualSpec,
  WorkArchitectureDefinition,
} from './work-architecture-integration.ts';

export type BefitNodeId =
  | 'befit-core'
  | 'access-gateway'
  | 'biometric-gate'
  | 'self-service-payment'
  | 'pos-terminal'
  | 'electronic-invoicing'
  | 'tax-system';

const NODE_BODY_SCALE = 1.3;
const RING_RADIUS_SCALE = 1.14;
const MOBILE_VIEW_WIDTH = 420;

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

const NODE_VISUALS: Record<BefitNodeId, ArchitectureNodeVisualSpec> = {
  'befit-core': {
    weight: 'xl',
    coreRadius: 4.2,
    spread: 36,
    particleCount: 108,
    innerRingScale: 0.48,
    outerRingScale: 1.02,
    microMarks: 8,
  },
  'access-gateway': {
    weight: 'lg',
    coreRadius: 3.4,
    spread: 25,
    particleCount: 66,
    innerRingScale: 0.51,
    outerRingScale: 0.95,
    microMarks: 6,
  },
  'biometric-gate': {
    weight: 'md',
    coreRadius: 2.9,
    spread: 20,
    particleCount: 48,
    innerRingScale: 0.53,
    outerRingScale: 0.91,
    microMarks: 4,
  },
  'self-service-payment': {
    weight: 'lg',
    coreRadius: 3.5,
    spread: 26,
    particleCount: 68,
    innerRingScale: 0.5,
    outerRingScale: 0.96,
    microMarks: 6,
  },
  'pos-terminal': {
    weight: 'md',
    coreRadius: 2.8,
    spread: 19,
    particleCount: 44,
    innerRingScale: 0.54,
    outerRingScale: 0.9,
    microMarks: 4,
  },
  'electronic-invoicing': {
    weight: 'lg',
    coreRadius: 3.4,
    spread: 25,
    particleCount: 66,
    innerRingScale: 0.51,
    outerRingScale: 0.95,
    microMarks: 6,
  },
  'tax-system': {
    weight: 'md',
    coreRadius: 2.9,
    spread: 20,
    particleCount: 48,
    innerRingScale: 0.53,
    outerRingScale: 0.91,
    microMarks: 4,
  },
};

function befitDesktopConnectionPath({
  connection,
  anchors,
  from,
  to,
}: ArchitectureConnectionPathContext<BefitNodeId>): string {
  const { start, end } = anchors;
  const startX = start.x; const startY = start.y; const endX = end.x; const endY = end.y;
  const upward = to.y < from.y;

  switch (connection.id) {
    case 'core-access-gateway':
      return `M${startX} ${startY} C${startX - 95} ${startY - 48} ${endX + 40} ${endY + (upward ? -55 : 55)} ${endX} ${endY}`;
    case 'access-biometric-gate':
      return `M${startX} ${startY} C${startX - 72} ${startY - 38} ${endX + 28} ${endY + (upward ? -42 : 42)} ${endX} ${endY}`;
    case 'core-self-service-payment':
      return `M${startX} ${startY} C${startX - 88} ${startY + 52} ${endX + 35} ${endY - 48} ${endX} ${endY}`;
    case 'self-service-pos-terminal':
      return `M${startX} ${startY} C${startX - 65} ${startY + 42} ${endX + 22} ${endY - 38} ${endX} ${endY}`;
    case 'core-electronic-invoicing':
      return `M${startX} ${startY} C${startX + 92} ${startY - 44} ${endX - 38} ${endY + (upward ? -52 : 52)} ${endX} ${endY}`;
    case 'invoicing-tax-system':
      return `M${startX} ${startY} C${startX + 58} ${startY - 36} ${endX - 24} ${endY + (upward ? -40 : 40)} ${endX} ${endY}`;
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

function befitMobileConnectionPath({
  connection,
  anchors,
  from,
  to,
}: ArchitectureConnectionPathContext<BefitNodeId>): string {
  const { start, end } = anchors;
  const startX = start.x; const startY = start.y; const endX = end.x; const endY = end.y;
  const midY = (startY + endY) / 2;
  const upward = to.y < from.y;

  switch (connection.id) {
    case 'core-access-gateway':
      return `M${startX} ${startY} C${startX + 14} ${midY - 8} ${endX - 12} ${midY + 6} ${endX} ${endY}`;
    case 'access-biometric-gate':
      return `M${startX} ${startY} C${startX + 48} ${startY - 28} ${endX - 18} ${endY + (upward ? -22 : 22)} ${endX} ${endY}`;
    case 'core-self-service-payment':
      return `M${startX} ${startY} C${startX - 16} ${midY + 10} ${endX + 12} ${midY - 6} ${endX} ${endY}`;
    case 'self-service-pos-terminal':
      return `M${startX} ${startY} C${startX + 52} ${startY + 36} ${endX - 20} ${endY - 28} ${endX} ${endY}`;
    case 'core-electronic-invoicing':
      return `M${startX} ${startY} C${startX - 58} ${startY - 32} ${endX + 16} ${endY + 24} ${endX} ${endY}`;
    case 'invoicing-tax-system':
      return `M${startX} ${startY} C${startX + 44} ${startY - 26} ${endX - 14} ${endY + (upward ? -18 : 18)} ${endX} ${endY}`;
    default:
      return `M${startX} ${startY} L${endX} ${endY}`;
  }
}

export const BEFIT_ARCHITECTURE: WorkArchitectureDefinition<BefitNodeId> = {
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
      { x: 498, y: 348, bias: 1.38 },
      { x: 360, y: 186, bias: 1.05 },
      { x: 318, y: 512, bias: 1.02 },
      { x: 688, y: 198, bias: 1.08 },
    ],
    mobileHubs: [
      { x: 158, y: 272, bias: 1.35 },
      { x: 162, y: 148, bias: 1.05 },
      { x: 162, y: 388, bias: 1.0 },
      { x: 88, y: 198, bias: 1.06 },
    ],
  },
  connectionPath: {
    desktop: befitDesktopConnectionPath,
    mobile: befitMobileConnectionPath,
  },
  nodes: [
    {
      id: 'befit-core',
      tone: 'violet',
      title: 'Befit Core',
      support: 'Members · Billing · Account Status',
      visual: scaleNodeVisual(NODE_VISUALS['befit-core']),
      hubCore: true,
      desktop: { x: 498, y: 348, labelX: 544, labelY: 342 },
      mobile: {
        x: 250,
        y: 232,
        labelX: 294,
        labelY: 210,
        labelAnchor: 'start',
      },
    },
    {
      id: 'access-gateway',
      tone: 'cyan',
      title: 'Access Gateway',
      support: 'User Sync · Access Control',
      visual: scaleNodeVisual(NODE_VISUALS['access-gateway']),
      desktop: { x: 358, y: 182, labelX: 400, labelY: 176 },
      mobile: {
        x: 242,
        y: 148,
        labelX: 290,
        labelY: 130,
        labelAnchor: 'start',
      },
    },
    {
      id: 'biometric-gate',
      tone: 'blue',
      title: 'Biometric Gate',
      support: 'Fingerprint · Turnstile',
      visual: scaleNodeVisual(NODE_VISUALS['biometric-gate']),
      desktop: { x: 162, y: 94, labelX: 204, labelY: 88 },
      mobile: {
        x: 300,
        y: 66,
        labelX: 258,
        labelY: 10,
        labelAnchor: 'start',
      },
    },
    {
      id: 'self-service-payment',
      tone: 'orange',
      title: 'Self-Service Payment',
      support: 'Membership · Account Status',
      visual: scaleNodeVisual(NODE_VISUALS['self-service-payment']),
      desktop: { x: 322, y: 518, labelX: 364, labelY: 512 },
      mobile: {
        x: 262,
        y: 348,
        labelX: 80,
        labelY: 342,
        labelAnchor: 'start',
      },
    },
    {
      id: 'pos-terminal',
      tone: 'yellow',
      title: 'POS Terminal',
      support: 'Card Payment · On-Site',
      visual: scaleNodeVisual(NODE_VISUALS['pos-terminal']),
      desktop: { x: 124, y: 632, labelX: 166, labelY: 626 },
      mobile: {
        x: 242,
        y: 438,
        labelX: 280,
        labelY: 432,
        labelAnchor: 'start',
      },
    },
    {
      id: 'electronic-invoicing',
      tone: 'green',
      title: 'Electronic Invoicing',
      support: 'Fiscal Documents · Automation',
      visual: scaleNodeVisual(NODE_VISUALS['electronic-invoicing']),
      desktop: { x: 692, y: 192, labelX: 734, labelY: 186 },
      mobile: {
        x: 88,
        y: 198,
        labelX: 20,
        labelY: 252,
        labelAnchor: 'start',
      },
    },
    {
      id: 'tax-system',
      tone: 'red',
      title: 'Tax System',
      support: 'Compliance · Fiscal Reporting',
      visual: scaleNodeVisual(NODE_VISUALS['tax-system']),
      desktop: { x: 838, y: 86, labelX: 880, labelY: 80 },
      mobile: {
        x: 98,
        y: 108,
        labelX: 28,
        labelY: 50,
        labelAnchor: 'start',
      },
    },
  ],
  connections: [
    {
      id: 'core-access-gateway',
      from: 'befit-core',
      to: 'access-gateway',
      fromTone: 'violet',
      toTone: 'cyan',
    },
    {
      id: 'access-biometric-gate',
      from: 'access-gateway',
      to: 'biometric-gate',
      fromTone: 'cyan',
      toTone: 'blue',
    },
    {
      id: 'core-self-service-payment',
      from: 'befit-core',
      to: 'self-service-payment',
      fromTone: 'violet',
      toTone: 'orange',
    },
    {
      id: 'self-service-pos-terminal',
      from: 'self-service-payment',
      to: 'pos-terminal',
      fromTone: 'orange',
      toTone: 'yellow',
    },
    {
      id: 'core-electronic-invoicing',
      from: 'befit-core',
      to: 'electronic-invoicing',
      fromTone: 'violet',
      toTone: 'green',
    },
    {
      id: 'invoicing-tax-system',
      from: 'electronic-invoicing',
      to: 'tax-system',
      fromTone: 'green',
      toTone: 'red',
    },
  ],
};
