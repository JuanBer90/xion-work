import type {
  ArchitectureNodeDefinition,
  ResolvedArchitectureNode,
  WorkArchitectureDefinition,
} from './types.ts';

export function resolveArchitectureNodes<TId extends string>(
  definition: WorkArchitectureDefinition<TId>,
  mobileLayout: boolean,
): ResolvedArchitectureNode<TId>[] {
  return definition.nodes.map((node) => resolveArchitectureNode(node, mobileLayout));
}

export function resolveArchitectureNode<TId extends string>(
  node: ArchitectureNodeDefinition<TId>,
  mobileLayout: boolean,
): ResolvedArchitectureNode<TId> {
  const placement = mobileLayout ? node.mobile : node.desktop;
  return {
    id: node.id,
    tone: node.tone,
    title: node.title,
    support: node.support,
    visual: node.visual,
    mobileSupportLines: node.mobileSupportLines,
    hubCore: node.hubCore,
    ...placement,
  };
}

export function architectureNodeById<TId extends string>(
  nodes: readonly ResolvedArchitectureNode<TId>[],
  id: TId,
): ResolvedArchitectureNode<TId> {
  const node = nodes.find((entry) => entry.id === id);
  if (!node) throw new Error(`Unknown architecture node: ${id}`);
  return node;
}
