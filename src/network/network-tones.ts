export const NETWORK_TONES = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'violet',
] as const;

export type NetworkTone = (typeof NETWORK_TONES)[number];

/** Capability list items map 1:1 to these tones (yellow exists only in the sphere). */
export const CAPABILITY_TONES = [
  'red',
  'orange',
  'green',
  'cyan',
  'blue',
  'violet',
] as const;

export type CapabilityTone = (typeof CAPABILITY_TONES)[number];

export const INACTIVE_TONE_EMPHASIS = 0.1;

const TONE_CLASS_PREFIX = 'tone-';

export function isCapabilityTone(value: string): value is CapabilityTone {
  return (CAPABILITY_TONES as readonly string[]).includes(value);
}

export function networkToneFromElement(element: Element): NetworkTone | null {
  for (const name of element.classList) {
    if (!name.startsWith(TONE_CLASS_PREFIX)) continue;
    const tone = name.slice(TONE_CLASS_PREFIX.length);
    if ((NETWORK_TONES as readonly string[]).includes(tone)) {
      return tone as NetworkTone;
    }
  }
  return null;
}

export function toneEmphasisMultiplier(
  tone: NetworkTone | null,
  activeCapability: CapabilityTone | null,
): number {
  if (!activeCapability || !tone) return 1;
  if (tone === activeCapability) return 1;
  return INACTIVE_TONE_EMPHASIS;
}
