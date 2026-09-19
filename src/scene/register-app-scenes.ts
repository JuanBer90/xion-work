import type { WorkSectionIntroController } from '@/animations/work-section-intro';
import type { ContactTransmissionController } from '@/contact/experiments/contact-transmission/contact-transmission';
import type { ContactAmbientController } from '@/scenes/contact-ambient';
import type { WorldbuildHeroController } from '@/scenes/worldbuild-hero';

import { createScene } from './create-scene.ts';
import { initSceneScrollController, type SceneScrollController } from './scene-scroll-controller.ts';
import type { Scene, SceneLifecycle } from './types.ts';

function noop(): void {
  return undefined;
}

function workSectionIntroLifecycle(intro: WorkSectionIntroController | null): SceneLifecycle {
  return {
    enter: () => {
      intro?.reset();
      intro?.play();
    },
    leave: () => {
      intro?.fadeOut(() => intro?.reset());
    },
    reset: () => {
      intro?.stop();
      intro?.reset();
    },
    destroy: () => {
      intro?.destroy();
    },
  };
}

export type InitAppScenesOptions = {
  dexstooreIntro?: WorkSectionIntroController | null;
  befitIntro?: WorkSectionIntroController | null;
  worldbuildHero?: WorldbuildHeroController | null;
  contactAmbient?: ContactAmbientController | null;
  contactTransmission?: ContactTransmissionController | null;
};

export function createHeroScene(worldbuildHero: WorldbuildHeroController | null = null): Scene | null {
  const element = document.getElementById('hero-scene');
  if (!element) return null;

  return createScene({
    id: 'hero',
    element,
    lifecycle: {
      enter: noop,
      leave: noop,
      reset: noop,
      destroy: () => worldbuildHero?.destroy(),
    },
  });
}

export function createDexstooreScene(intro: WorkSectionIntroController | null): Scene | null {
  const element = document.getElementById('work');
  if (!element) return null;

  return createScene({
    id: 'dexstoore',
    element,
    lifecycle: workSectionIntroLifecycle(intro),
  });
}

export function createBefitScene(intro: WorkSectionIntroController | null): Scene | null {
  const element = document.getElementById('befit');
  if (!element) return null;

  return createScene({
    id: 'befit',
    element,
    lifecycle: workSectionIntroLifecycle(intro),
  });
}

export function createContactScene(
  contactAmbient: ContactAmbientController | null = null,
  contactTransmission: ContactTransmissionController | null = null,
): Scene | null {
  const element = document.getElementById('contact');
  if (!element) return null;

  return createScene({
    id: 'contact',
    element,
    lifecycle: {
      enter: () => {
        contactAmbient?.enter();
        contactTransmission?.reset();
      },
      leave: () => {
        contactAmbient?.leave();
        contactTransmission?.reset();
      },
      reset: () => {
        contactTransmission?.reset();
      },
      destroy: () => {
        contactTransmission?.destroy();
        contactAmbient?.destroy();
      },
    },
  });
}

export function initAppScenes(options: InitAppScenesOptions = {}): SceneScrollController {
  const scenes = [
    createHeroScene(options.worldbuildHero ?? null),
    createDexstooreScene(options.dexstooreIntro ?? null),
    createBefitScene(options.befitIntro ?? null),
    createContactScene(options.contactAmbient ?? null, options.contactTransmission ?? null),
  ].filter((scene): scene is Scene => scene !== null);
  return initSceneScrollController(scenes);
}
