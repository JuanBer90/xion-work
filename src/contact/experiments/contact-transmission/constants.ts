/** Deterministic simulation timings (ms). */
export const TRANSMISSION_TIMING = {
  validating: 700,
  securing: 700,
  arcTravel: 1800,
  exit: 600,
  deliveredDelay: 120,
} as const;

export const TRANSMISSION_TRAIL_LENGTH = 22;

export const TRANSMISSION_FAILURE_TIMING = {
  pauseMs: 175,
  fadeMs: 300,
} as const;
