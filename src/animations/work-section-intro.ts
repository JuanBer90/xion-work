import { createTimeline, stagger, type Timeline } from 'animejs';

import type { MountedWorkArchitecture } from '@/scenes/work-architecture-integration';
import { prefersReducedMotion } from '@/utils/motion';

/** Scales timeline offsets so architecture intro starts sooner on scene enter. */
const WORK_INTRO_TIME_SCALE = 0.62;

const WORK_FADE_OUT_MS = 1060;

function introAt(ms: number): number {
  return Math.round(ms * WORK_INTRO_TIME_SCALE);
}

function preparePaths(paths: SVGPathElement[]): void {
  for (const path of paths) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  }
}

function revealWorkSection(section: HTMLElement): void {
  section.dataset.workState = 'complete';
  for (const path of section.querySelectorAll<SVGPathElement>('.work-path')) {
    path.style.strokeDashoffset = '0';
    if (path.classList.contains('work-path--link')) {
      path.style.opacity = '1';
    } else if (path.dataset.opacity) {
      path.style.opacity = path.dataset.opacity;
    }
  }
  for (const group of section.querySelectorAll<SVGGElement>('.work-node-group')) {
    group.style.opacity = '1';
    group.style.transform = '';
  }
  for (const label of section.querySelectorAll<SVGElement>('.work-label-group')) {
    label.style.opacity = '1';
  }
  for (const el of section.querySelectorAll<HTMLElement>('[data-work-reveal], .work-tech')) {
    el.style.opacity = '1';
    el.style.transform = '';
  }
  const ambient = section.querySelector<SVGGElement>('.work-system__ambient');
  if (ambient) ambient.style.opacity = '1';
  for (const dot of section.querySelectorAll<SVGCircleElement>('.work-link-dot')) {
    dot.style.opacity = dot.dataset.opacity ?? '0.2';
  }
}

/** Nodeweave drag uses the SVG `transform` attribute on `.work-node-group`; inline CSS `transform` from intro must be cleared or it overrides drag translation. */
function clearNodeGroupInlineTransforms(nodeGroups: readonly SVGGElement[]): void {
  for (const group of nodeGroups) {
    group.style.removeProperty('transform');
  }
}

function clearIntroInlineStyles(section: HTMLElement): void {
  section.style.opacity = '';
  for (const el of section.querySelectorAll<HTMLElement>('[data-work-reveal], .work-tech')) {
    el.style.opacity = '';
    el.style.transform = '';
  }
  for (const group of section.querySelectorAll<SVGGElement>('.work-node-group')) {
    group.style.opacity = '';
    group.style.transform = '';
  }
  for (const label of section.querySelectorAll<SVGElement>('.work-label-group')) {
    label.style.opacity = '';
  }
  for (const path of section.querySelectorAll<SVGPathElement>('.work-path')) {
    path.style.opacity = '';
    path.style.strokeDashoffset = '';
  }
  const ambient = section.querySelector<SVGGElement>('.work-system__ambient');
  if (ambient) ambient.style.opacity = '';
  for (const dot of section.querySelectorAll<SVGCircleElement>('.work-link-dot')) {
    dot.style.opacity = '';
  }
}

export type WorkSectionIntroController = {
  /** Starts the intro timeline from the beginning (call `reset()` first when re-entering). */
  play: () => void;
  /** Returns copy, architecture, and tech to the pre-intro loading state. */
  reset: () => void;
  /** Cancels any in-flight intro playback. */
  stop: () => void;
  /** Rebinds the controller after its responsive architecture SVG is rebuilt. */
  replaceSystem: (system: MountedWorkArchitecture) => void;
  /** Fades section out, then runs `onComplete` (typically `reset`). */
  fadeOut: (onComplete: () => void) => void;
  destroy: () => void;
};

export function createWorkSectionIntroController(
  section: HTMLElement | null,
  system: MountedWorkArchitecture | null,
): WorkSectionIntroController | null {
  if (!section || !system) return null;

  const copyTargets = [...section.querySelectorAll<HTMLElement>('[data-work-reveal]')];
  const techItems = [...section.querySelectorAll<HTMLElement>('.work-tech')];
  const reducedMotion = prefersReducedMotion();

  if (reducedMotion) {
    revealWorkSection(section);
    const noop = (): void => undefined;
    return {
      play: () => revealWorkSection(section),
      reset: noop,
      stop: noop,
      replaceSystem: () => revealWorkSection(section),
      fadeOut: (onComplete) => onComplete(),
      destroy: noop,
    };
  }

  let timeline: Timeline | null = null;
  let playFrame = 0;
  let mountedSystem = system;

  const stop = (): void => {
    window.cancelAnimationFrame(playFrame);
    playFrame = 0;
    if (!timeline) return;
    timeline.pause();
    timeline.revert();
    timeline = null;
  };

  const reset = (): void => {
    stop();
    section.dataset.workState = 'loading';
    clearIntroInlineStyles(section);
    preparePaths(mountedSystem.paths);
  };

  const buildTimeline = (): Timeline => {
    const nextTimeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic' },
      onComplete: () => {
        section.dataset.workState = 'complete';
        clearNodeGroupInlineTransforms(mountedSystem.nodeGroups);
        timeline = null;
      },
    });

    nextTimeline
      .add(
        copyTargets,
        {
          opacity: { to: 1 },
          translateY: { to: 0 },
          duration: 480,
          delay: stagger(55, { from: 'first' }),
        },
        introAt(0),
      )
      .add(
        mountedSystem.nodeGroups[0],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 440 },
        introAt(260),
      )
      .add(
        mountedSystem.paths[0],
        { strokeDashoffset: { to: 0 }, opacity: { to: 1 }, duration: 560 },
        introAt(450),
      )
      .add(
        mountedSystem.nodeGroups[1],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 420 },
        introAt(610),
      )
      .add(
        mountedSystem.paths[1],
        { strokeDashoffset: { to: 0 }, opacity: { to: 1 }, duration: 560 },
        introAt(730),
      )
      .add(
        mountedSystem.nodeGroups[2],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 440 },
        introAt(880),
      )
      .add(
        [mountedSystem.paths[2], mountedSystem.paths[3]],
        {
          strokeDashoffset: { to: 0 },
          opacity: { to: 1 },
          duration: 620,
          delay: stagger(75),
        },
        introAt(1040),
      )
      .add(
        [mountedSystem.nodeGroups[3], mountedSystem.nodeGroups[4]],
        {
          opacity: { to: 1 },
          scale: { to: 1 },
          duration: 420,
          delay: stagger(90),
        },
        introAt(1230),
      )
      .add(
        [mountedSystem.paths[4], mountedSystem.paths[5]],
        {
          strokeDashoffset: { to: 0 },
          opacity: { to: 1 },
          duration: 560,
          delay: stagger(70),
        },
        introAt(1440),
      )
      .add(
        [mountedSystem.nodeGroups[5], mountedSystem.nodeGroups[6]],
        {
          opacity: { to: 1 },
          scale: { to: 1 },
          duration: 400,
          delay: stagger(75),
        },
        introAt(1620),
      )
      .add(
        mountedSystem.ambientGroup,
        { opacity: { to: 1 }, duration: 460, ease: 'outQuad' },
        introAt(400),
      )
      .add(
        mountedSystem.linkDots,
        {
          opacity: {
            to: (target: unknown) => {
              if (!(target instanceof SVGElement)) return 0.3;
              return Number(target.dataset.opacity ?? '0.3');
            },
          },
          duration: 260,
          delay: stagger(16),
        },
        introAt(1410),
      )
      .add(
        techItems,
        { opacity: { to: 1 }, translateY: { to: 0 }, duration: 380, delay: stagger(40) },
        introAt(1810),
      );

    return nextTimeline;
  };

  const play = (): void => {
    stop();
    section.style.opacity = '';
    timeline = buildTimeline();
    playFrame = window.requestAnimationFrame(() => {
      playFrame = 0;
      timeline?.play();
    });
  };

  const fadeOut = (onComplete: () => void): void => {
    stop();
    if (section.dataset.workState === 'loading') {
      onComplete();
      return;
    }

    timeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'inCubic' },
      onComplete: () => {
        timeline = null;
        section.style.opacity = '';
        onComplete();
      },
    });
    timeline.add(section, { opacity: { to: 0 }, duration: WORK_FADE_OUT_MS }, 0);
    timeline.play();
  };

  reset();

  return {
    play,
    reset,
    stop,
    replaceSystem: (nextSystem) => {
      stop();
      mountedSystem = nextSystem;
      reset();
    },
    fadeOut,
    destroy: () => {
      stop();
    },
  };
}

/** @deprecated Use `createWorkSectionIntroController` with scene lifecycle instead. */
export function initWorkSectionIntro(
  section: HTMLElement | null,
  system: MountedWorkArchitecture | null,
): () => void {
  const controller = createWorkSectionIntroController(section, system);
  return () => controller?.destroy();
}
