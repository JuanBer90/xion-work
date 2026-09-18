import { architectureNodeReach } from './node-reach.ts';
import type { ResolvedArchitectureNode } from './types.ts';

export type ArchitectureConnectionAnchors = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export function architectureConnectionAnchors<TId extends string>(
  from: ResolvedArchitectureNode<TId>,
  to: ResolvedArchitectureNode<TId>,
  nodeReach: (node: ResolvedArchitectureNode<TId>) => number = architectureNodeReach,
): ArchitectureConnectionAnchors {
  const reachFrom = nodeReach(from);
  const reachTo = nodeReach(to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy >= 0) {
      return {
        startX: from.x,
        startY: from.y + reachFrom,
        endX: to.x,
        endY: to.y - reachTo,
      };
    }
    return {
      startX: from.x,
      startY: from.y - reachFrom,
      endX: to.x,
      endY: to.y + reachTo,
    };
  }

  if (dx >= 0) {
    return {
      startX: from.x + reachFrom,
      startY: from.y,
      endX: to.x - reachTo,
      endY: to.y,
    };
  }

  return {
    startX: from.x - reachFrom,
    startY: from.y,
    endX: to.x + reachTo,
    endY: to.y,
  };
}
