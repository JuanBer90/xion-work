import {
  type CapabilityTone,
  isCapabilityTone,
} from './network-tones.ts';

export type { CapabilityTone } from './network-tones.ts';

export type CapabilityEmphasisState = {
  activeCapability: CapabilityTone | null;
};

let activeCapability: CapabilityTone | null = null;
const stateListeners = new Set<(state: CapabilityEmphasisState) => void>();

export function getCapabilityEmphasisState(): CapabilityEmphasisState {
  return { activeCapability };
}

export function getActiveCapabilityTone(): CapabilityTone | null {
  return activeCapability;
}

export function capabilityToneFromListItem(item: Element): CapabilityTone | null {
  const tone = item.getAttribute('data-capability-tone');
  if (!tone || !isCapabilityTone(tone)) return null;
  return tone;
}

function publish(): void {
  const state = getCapabilityEmphasisState();
  for (const listener of stateListeners) listener(state);
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
  publish();
}

export function subscribeCapabilityEmphasis(
  listener: (state: CapabilityEmphasisState) => void,
): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}
