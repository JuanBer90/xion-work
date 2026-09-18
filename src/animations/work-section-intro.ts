import { createTimeline, stagger, type Timeline } from 'animejs';

import type { MountedDexstooreSystem } from '@/scenes/dexstoore-architecture';
import { prefersReducedMotion } from '@/utils/motion';

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

function clearIntroInlineStyles(section: HTMLElement): void {
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
  destroy: () => void;
};

export function createWorkSectionIntroController(
  section: HTMLElement | null,
  system: MountedDexstooreSystem | null,
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
      destroy: noop,
    };
  }

  let timeline: Timeline | null = null;
  let playFrame = 0;

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
    preparePaths(system.paths);
  };

  const buildTimeline = (): Timeline => {
    const nextTimeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic' },
      onComplete: () => {
        section.dataset.workState = 'complete';
        timeline = null;
      },
    });

    nextTimeline
      .add(
        copyTargets,
        {
          opacity: { to: 1 },
          translateY: { to: 0 },
          duration: 520,
          delay: stagger(90, { from: 'first' }),
        },
        0,
      )
      .add(
        system.nodeGroups[0],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 480 },
        420,
      )
      .add(
        system.paths[0],
        { strokeDashoffset: { to: 0 }, opacity: { to: 1 }, duration: 620 },
        720,
      )
      .add(
        system.nodeGroups[1],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 460 },
        980,
      )
      .add(
        system.paths[1],
        { strokeDashoffset: { to: 0 }, opacity: { to: 1 }, duration: 620 },
        1180,
      )
      .add(
        system.nodeGroups[2],
        { opacity: { to: 1 }, scale: { to: 1 }, duration: 480 },
        1420,
      )
      .add(
        [system.paths[2], system.paths[3]],
        {
          strokeDashoffset: { to: 0 },
          opacity: { to: 1 },
          duration: 680,
          delay: stagger(120),
        },
        1680,
      )
      .add(
        [system.nodeGroups[3], system.nodeGroups[4]],
        {
          opacity: { to: 1 },
          scale: { to: 1 },
          duration: 460,
          delay: stagger(140),
        },
        1980,
      )
      .add(
        [system.paths[4], system.paths[5]],
        {
          strokeDashoffset: { to: 0 },
          opacity: { to: 1 },
          duration: 620,
          delay: stagger(110),
        },
        2320,
      )
      .add(
        [system.nodeGroups[5], system.nodeGroups[6]],
        {
          opacity: { to: 1 },
          scale: { to: 1 },
          duration: 440,
          delay: stagger(120),
        },
        2620,
      )
      .add(
        system.ambientGroup,
        { opacity: { to: 1 }, duration: 520, ease: 'outQuad' },
        640,
      )
      .add(
        system.linkDots,
        {
          opacity: {
            to: (target: unknown) => {
              if (!(target instanceof SVGElement)) return 0.3;
              return Number(target.dataset.opacity ?? '0.3');
            },
          },
          duration: 280,
          delay: stagger(24),
        },
        2280,
      )
      .add(
        techItems,
        { opacity: { to: 1 }, translateY: { to: 0 }, duration: 420, delay: stagger(60) },
        2920,
      );

    return nextTimeline;
  };

  const play = (): void => {
    stop();
    timeline = buildTimeline();
    playFrame = window.requestAnimationFrame(() => {
      playFrame = 0;
      timeline?.play();
    });
  };

  reset();

  return {
    play,
    reset,
    stop,
    destroy: () => {
      stop();
    },
  };
}

/** @deprecated Use `createWorkSectionIntroController` with scene lifecycle instead. */
export function initWorkSectionIntro(
  section: HTMLElement | null,
  system: MountedDexstooreSystem | null,
): () => void {
  const controller = createWorkSectionIntroController(section, system);
  return () => controller?.destroy();
}
