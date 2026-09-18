import { applyNetworkEmphasisVisuals } from './apply-network-emphasis.ts';
import {
  type CapabilityTone,
  type NetworkTone,
  isCapabilityTone,
  toneEmphasisMultiplier,
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

export function getNetworkToneEmphasisMultiplier(tone: NetworkTone | null): number {
  return toneEmphasisMultiplier(tone, activeCapability);
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

function applyDataset(network: HTMLElement, capabilities: HTMLElement): void {
  if (activeCapability) {
    network.dataset.emphasisTone = activeCapability;
    capabilities.dataset.emphasisTone = activeCapability;
    return;
  }
  delete network.dataset.emphasisTone;
  delete capabilities.dataset.emphasisTone;
}

export function setActiveCapabilityTone(
  tone: CapabilityTone | null,
  targets: { network: HTMLElement; capabilities: HTMLElement },
): void {
  if (activeCapability === tone) return;
  activeCapability = tone;
  applyDataset(targets.network, targets.capabilities);
  applyNetworkEmphasisVisuals(targets, tone);
  publish();
}

export function subscribeCapabilityEmphasis(
  listener: (state: CapabilityEmphasisState) => void,
): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

export { networkToneFromElement } from './network-tones.ts';
