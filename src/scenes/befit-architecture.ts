import {
  mountResponsiveWorkArchitecture,
  type ResponsiveWorkArchitecture,
  type MountedWorkArchitecture,
} from './work-architecture-integration.ts';

import { BEFIT_ARCHITECTURE } from './befit-architecture-config.ts';

export type MountedBefitSystem = MountedWorkArchitecture;

export function mountResponsiveBefitSystem(
  container: HTMLElement,
): ResponsiveWorkArchitecture {
  return mountResponsiveWorkArchitecture(container, BEFIT_ARCHITECTURE);
}
