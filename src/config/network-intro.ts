export const DEFAULT_NETWORK_INTRO_OPTIONS = {
  rotation: {
    enabled: true,
  },
} as const;

export type NetworkIntroOptions = {
  rotation?: {
    enabled?: boolean;
  };
};

export type ResolvedNetworkIntroOptions = {
  rotation: {
    enabled: boolean;
  };
};

export const POST_INTRO_ROTATION_DELAY_MS = 650;

export function resolveNetworkIntroOptions(
  options: NetworkIntroOptions = {},
): ResolvedNetworkIntroOptions {
  return {
    rotation: {
      enabled: options.rotation?.enabled ?? DEFAULT_NETWORK_INTRO_OPTIONS.rotation.enabled,
    },
  };
}

export function shouldScheduleNetworkRotation(
  resolved: ResolvedNetworkIntroOptions,
  reducedMotion: boolean,
): boolean {
  return !reducedMotion && resolved.rotation.enabled;
}
