import { initHeroIntro } from '@/animations/hero-intro';
import { createWorkSectionIntroController } from '@/animations/work-section-intro';
import { initAppScenes } from '@/scene';
import { initCapabilityEmphasis } from '@/network/init-capability-emphasis';
import { initWorkArchitectureInteraction } from '@/network/init-work-architecture-interaction';
import { mountResponsiveBefitSystem } from '@/scenes/befit-architecture';
import { mountResponsiveDexstooreSystem } from '@/scenes/dexstoore-architecture';
import { mountWorldbuildHero } from '@/scenes/worldbuild-hero';

const heroIntro = initHeroIntro();
const disposeCapabilityEmphasis = initCapabilityEmphasis();

const heroGlobeMount = document.querySelector<HTMLElement>('[data-worldbuild-hero]');
const worldbuildHero = heroGlobeMount ? mountWorldbuildHero(heroGlobeMount) : null;

const workSection = document.querySelector<HTMLElement>('#work');
const workSystemMount = workSection?.querySelector<HTMLElement>('[data-work-system]') ?? null;
const dexstooreArchitecture = workSystemMount
  ? mountResponsiveDexstooreSystem(workSystemMount)
  : null;
const mountedWorkSystem = dexstooreArchitecture?.getMounted() ?? null;
const dexstooreIntro = createWorkSectionIntroController(workSection, mountedWorkSystem);

const befitSection = document.querySelector<HTMLElement>('#befit');
const befitSystemMount = befitSection?.querySelector<HTMLElement>('[data-work-system]') ?? null;
const befitArchitecture = befitSystemMount
  ? mountResponsiveBefitSystem(befitSystemMount)
  : null;
const mountedBefitSystem = befitArchitecture?.getMounted() ?? null;
const befitIntro = createWorkSectionIntroController(befitSection, mountedBefitSystem);

const appScenes = initAppScenes({ dexstooreIntro, befitIntro, worldbuildHero });

let disposeDexstooreInteraction = initWorkArchitectureInteraction(workSystemMount);
let disposeBefitInteraction = initWorkArchitectureInteraction(befitSystemMount);

const unsubscribeDexstooreRemount = dexstooreArchitecture?.onRemount((mounted) => {
  dexstooreIntro?.replaceSystem(mounted);
  disposeDexstooreInteraction();
  disposeDexstooreInteraction = initWorkArchitectureInteraction(workSystemMount);
  if (appScenes.getActiveSceneId() === 'dexstoore') dexstooreIntro?.play();
});

const unsubscribeBefitRemount = befitArchitecture?.onRemount((mounted) => {
  befitIntro?.replaceSystem(mounted);
  disposeBefitInteraction();
  disposeBefitInteraction = initWorkArchitectureInteraction(befitSystemMount);
  if (appScenes.getActiveSceneId() === 'befit') befitIntro?.play();
});

let destroyed = false;

const destroyApp = (): void => {
  if (destroyed) return;
  destroyed = true;
  unsubscribeDexstooreRemount?.();
  unsubscribeBefitRemount?.();
  disposeDexstooreInteraction();
  disposeBefitInteraction();
  disposeCapabilityEmphasis();
  appScenes.destroy();
  dexstooreArchitecture?.destroy();
  befitArchitecture?.destroy();
  heroIntro?.destroy();
};

window.addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) destroyApp();
  },
  { once: true },
);

if (import.meta.hot) {
  import.meta.hot.dispose(destroyApp);
}
