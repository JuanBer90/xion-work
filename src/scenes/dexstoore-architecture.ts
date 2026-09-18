import { resolveArchitectureNodes } from '@/work-architecture/resolve-nodes.ts';
import {
  mountResponsiveWorkArchitecture,
  mountWorkArchitecture,
  type ResponsiveWorkArchitecture,
} from '@/work-architecture/mount-work-architecture.ts';
import type { MountedWorkArchitecture } from '@/work-architecture/types.ts';
import type { ArchitectureTone, ResolvedArchitectureNode } from '@/work-architecture/types.ts';

import {
  DEXSTOORE_ARCHITECTURE,
  type DexstooreNodeId,
} from './dexstoore-architecture-config.ts';

export type WorkNodeId = DexstooreNodeId;
export type WorkTone = ArchitectureTone;

export type WorkNode = ResolvedArchitectureNode<DexstooreNodeId>;

export type WorkConnection = (typeof DEXSTOORE_ARCHITECTURE.connections)[number];

export const DEXSTOORE_NODES: readonly WorkNode[] = resolveArchitectureNodes(
  DEXSTOORE_ARCHITECTURE,
  false,
);

export const DEXSTOORE_CONNECTIONS = DEXSTOORE_ARCHITECTURE.connections;

export type MountedDexstooreSystem = MountedWorkArchitecture;

export const MOBILE_AMBIENT_HUBS = DEXSTOORE_ARCHITECTURE.ambient.mobileHubs;

export function mountDexstooreSystem(container: HTMLElement): MountedDexstooreSystem {
  return mountWorkArchitecture(container, DEXSTOORE_ARCHITECTURE);
}

export function mountResponsiveDexstooreSystem(
  container: HTMLElement,
): ResponsiveWorkArchitecture {
  return mountResponsiveWorkArchitecture(container, DEXSTOORE_ARCHITECTURE);
}
