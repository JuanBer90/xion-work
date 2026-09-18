export const CAPABILITY_TONES = [
  'red',
  'orange',
  'green',
  'cyan',
  'blue',
  'violet',
] as const;

export type CapabilityTone = (typeof CAPABILITY_TONES)[number];

export function isCapabilityTone(value: string): value is CapabilityTone {
  return (CAPABILITY_TONES as readonly string[]).includes(value);
}
