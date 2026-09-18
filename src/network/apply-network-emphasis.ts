import {
  getActiveCapabilityTone,
  type CapabilityTone,
} from './capability-emphasis.ts';
import {
  networkToneFromElement,
  toneEmphasisMultiplier,
  type NetworkTone,
} from './network-tones.ts';

const NETWORK_TONE_SELECTOR =
  '.network-path, .network-node, .network-fragment, .network-label, .spherical-small-node, .network-micro-dot, .spherical-local-path';

const CAPABILITY_INACTIVE_OPACITY = 0.35;

function emphasisOpacityTarget(element: Element): HTMLElement | SVGElement | null {
  if (element instanceof SVGElement) return element;
  if (element instanceof HTMLElement) return element;
  return null;
}

function readBaseOpacity(element: HTMLElement | SVGElement): number {
  const cached = element.dataset.emphasisBaseOpacity;
  if (cached) return Number(cached);
  const base = Number.parseFloat(getComputedStyle(element).opacity);
  const resolved = Number.isFinite(base) ? base : 1;
  element.dataset.emphasisBaseOpacity = String(resolved);
  return resolved;
}

function cacheNetworkBaseOpacities(network: HTMLElement): void {
  for (const element of network.querySelectorAll(NETWORK_TONE_SELECTOR)) {
    const target = emphasisOpacityTarget(element);
    if (!target || !networkToneFromElement(target)) continue;
    readBaseOpacity(target);
  }
}

function applyNetworkElementOpacity(
  element: HTMLElement | SVGElement,
  tone: NetworkTone,
  active: CapabilityTone | null,
): void {
  const base = readBaseOpacity(element);
  const multiplier = toneEmphasisMultiplier(tone, active);
  element.style.opacity = String(base * multiplier);
}

function applyCapabilityListOpacity(capabilities: HTMLElement, active: CapabilityTone | null): void {
  for (const item of capabilities.querySelectorAll<HTMLElement>('li[data-capability-tone]')) {
    const tone = item.dataset.capabilityTone as CapabilityTone;
    const base = readBaseOpacity(item);
    if (!active) {
      item.style.opacity = String(base);
      continue;
    }
    item.style.opacity = tone === active ? String(base) : String(base * CAPABILITY_INACTIVE_OPACITY);
  }
}

/** Applies finalOpacity = baseOpacity * emphasisMultiplier (inline, single source of truth). */
export function applyNetworkEmphasisVisuals(
  targets: { network: HTMLElement; capabilities: HTMLElement },
  active: CapabilityTone | null = getActiveCapabilityTone(),
): void {
  if (active) cacheNetworkBaseOpacities(targets.network);

  for (const element of targets.network.querySelectorAll(NETWORK_TONE_SELECTOR)) {
    const target = emphasisOpacityTarget(element);
    if (!target) continue;
    const tone = networkToneFromElement(target);
    if (!tone) continue;
    applyNetworkElementOpacity(target, tone, active);
  }

  applyCapabilityListOpacity(targets.capabilities, active);
}

export function clearNetworkEmphasisInlineStyles(targets: {
  network: HTMLElement;
  capabilities: HTMLElement;
}): void {
  for (const element of targets.network.querySelectorAll(NETWORK_TONE_SELECTOR)) {
    const target = emphasisOpacityTarget(element);
    target?.style.removeProperty('opacity');
    target?.removeAttribute('data-emphasis-base-opacity');
  }
  for (const item of targets.capabilities.querySelectorAll<HTMLElement>('li[data-capability-tone]')) {
    item.style.removeProperty('opacity');
    item.removeAttribute('data-emphasis-base-opacity');
  }
}
