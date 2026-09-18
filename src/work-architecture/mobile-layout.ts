import type { ResolvedArchitectureNode } from './types.ts';

export const MOBILE_BULLET_GAP_AFTER_TITLE = 13;
export const MOBILE_BULLET_LINE_STEP = 11;

export function mobileSupportBulletLines<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
): string[] {
  if (node.mobileSupportLines) return node.mobileSupportLines;
  return node.support.split(' · ').map((part) => part.trim());
}

export function mobileLabelBlockBottom<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
): number {
  const bulletCount = mobileSupportBulletLines(node).length;
  return node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + bulletCount * MOBILE_BULLET_LINE_STEP;
}

export function mobileArchitectureContentBottom<TId extends string>(
  nodes: readonly ResolvedArchitectureNode<TId>[],
): number {
  let maxY = 0;
  for (const node of nodes) {
    const haloBottom = node.y + node.visual.spread * node.visual.outerRingScale;
    maxY = Math.max(maxY, haloBottom, mobileLabelBlockBottom(node));
  }
  return maxY;
}

export function mobileArchitectureViewHeight<TId extends string>(
  nodes: readonly ResolvedArchitectureNode<TId>[],
  viewBottomPad: number,
): number {
  return mobileArchitectureContentBottom(nodes) + viewBottomPad;
}
