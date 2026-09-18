import { initNetworkIntro } from '@/animations/network-intro';
import { createWorkSectionIntroController } from '@/animations/work-section-intro';
import { initAppScenes } from '@/scene';
import { initCapabilityNetworkEmphasis } from '@/network/init-capability-emphasis';
import { initWorkArchitectureInteraction } from '@/network/init-work-architecture-interaction';
import { mountDexstooreSystem } from '@/scenes/dexstoore-architecture';

initNetworkIntro({
  rotation: {
    enabled: false,
  },
});

initCapabilityNetworkEmphasis();

const workSection = document.querySelector<HTMLElement>('.work-section');
const workSystemMount = document.querySelector<HTMLElement>('[data-work-system]');
const mountedWorkSystem = workSystemMount ? mountDexstooreSystem(workSystemMount) : null;
const dexstooreIntro = createWorkSectionIntroController(workSection, mountedWorkSystem);

initAppScenes({ dexstooreIntro });
initWorkArchitectureInteraction(workSystemMount);
