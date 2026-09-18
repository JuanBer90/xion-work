import type { WorkSectionIntroController } from '@/animations/work-section-intro';

import { createScene } from './create-scene.ts';
import { initSceneScrollController, type SceneScrollController } from './scene-scroll-controller.ts';
import type { Scene } from './types.ts';

function noop(): void {
  return undefined;
}

export type InitAppScenesOptions = {
  dexstooreIntro?: WorkSectionIntroController | null;
};

export function createHeroScene(): Scene | null {
  const element = document.getElementById('hero-scene');
  if (!element) return null;

  return createScene({
    id: 'hero',
    element,
    lifecycle: {
      enter: noop,
      leave: noop,
      reset: noop,
      destroy: noop,
    },
  });
}

export function createDexstooreScene(intro: WorkSectionIntroController | null): Scene | null {
  const element = document.getElementById('work');
  if (!element) return null;

  return createScene({
    id: 'dexstoore',
    element,
    lifecycle: {
      enter: () => {
        intro?.reset();
        intro?.play();
      },
      leave: () => {
        intro?.stop();
        intro?.reset();
      },
      reset: () => {
        intro?.stop();
        intro?.reset();
      },
      destroy: () => {
        intro?.destroy();
      },
    },
  });
}

export function initAppScenes(options: InitAppScenesOptions = {}): SceneScrollController {
  const scenes = [
    createHeroScene(),
    createDexstooreScene(options.dexstooreIntro ?? null),
  ].filter((scene): scene is Scene => scene !== null);
  return initSceneScrollController(scenes);
}
