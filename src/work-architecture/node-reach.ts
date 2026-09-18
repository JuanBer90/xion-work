import type { ResolvedArchitectureNode } from './types.ts';

export function architectureNodeReach<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
): number {
  return node.visual.spread * 0.42;
}
