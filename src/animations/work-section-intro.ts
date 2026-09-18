import { createTimeline, stagger } from 'animejs';

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
  for (const dot of section.querySelectorAll<SVGCircleElement>('.work-micro, .work-link-dot')) {
    dot.style.opacity = dot.dataset.opacity ?? '0.2';
  }
}

export function initWorkSectionIntro(
  section: HTMLElement | null,
  system: MountedDexstooreSystem | null,
): () => void {
  if (!section || !system) return () => undefined;

  const copyTargets = [
    ...section.querySelectorAll<HTMLElement>('[data-work-reveal]'),
  ];
  const techItems = [...section.querySelectorAll<HTMLElement>('.work-tech')];

  if (prefersReducedMotion()) {
    revealWorkSection(section);
    return () => undefined;
  }

  section.dataset.workState = 'loading';
  preparePaths(system.paths);

  let played = false;
  let observer: IntersectionObserver | null = null;

  const play = (): void => {
    if (played) return;
    played = true;
    observer?.disconnect();

    const timeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic' },
      onComplete: () => {
        section.dataset.workState = 'complete';
      },
    });

    timeline
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
        [...system.ambientPaths, ...system.ambientDots, ...system.linkDots],
        {
          opacity: {
            to: (target: unknown) => {
              if (!(target instanceof SVGElement)) return 0.08;
              return Number(target.dataset.opacity ?? '0.08');
            },
          },
          duration: 520,
          delay: stagger(12, { from: 'random' }),
        },
        2880,
      )
      .add(
        techItems,
        { opacity: { to: 1 }, translateY: { to: 0 }, duration: 420, delay: stagger(60) },
        3060,
      );

    window.requestAnimationFrame(() => timeline.play());
  };

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.22)) {
        play();
      }
    },
    { threshold: [0, 0.22, 0.4] },
  );

  observer.observe(section);

  return () => {
    observer?.disconnect();
  };
}
