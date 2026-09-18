import { initNetworkIntro } from '@/animations/network-intro';
import { createWorkSectionIntroController } from '@/animations/work-section-intro';
import { initAppScenes } from '@/scene';
import { initCapabilityNetworkEmphasis } from '@/network/init-capability-emphasis';
import { initWorkArchitectureInteraction } from '@/network/init-work-architecture-interaction';
import { mountBefitSystem } from '@/scenes/befit-architecture';
import { mountDexstooreSystem } from '@/scenes/dexstoore-architecture';

initNetworkIntro({
  rotation: {
    enabled: false,
  },
});

initCapabilityNetworkEmphasis();

const workSection = document.querySelector<HTMLElement>('#work');
const workSystemMount = workSection?.querySelector<HTMLElement>('[data-work-system]') ?? null;
const mountedWorkSystem = workSystemMount ? mountDexstooreSystem(workSystemMount) : null;
const dexstooreIntro = createWorkSectionIntroController(workSection, mountedWorkSystem);

const befitSection = document.querySelector<HTMLElement>('#befit');
const befitSystemMount = befitSection?.querySelector<HTMLElement>('[data-work-system]') ?? null;
const mountedBefitSystem = befitSystemMount ? mountBefitSystem(befitSystemMount) : null;
const befitIntro = createWorkSectionIntroController(befitSection, mountedBefitSystem);

initAppScenes({ dexstooreIntro, befitIntro });

initWorkArchitectureInteraction(workSystemMount);
initWorkArchitectureInteraction(befitSystemMount);
