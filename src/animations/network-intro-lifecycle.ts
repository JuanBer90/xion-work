import {
  POST_INTRO_ROTATION_DELAY_MS,
  type ResolvedNetworkIntroOptions,
  shouldScheduleNetworkRotation,
} from '../config/network-intro.ts';

export type PostIntroRotationHandle = {
  ambientDelay: ReturnType<typeof setTimeout> | 0;
  stopAmbientDepth: (() => void) | null;
};

export type PostIntroRotationDeps = {
  setFinalState: () => void;
  startNetworkDepth: () => () => void;
  setTimeout: typeof globalThis.setTimeout;
};

/** Runs intro completion effects and optionally schedules ambient network rotation. */
export function runPostIntroEffects(
  resolved: ResolvedNetworkIntroOptions,
  reducedMotion: boolean,
  deps: PostIntroRotationDeps,
): PostIntroRotationHandle {
  deps.setFinalState();

  if (!shouldScheduleNetworkRotation(resolved, reducedMotion)) {
    return { ambientDelay: 0, stopAmbientDepth: null };
  }

  let stopAmbientDepth: (() => void) | null = null;
  const ambientDelay = deps.setTimeout(() => {
    stopAmbientDepth = deps.startNetworkDepth();
  }, POST_INTRO_ROTATION_DELAY_MS);

  return { ambientDelay, stopAmbientDepth };
}
