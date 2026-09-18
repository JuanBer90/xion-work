export { mountAmbientNetworkLayer, type AmbientExclusionNode } from './ambient-network.ts';
export { buildArchitectureNode, appendConnectionPathMicrodots } from './build-architecture-node.ts';
export { mountWorkArchitecture } from './mount-work-architecture.ts';
export { resolveArchitectureNodes, resolveArchitectureNode, architectureNodeById } from './resolve-nodes.ts';
export { architectureConnectionAnchors } from './connection-anchors.ts';
export { architectureNodeReach } from './node-reach.ts';
export type {
  ArchitectureConnectionDefinition,
  ArchitectureConnectionPathContext,
  ArchitectureConnectionPathResolver,
  ArchitectureNodeDefinition,
  ArchitectureNodePlacement,
  ArchitectureNodeVisualSpec,
  ArchitectureTone,
  MountedWorkArchitecture,
  ResolvedArchitectureNode,
  WorkArchitectureDefinition,
} from './types.ts';
