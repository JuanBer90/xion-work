export type ArchitectureTone =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'violet';

export type ArchitectureNodeWeight = 'sm' | 'md' | 'lg' | 'xl';

export type ArchitectureNodeVisualSpec = {
  weight: ArchitectureNodeWeight;
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
  /** Overrides mobile bullet lines (default: split `support` on middle dots). */
  mobileSupportLines?: string[];
  /** Adds hub styling on the node core (e.g. primary system node). */
  hubCore?: boolean;
};

export type ResolvedArchitectureNode<TId extends string = string> = {
  id: TId;
  tone: ArchitectureTone;
  title: string;
  support: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor?: 'start' | 'end' | 'middle';
  visual: ArchitectureNodeVisualSpec;
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

export type ArchitectureConnectionPathContext<TId extends string = string> = {
  connection: ArchitectureConnectionDefinition<TId>;
  from: ResolvedArchitectureNode<TId>;
  to: ResolvedArchitectureNode<TId>;
  nodeReach: (node: ResolvedArchitectureNode<TId>) => number;
};

export type ArchitectureConnectionPathResolver<TId extends string = string> = (
  context: ArchitectureConnectionPathContext<TId>,
) => string;

export type ArchitectureAmbientHub = { x: number; y: number; bias: number };

export type WorkArchitectureViewport = {
  desktop: { width: number; height: number };
  mobile: {
    width: number;
    viewBottomPad: number;
    ambientBottomPad: number;
  };
};

export type WorkArchitectureDefinition<TId extends string = string> = {
  nodes: readonly ArchitectureNodeDefinition<TId>[];
  connections: readonly ArchitectureConnectionDefinition<TId>[];
  viewport: WorkArchitectureViewport;
  mobileBreakpoint: string;
  ambient: {
    desktopHubs: readonly ArchitectureAmbientHub[];
    mobileHubs: readonly ArchitectureAmbientHub[];
  };
  connectionPath: {
    desktop: ArchitectureConnectionPathResolver<TId>;
    mobile: ArchitectureConnectionPathResolver<TId>;
  };
};

export type MountedWorkArchitecture = {
  svg: SVGSVGElement;
  paths: SVGPathElement[];
  nodeGroups: SVGGElement[];
  ambientGroup: SVGGElement;
  ambientDots: SVGCircleElement[];
  ambientPaths: SVGPathElement[];
  linkDots: SVGCircleElement[];
  destroy: () => void;
};
