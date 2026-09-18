import {
  type CapabilityTone,
  isCapabilityTone,
} from './capability-tones.ts';

export type { CapabilityTone } from './capability-tones.ts';

let activeCapability: CapabilityTone | null = null;

export function capabilityToneFromListItem(item: Element): CapabilityTone | null {
  const tone = item.getAttribute('data-capability-tone');
  if (!tone || !isCapabilityTone(tone)) return null;
  return tone;
}

const CAPABILITY_INACTIVE_OPACITY = 0.35;

function readBaseOpacity(item: HTMLElement): number {
  const cached = item.dataset.emphasisBaseOpacity;
  if (cached) return Number(cached);
  const parsed = Number.parseFloat(getComputedStyle(item).opacity);
  const opacity = Number.isFinite(parsed) ? parsed : 1;
  item.dataset.emphasisBaseOpacity = String(opacity);
  return opacity;
}

function applyCapabilityVisuals(capabilities: HTMLElement): void {
  for (const item of capabilities.querySelectorAll<HTMLElement>('li[data-capability-tone]')) {
    const tone = capabilityToneFromListItem(item);
    const opacity = readBaseOpacity(item);
    item.style.opacity = String(
      activeCapability && tone !== activeCapability ? opacity * CAPABILITY_INACTIVE_OPACITY : opacity,
    );
  }
}

function applyDataset(capabilities: HTMLElement): void {
  if (activeCapability) {
    capabilities.dataset.emphasisTone = activeCapability;
    return;
  }
  delete capabilities.dataset.emphasisTone;
}

export function setActiveCapabilityTone(
  tone: CapabilityTone | null,
  capabilities: HTMLElement,
): void {
  if (activeCapability === tone) return;
  activeCapability = tone;
  applyDataset(capabilities);
  applyCapabilityVisuals(capabilities);
}
