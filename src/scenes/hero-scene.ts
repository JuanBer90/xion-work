import type { Timeline } from 'animejs';

import { createHeroAssembly } from '@/animations/hero-assembly';
import { mountSystemPieces, type MountedPiece } from '@/components/system-pieces';
import { resolveLayouts, SYSTEM_PIECES, type StageBounds } from '@/scenes/xion-geometry';
import { prefersReducedMotion } from '@/utils/motion';

const SCENE_SELECTOR = '#hero-scene';
const STAGE_SELECTOR = '[data-scene-stage]';
const SVG_SELECTOR = '[data-system-svg]';

export type HeroSceneController = {
  setReducedMotion(reduced: boolean): void;
  refresh(): void;
  destroy(): void;
};

function getStageBounds(stage: HTMLElement): StageBounds {
  const rect = stage.getBoundingClientRect();
  return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
}

/** Creates the persistent SVG system and plays its one-shot entrance assembly. */
export function initHeroScene(): HeroSceneController | null {
  const scene = document.querySelector(SCENE_SELECTOR);
  const stage = document.querySelector(STAGE_SELECTOR);
  const svg = document.querySelector(SVG_SELECTOR);

  if (
    !(scene instanceof HTMLElement) ||
    !(stage instanceof HTMLElement) ||
    !(svg instanceof SVGSVGElement)
  ) {
    console.warn('[hero-scene] Missing required scene elements.');
    return null;
  }

  const mountedPieces: MountedPiece[] = mountSystemPieces(svg, SYSTEM_PIECES);
  let reducedMotion = prefersReducedMotion();
  let assembled = reducedMotion;
  let animation: Timeline;
  let resizeFrame = 0;
  let startFrame = 0;

  const renderWordmark = (): void => {
    animation.seek(animation.duration, true);
  };

  const createAnimation = (): void => {
    const bounds = getStageBounds(stage);
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    animation?.revert();
    animation = createHeroAssembly(
      mountedPieces,
      resolveLayouts(bounds),
      () => {
        assembled = true;
      },
    );
  };

  const playAssembly = (): void => {
    window.cancelAnimationFrame(startFrame);
    animation.seek(0, true);
    startFrame = window.requestAnimationFrame(() => animation.play());
  };

  const refresh = (): void => {
    const previousProgress = animation.duration
      ? animation.currentTime / animation.duration
      : 0;
    createAnimation();
    if (reducedMotion || assembled) {
      renderWordmark();
      return;
    }
    animation.seek(previousProgress * animation.duration, true).play();
  };

  const setReducedMotion = (nextReducedMotion: boolean): void => {
    if (reducedMotion === nextReducedMotion) {
      return;
    }

    reducedMotion = nextReducedMotion;
    scene.setAttribute('data-reduced-motion', String(reducedMotion));

    if (reducedMotion) {
      animation.pause();
      renderWordmark();
      return;
    }

    assembled = false;
    createAnimation();
    playAssembly();
  };

  const resizeObserver = new ResizeObserver(() => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(refresh);
  });

  scene.setAttribute('data-reduced-motion', String(reducedMotion));
  createAnimation();
  resizeObserver.observe(stage);

  if (reducedMotion) {
    renderWordmark();
  } else {
    playAssembly();
  }

  return {
    setReducedMotion,
    refresh,
    destroy: () => {
      window.cancelAnimationFrame(resizeFrame);
      window.cancelAnimationFrame(startFrame);
      resizeObserver.disconnect();
      animation.revert();
    },
  };
}
