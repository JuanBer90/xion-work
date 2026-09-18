import {
  capabilityToneFromListItem,
  setActiveCapabilityTone,
} from './capability-emphasis.ts';
import type { CapabilityTone } from './network-tones.ts';

function resolveTargets(): { network: HTMLElement; capabilities: HTMLElement } | null {
  const network = document.querySelector<HTMLElement>('[data-network]');
  const capabilities = document.querySelector<HTMLElement>('.capabilities');
  if (!network || !capabilities) return null;
  return { network, capabilities };
}

function isCapabilityItem(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const item = target.closest<HTMLElement>('li[data-capability-tone]');
  return item ?? null;
}

/** Wires capability list hover/focus to centralized network emphasis state. */
export function initCapabilityNetworkEmphasis(): () => void {
  const targets = resolveTargets();
  if (!targets) return () => undefined;

  const { capabilities } = targets;

  const items = [
    ...capabilities.querySelectorAll<HTMLElement>('li[data-capability-tone]'),
  ];

  let hoveredTone: CapabilityTone | null = null;
  let focusedTone: CapabilityTone | null = null;

  const sync = (): void => {
    setActiveCapabilityTone(hoveredTone ?? focusedTone, targets);
  };

  const cleanups: (() => void)[] = [];

  for (const item of items) {
    const tone = capabilityToneFromListItem(item);
    if (!tone) continue;

    const onPointerEnter = (): void => {
      hoveredTone = tone;
      sync();
    };

    const onPointerLeave = (event: PointerEvent): void => {
      if (isCapabilityItem(event.relatedTarget)) return;
      hoveredTone = null;
      sync();
    };

    const onFocus = (): void => {
      focusedTone = tone;
      sync();
    };

    const onBlur = (event: FocusEvent): void => {
      if (isCapabilityItem(event.relatedTarget)) return;
      focusedTone = null;
      sync();
    };

    item.addEventListener('pointerenter', onPointerEnter);
    item.addEventListener('pointerleave', onPointerLeave);
    item.addEventListener('focus', onFocus);
    item.addEventListener('blur', onBlur);

    cleanups.push(() => {
      item.removeEventListener('pointerenter', onPointerEnter);
      item.removeEventListener('pointerleave', onPointerLeave);
      item.removeEventListener('focus', onFocus);
      item.removeEventListener('blur', onBlur);
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
    hoveredTone = null;
    focusedTone = null;
    setActiveCapabilityTone(null, targets);
  };
}
