import {
  mountResponsiveWorkArchitecture,
  type ResponsiveWorkArchitecture,
  type MountedWorkArchitecture,
} from './work-architecture-integration.ts';

import {
  DEXSTOORE_ARCHITECTURE,
  type DexstooreNodeId,
} from './dexstoore-architecture-config.ts';

export type WorkNodeId = DexstooreNodeId;
export type MountedDexstooreSystem = MountedWorkArchitecture;

export function mountResponsiveDexstooreSystem(
  container: HTMLElement,
): ResponsiveWorkArchitecture {
  return mountResponsiveWorkArchitecture(container, DEXSTOORE_ARCHITECTURE);
}
