import { Nodeweave, type ConnectionPathContext, type NodeweaveInstance } from 'nodeweave';

export type ArchitectureTone = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet';

export type ArchitectureNodeVisualSpec = {
  weight: 'sm' | 'md' | 'lg' | 'xl';
  coreRadius: number;
  spread: number;
  particleCount: number;
  innerRingScale: number;
  outerRingScale: number;
  microMarks: number;
};

export type ArchitectureNodePlacement = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor?: 'start' | 'end' | 'middle';
};

export type ArchitectureNodeDefinition<TId extends string = string> = {
  id: TId;
  tone: ArchitectureTone;
  title: string;
  support: string;
  visual: ArchitectureNodeVisualSpec;
  desktop: ArchitectureNodePlacement;
  mobile: ArchitectureNodePlacement;
  mobileSupportLines?: string[];
  hubCore?: boolean;
};

export type ArchitectureConnectionDefinition<TId extends string = string> = {
  id: string;
  from: TId;
  to: TId;
  fromTone: ArchitectureTone;
  toTone: ArchitectureTone;
};

type ResolvedArchitectureNode<TId extends string> = Omit<ArchitectureNodeDefinition<TId>, 'desktop' | 'mobile'> & ArchitectureNodePlacement;

export type ArchitectureConnectionPathContext<TId extends string = string> = {
  connection: ArchitectureConnectionDefinition<TId>;
  from: ResolvedArchitectureNode<TId>;
  to: ResolvedArchitectureNode<TId>;
  anchors: { start: { x: number; y: number }; end: { x: number; y: number } };
  nodeReach: (node: ResolvedArchitectureNode<TId>) => number;
};

export type WorkArchitectureDefinition<TId extends string = string> = {
  nodes: readonly ArchitectureNodeDefinition<TId>[];
  connections: readonly ArchitectureConnectionDefinition<TId>[];
  viewport: { desktop: { width: number; height: number }; mobile: { width: number; viewBottomPad: number; ambientBottomPad: number } };
  mobileBreakpoint: string;
  ambient: { desktopHubs: readonly { x: number; y: number; bias: number }[]; mobileHubs: readonly { x: number; y: number; bias: number }[] };
  connectionPath: { desktop: (context: ArchitectureConnectionPathContext<TId>) => string; mobile: (context: ArchitectureConnectionPathContext<TId>) => string };
};

export type MountedWorkArchitecture = {
  instance: NodeweaveInstance;
  svg: SVGSVGElement;
  paths: SVGPathElement[];
  nodeGroups: SVGGElement[];
  ambientGroup: SVGGElement;
  ambientDots: SVGCircleElement[];
  ambientPaths: SVGPathElement[];
  linkDots: SVGCircleElement[];
  destroy: () => void;
};

export type ResponsiveWorkArchitecture = {
  getMounted: () => MountedWorkArchitecture;
  onRemount: (listener: (mounted: MountedWorkArchitecture) => void) => () => void;
  destroy: () => void;
};

const toneColor = (tone: ArchitectureTone): string => `var(--${tone})`;
const resolveNodes = <TId extends string>(definition: WorkArchitectureDefinition<TId>, mobile: boolean): ResolvedArchitectureNode<TId>[] => definition.nodes.map((node) => ({ ...node, ...(mobile ? node.mobile : node.desktop) }));
const supportLines = <TId extends string>(node: ResolvedArchitectureNode<TId>): string[] => node.mobileSupportLines ?? node.support.split(' · ').map((part) => part.trim());

function mobileViewHeight<TId extends string>(nodes: readonly ResolvedArchitectureNode<TId>[], bottomPad: number): number {
  return Math.max(...nodes.map((node) => Math.max(node.y + node.visual.spread * node.visual.outerRingScale, node.labelY + 13 + supportLines(node).length * 11))) + bottomPad;
}

function applySceneClasses<TId extends string>(instance: NodeweaveInstance, nodes: readonly ResolvedArchitectureNode<TId>[], mobile: boolean): void {
  const root = instance.element;
  root.classList.add('work-system__svg');
  root.querySelector<SVGGElement>('.nw-ambient')?.classList.add('work-system__ambient');
  for (const node of nodes) {
    const group = root.querySelector<SVGGElement>(`[data-nodeweave-node="${node.id}"]`);
    const labels = group?.querySelector<SVGGElement>('.nw-node__labels');
    group?.classList.add('work-node-group', `tone-${node.tone}`);
    labels?.classList.add('work-label-group');
    group?.querySelector<SVGRectElement>('.nw-node__hit')?.setAttribute('tabindex', '0');
    const title = labels?.querySelector<SVGTextElement>('.nw-label--title');
    title?.classList.add('work-label', 'work-label__title');
    const detail = labels?.querySelector<SVGTextElement>('.nw-label--detail');
    detail?.classList.add('work-label', 'work-label__support');
    if (!mobile || !labels || !detail) continue;
    detail.remove();
    labels.classList.add('work-label-group--mobile-stack');
    for (const [index, line] of supportLines(node).entries()) {
      const bullet = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      bullet.setAttribute('class', 'nw-label nw-label--detail work-label work-label__bullet');
      bullet.setAttribute('x', String(node.labelX));
      bullet.setAttribute('y', String(node.labelY + 13 + index * 11));
      bullet.setAttribute('text-anchor', node.labelAnchor ?? 'start');
      bullet.textContent = `· ${line}`;
      labels.append(bullet);
    }
  }
}

function mountWorkArchitecture<TId extends string>(container: HTMLElement, definition: WorkArchitectureDefinition<TId>): MountedWorkArchitecture {
  const mobile = window.matchMedia(definition.mobileBreakpoint).matches;
  const nodes = resolveNodes(definition, mobile);
  const viewWidth = mobile ? definition.viewport.mobile.width : definition.viewport.desktop.width;
  const viewHeight = mobile ? mobileViewHeight(nodes, definition.viewport.mobile.viewBottomPad) : definition.viewport.desktop.height;
  container.classList.toggle('work-section__system--mobile', mobile);
  if (mobile) container.style.setProperty('--work-system-aspect', String(viewWidth / viewHeight));
  else container.style.removeProperty('--work-system-aspect');
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path = mobile ? definition.connectionPath.mobile : definition.connectionPath.desktop;
  const instance = new Nodeweave(container, {
    width: viewWidth,
    height: viewHeight,
    className: 'work-system__svg',
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.title,
      detail: node.support,
      position: { x: node.x, y: node.y },
      labelPosition: { x: node.labelX, y: node.labelY, anchor: node.labelAnchor },
      color: toneColor(node.tone),
      className: `work-node-group tone-${node.tone}`,
      geometry: { ...node.visual, hub: node.hubCore },
    })),
    connections: definition.connections.map((connection) => ({
      id: connection.id,
      from: connection.from,
      to: connection.to,
      fromColor: toneColor(connection.fromTone),
      toColor: toneColor(connection.toTone),
      className: 'work-path work-path--link',
      markers: { count: 4, size: 0.75 },
      path: (context: ConnectionPathContext) => {
        const from = byId.get(context.connection.from as TId)!;
        const to = byId.get(context.connection.to as TId)!;
        return path({ connection: definition.connections.find((entry) => entry.id === context.connection.id)!, from, to, anchors: context.anchors, nodeReach: (node) => node.visual.spread * 0.42 });
      },
    })),
    ambient: {
      enabled: true,
      count: mobile ? 380 : window.matchMedia('(max-width: 1050px)').matches ? 720 : 1280,
      colors: ['var(--cyan)', 'var(--blue)', 'var(--green)', 'var(--orange)', 'var(--violet)', 'var(--red)', 'var(--yellow)'],
      hubs: mobile ? definition.ambient.mobileHubs : definition.ambient.desktopHubs,
      reach: viewWidth < 500 ? 34 : 38,
      movement: true,
      speed: 0.00065,
    },
    animation: { enabled: false, respectReducedMotion: true },
    interaction: { drag: { enabled: true, bounds: 'container' } },
  });
  applySceneClasses(instance, nodes, mobile);
  const root = instance.element;
  const paths = [...root.querySelectorAll<SVGPathElement>('.work-path')];
  const nodeGroups = [...root.querySelectorAll<SVGGElement>('.work-node-group')];
  const ambientGroup = root.querySelector<SVGGElement>('.nw-ambient')!;
  const ambientDots = [...root.querySelectorAll<SVGCircleElement>('.nw-ambient__dot')];
  const ambientPaths = [...root.querySelectorAll<SVGPathElement>('.nw-ambient__connection')];
  const linkDots = [...root.querySelectorAll<SVGCircleElement>('.nw-connection__marker')];
  for (const [index, dot] of linkDots.entries()) { dot.classList.add('work-link-dot'); dot.dataset.opacity = String(0.22 + ((index % 4) * 0.08)); }
  return { instance, svg: root, paths, nodeGroups, ambientGroup, ambientDots, ambientPaths, linkDots, destroy: () => { instance.destroy(); container.classList.remove('work-section__system--mobile'); container.style.removeProperty('--work-system-aspect'); } };
}

export function mountResponsiveWorkArchitecture<TId extends string>(container: HTMLElement, definition: WorkArchitectureDefinition<TId>): ResponsiveWorkArchitecture {
  const mediaQuery = window.matchMedia(definition.mobileBreakpoint);
  const listeners = new Set<(mounted: MountedWorkArchitecture) => void>();
  let mounted = mountWorkArchitecture(container, definition);
  let destroyed = false;
  const remount = (): void => { if (destroyed) return; mounted.destroy(); mounted = mountWorkArchitecture(container, definition); for (const listener of listeners) listener(mounted); };
  mediaQuery.addEventListener('change', remount);
  return { getMounted: () => mounted, onRemount: (listener) => { listeners.add(listener); return () => listeners.delete(listener); }, destroy: () => { if (destroyed) return; destroyed = true; mediaQuery.removeEventListener('change', remount); listeners.clear(); mounted.destroy(); } };
}
