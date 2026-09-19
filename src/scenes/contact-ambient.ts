import { Nodeweave, type NodeweaveInstance } from 'nodeweave';

import { DEXSTOORE_ARCHITECTURE } from '@/scenes/dexstoore-architecture-config';
import { NODeweave_AMBIENT_COLORS } from '@/scenes/work-architecture-integration';
/** Same logical canvas as Work scenes (Nodeweave hub offsets are tuned for this space). */
const CONTACT_AMBIENT_VIEW = {
  desktop: { width: 960, height: 720 },
  mobile: { width: 420, height: 720 },
} as const;

/** Sparse constellation anchors (center / center-left). Lower bias = tighter local groups with space between hubs. */
const CONTACT_AMBIENT_HUBS_DESKTOP = [
  { x: 295, y: 285, bias: 0.52 },
  { x: 365, y: 355, bias: 0.48 },
  { x: 255, y: 395, bias: 0.55 },
  { x: 335, y: 455, bias: 0.5 },
  { x: 390, y: 270, bias: 0.46 },
] as const;

const CONTACT_AMBIENT_HUBS_MOBILE = [
  { x: 155, y: 210, bias: 0.5 },
  { x: 195, y: 290, bias: 0.48 },
  { x: 125, y: 265, bias: 0.52 },
] as const;

function buildContactAmbientOptions(mobile: boolean) {
  return {
    enabled: true as const,
    seed: 41824,
    count: mobile ? 95 : 185,
    colors: [...NODeweave_AMBIENT_COLORS],
    hubs: mobile ? [...CONTACT_AMBIENT_HUBS_MOBILE] : [...CONTACT_AMBIENT_HUBS_DESKTOP],
    /** Short reach → only nearby dots link (small 2–5 node groups), not a mesh. */
    reach: mobile ? 21 : 23,
    movement: true as const,
    speed: 0.00065,
    opacity: 1.55,
    connectionOpacity: 0.065,
    size: 0.92,
  };
}

export type ContactAmbientController = {
  enter: () => void;
  leave: () => void;
  destroy: () => void;
};

function mountAmbientInstance(mount: HTMLElement): NodeweaveInstance {
  const mobile = window.matchMedia(DEXSTOORE_ARCHITECTURE.mobileBreakpoint).matches;
  const view = mobile ? CONTACT_AMBIENT_VIEW.mobile : CONTACT_AMBIENT_VIEW.desktop;

  const instance = new Nodeweave(mount, {
    width: view.width,
    height: view.height,
    className: 'work-system__svg contact-section__ambient-svg',
    nodes: [],
    connections: [],
    animation: { enabled: false, respectReducedMotion: true },
    ambient: buildContactAmbientOptions(mobile),
    interaction: { drag: { enabled: false } },
  });

  instance.element.querySelector('.nw-ambient')?.classList.add('work-system__ambient');
  return instance;
}

/**
 * Contact background: Nodeweave ambient layer only (same engine/options as Dexstoore/Befit Work scenes).
 */
const noopAmbient: ContactAmbientController = {
  enter: () => undefined,
  leave: () => undefined,
  destroy: () => undefined,
};

export function mountContactAmbient(section: HTMLElement | null): ContactAmbientController {
  if (!section) {
    return noopAmbient;
  }

  const mediaQuery = window.matchMedia(DEXSTOORE_ARCHITECTURE.mobileBreakpoint);
  let mount: HTMLDivElement | null = null;
  let instance: NodeweaveInstance | null = null;

  const teardown = (): void => {
    instance?.destroy();
    instance = null;
    mount?.remove();
    mount = null;
  };

  const ensureMounted = (): void => {
    if (mediaQuery.matches) {
      teardown();
      return;
    }
    if (!mount) {
      mount = document.createElement('div');
      mount.className = 'contact-section__ambient';
      mount.setAttribute('aria-hidden', 'true');
      section.prepend(mount);
    }
    if (!instance) {
      instance = mountAmbientInstance(mount);
    }
  };

  ensureMounted();

  const onBreakpointChange = (): void => {
    if (mediaQuery.matches) {
      teardown();
      return;
    }
    ensureMounted();
  };

  mediaQuery.addEventListener('change', onBreakpointChange);

  return {
    enter: () => {
      if (mediaQuery.matches) return;
      instance?.replay();
    },
    leave: () => {
      // Nodeweave pauses its RAF loop when the SVG leaves the viewport (IntersectionObserver).
    },
    destroy: () => {
      mediaQuery.removeEventListener('change', onBreakpointChange);
      teardown();
    },
  };
}
