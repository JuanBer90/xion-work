import type { Scene } from './types.ts';

const OBSERVER_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 1] as const;

/**
 * Active scene = section whose vertical center is closest to the viewport center
 * (among sections that intersect the viewport). Matches stacked scroll-snap sections.
 */
function pickActiveSceneId(scenes: readonly Scene[]): string | null {
  const viewportMid = window.innerHeight * 0.5;
  let activeId: string | null = null;
  let bestDistance = Infinity;

  for (const scene of scenes) {
    const rect = scene.element.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) continue;

    const sectionMid = rect.top + rect.height / 2;
    const distance = Math.abs(sectionMid - viewportMid);
    if (distance < bestDistance) {
      bestDistance = distance;
      activeId = scene.id;
    }
  }

  return activeId;
}

export type SceneScrollController = {
  getActiveSceneId(): string | null;
  destroy(): void;
};

/**
 * Tracks which registered scene is active using IntersectionObserver ratios.
 * Native document scrolling only — no scroll interception.
 */
export function initSceneScrollController(scenes: readonly Scene[]): SceneScrollController {
  if (scenes.length === 0) {
    return {
      getActiveSceneId: () => null,
      destroy: () => undefined,
    };
  }

  let activeId: string | null = null;
  let pendingFrame = 0;

  const applyActive = (nextId: string | null): void => {
    if (nextId === activeId) return;

    if (activeId) {
      const previous = scenes.find((scene) => scene.id === activeId);
      previous?.lifecycle.leave?.();
    }

    activeId = nextId;

    if (activeId) {
      const next = scenes.find((scene) => scene.id === activeId);
      next?.lifecycle.enter?.();
    }
  };

  const syncActive = (): void => {
    pendingFrame = 0;
    applyActive(pickActiveSceneId(scenes));
  };

  const scheduleSync = (): void => {
    if (pendingFrame) return;
    pendingFrame = window.requestAnimationFrame(syncActive);
  };

  const observer = new IntersectionObserver(
    () => {
      scheduleSync();
    },
    {
      threshold: [...OBSERVER_THRESHOLDS],
      root: null,
      rootMargin: '0px',
    },
  );

  for (const scene of scenes) {
    scene.element.dataset.sceneId = scene.id;
    observer.observe(scene.element);
  }

  window.addEventListener('scroll', scheduleSync, { passive: true });
  window.addEventListener('resize', scheduleSync, { passive: true });
  scheduleSync();

  return {
    getActiveSceneId: () => activeId,
    destroy: () => {
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.cancelAnimationFrame(pendingFrame);
      observer.disconnect();
      applyActive(null);
      for (const scene of scenes) {
        scene.lifecycle.destroy?.();
      }
    },
  };
}
