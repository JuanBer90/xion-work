import { createTimeline, stagger, type Timeline } from 'animejs';

import {
  runPostIntroEffects,
  type PostIntroRotationHandle,
} from '@/animations/network-intro-lifecycle';
import { startNetworkDepth } from '@/animations/network-depth';
import {
  resolveNetworkIntroOptions,
  type NetworkIntroOptions,
} from '@/config/network-intro';
import { mountSphericalDensity } from '@/scenes/spherical-density';

function setPathLengths(paths: SVGPathElement[]): void {
  for (const path of paths) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  }
}

function densityOpacity(target: unknown): number {
  return target instanceof SVGElement ? Number(target.dataset.opacity ?? '0.2') : 0.2;
}

function setFinalState(): void {
  document.body.dataset.intro = 'complete';
  for (const path of document.querySelectorAll<SVGPathElement>('.network-path, .spherical-local-path')) {
    path.style.strokeDashoffset = '0';
  }
}

/** Builds the network and interface into their reference-matched resting state. */
export function initNetworkIntro(options: NetworkIntroOptions = {}): Timeline | null {
  const resolved = resolveNetworkIntroOptions(options);
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return null;

  const paths = [...document.querySelectorAll<SVGPathElement>('.network-path')];
  const nodes = [...document.querySelectorAll<SVGCircleElement>('.network-node')];
  const fragments = [...document.querySelectorAll<SVGPathElement>('.network-fragment')];
  const density = mountSphericalDensity();
  const microDots = density.microDots;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let postIntro: PostIntroRotationHandle = { ambientDelay: 0, stopAmbientDepth: null };

  setPathLengths([...paths, ...density.localPaths]);
  if (reducedMotion.matches) {
    setFinalState();
    return null;
  }

  document.body.dataset.intro = 'loading';
  const timeline = createTimeline({
    autoplay: false,
    defaults: { ease: 'outCubic' },
    onComplete: () => {
      postIntro = runPostIntroEffects(resolved, reducedMotion.matches, {
        setFinalState,
        startNetworkDepth,
        setTimeout: window.setTimeout.bind(window),
      });
    },
  });

  timeline
    .add(
      nodes,
      {
        opacity: { to: 1 },
        scale: { to: 1 },
        duration: 560,
        delay: stagger(72, { from: 'first' }),
      },
      180,
    )
    .add(
      paths,
      {
        strokeDashoffset: { to: 0 },
        opacity: { to: 1 },
        duration: 980,
        delay: stagger(68, { from: 'first' }),
      },
      430,
    )
    .add(
      fragments,
      {
        opacity: { to: 1 },
        scale: { to: 1 },
        duration: 460,
        delay: stagger(110),
      },
      920,
    )
    .add(
      density.smallNodes,
      {
        opacity: { to: densityOpacity },
        scale: { to: 1 },
        duration: 500,
        delay: stagger(9, { grid: true, from: 'center', jitter: 45, seed: 71 }),
      },
      520,
    )
    .add(
      density.localPaths,
      {
        strokeDashoffset: { to: 0 },
        opacity: { to: densityOpacity },
        duration: 420,
        delay: stagger(14, { grid: true, from: 'center', jitter: 38, seed: 17 }),
      },
      900,
    )
    .add(
      '[data-reveal="brand"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 560 },
      1100,
    )
    .add(
      '[data-reveal="headline"]',
      {
        opacity: { to: 1 },
        translateY: { to: 0 },
        duration: 670,
        delay: stagger(170),
      },
      1480,
    )
    .add(
      '[data-network-label="ideas"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 400 },
      1080,
    )
    .add(
      '[data-network-label="build"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 400 },
      1490,
    )
    .add(
      '[data-network-label="scale"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 400 },
      1780,
    )
    .add(
      '[data-network-label="integrative"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 400 },
      2070,
    )
    .add(
      '[data-reveal="subhead"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 560 },
      2360,
    )
    .add(
      '[data-reveal="navigation"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520, delay: stagger(80) },
      2580,
    )
    .add(
      '.capabilities li',
      {
        opacity: { to: 1 },
        translateY: { to: 0 },
        duration: 460,
        delay: stagger(210, { from: 'first' }),
      },
      1480,
    )
    .add(
      '[data-reveal="cta"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520 },
      3350,
    )
    .add(
      microDots,
      {
        opacity: { to: densityOpacity },
        scale: { to: 1 },
        duration: 280,
        delay: stagger(10, {
          grid: true,
          from: 'center',
          ease: 'outQuad',
          jitter: 55,
          seed: 29,
        }),
      },
      1480,
    )
    .add(
      '[data-reveal="scroll"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520 },
      3970,
    );

  timeline.stretch(4_600);
  window.requestAnimationFrame(() => timeline.play());
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    timeline.pause();
    window.clearTimeout(postIntro.ambientDelay);
    postIntro.stopAmbientDepth?.();
    setFinalState();
  });

  return timeline;
}
