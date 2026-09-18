import type { Scene } from './types.ts';

const OBSERVER_THRESHOLDS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1] as const;
const MIN_VISIBLE_RATIO = 0.42;
const SWITCH_LEAD_RATIO = 0.07;

function pickActiveSceneId(
  ratios: ReadonlyMap<string, number>,
  currentId: string | null,
): string | null {
  let bestId: string | null = null;
  let bestRatio = 0;

  for (const [id, ratio] of ratios) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = id;
    }
  }

  if (!bestId || bestRatio < MIN_VISIBLE_RATIO) {
    return currentId;
  }

  if (currentId && currentId !== bestId) {
    const currentRatio = ratios.get(currentId) ?? 0;
    if (bestRatio < currentRatio + SWITCH_LEAD_RATIO) {
      return currentId;
    }
  }

  return bestId;
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

  const ratios = new Map<string, number>();
  for (const scene of scenes) {
    ratios.set(scene.id, 0);
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
    applyActive(pickActiveSceneId(ratios, activeId));
  };

  const scheduleSync = (): void => {
    if (pendingFrame) return;
    pendingFrame = window.requestAnimationFrame(syncActive);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.sceneId;
        if (!id) continue;
        ratios.set(id, entry.intersectionRatio);
      }
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

  scheduleSync();

  return {
    getActiveSceneId: () => activeId,
    destroy: () => {
      window.cancelAnimationFrame(pendingFrame);
      observer.disconnect();
      applyActive(null);
      for (const scene of scenes) {
        scene.lifecycle.destroy?.();
      }
    },
  };
}
