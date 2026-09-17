import { createTimeline, stagger, type Target, type Timeline } from 'animejs';

import type { MountedPiece } from '@/components/system-pieces';
import type { PiecePose, ResolvedLayouts } from '@/scenes/xion-geometry';

export const HERO_ASSEMBLY_TIMING = {
  initialHold: 140,
  movement: 1_530,
  staggerStep: 4,
} as const;

function poseValue(
  poses: readonly PiecePose[],
  property: keyof PiecePose,
): (_target?: Target, index?: number) => number {
  return (_target?: Target, index = 0) => poses[index]?.[property] ?? 0;
}

/**
 * Creates a one-shot, intentionally seekable assembly timeline. The same
 * layouts can later be reused by scroll-driven scenes without changing pieces.
 */
export function createHeroAssembly(
  mountedPieces: readonly MountedPiece[],
  layouts: ResolvedLayouts,
  onComplete: () => void,
): Timeline {
  const elements = mountedPieces.map(({ element }) => element);
  const timeline = createTimeline({
    autoplay: false,
    defaults: { ease: 'inOutQuart' },
    onComplete,
  });

  timeline.set(elements, {
    x: { to: poseValue(layouts.dispersed, 'x') },
    y: { to: poseValue(layouts.dispersed, 'y') },
    rotate: { to: poseValue(layouts.dispersed, 'rotate') },
    scale: { to: poseValue(layouts.dispersed, 'scale') },
    opacity: { to: poseValue(layouts.dispersed, 'opacity') },
  });

  timeline.add(
    elements,
    {
      x: { to: poseValue(layouts.xion, 'x') },
      y: { to: poseValue(layouts.xion, 'y') },
      rotate: { to: poseValue(layouts.xion, 'rotate') },
      scale: { to: poseValue(layouts.xion, 'scale') },
      opacity: { to: poseValue(layouts.xion, 'opacity') },
      duration: HERO_ASSEMBLY_TIMING.movement,
      delay: stagger(HERO_ASSEMBLY_TIMING.staggerStep, { from: 'center' }),
    },
    HERO_ASSEMBLY_TIMING.initialHold,
  );

  return timeline;
}
