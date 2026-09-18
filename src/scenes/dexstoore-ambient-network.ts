/** @deprecated Import from `@/work-architecture/ambient-network` instead. */
export {
  AMBIENT_PARTICLE_BUDGET,
  ambientParticleCountForViewport,
  generateAmbientConnections,
  generateAmbientParticles,
  mountAmbientNetworkLayer,
  type AmbientExclusionNode,
} from '@/work-architecture/ambient-network.ts';

import { DEXSTOORE_ARCHITECTURE } from './dexstoore-architecture-config.ts';

export const MOBILE_AMBIENT_HUBS = DEXSTOORE_ARCHITECTURE.ambient.mobileHubs;
