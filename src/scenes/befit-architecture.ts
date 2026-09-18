import {
  mountResponsiveWorkArchitecture,
  mountWorkArchitecture,
  type ResponsiveWorkArchitecture,
} from '@/work-architecture/mount-work-architecture.ts';
import type { MountedWorkArchitecture } from '@/work-architecture/types.ts';

import { BEFIT_ARCHITECTURE } from './befit-architecture-config.ts';

export type MountedBefitSystem = MountedWorkArchitecture;

export function mountBefitSystem(container: HTMLElement): MountedBefitSystem {
  return mountWorkArchitecture(container, BEFIT_ARCHITECTURE);
}

export function mountResponsiveBefitSystem(
  container: HTMLElement,
): ResponsiveWorkArchitecture {
  return mountResponsiveWorkArchitecture(container, BEFIT_ARCHITECTURE);
}
