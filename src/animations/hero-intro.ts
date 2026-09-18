import { createTimeline, stagger } from 'animejs';

function setFinalState(): void {
  document.body.dataset.intro = 'complete';
  for (const item of document.querySelectorAll<HTMLElement>('.capabilities li')) {
    item.style.removeProperty('transform');
  }
}

export type HeroIntroController = {
  destroy: () => void;
};

/** Preserves the hero interface reveal independently from its visualization renderer. */
export function initHeroIntro(): HeroIntroController | null {
  if (!document.querySelector<HTMLElement>('.hero')) return null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) {
    setFinalState();
    return { destroy: () => undefined };
  }

  document.body.dataset.intro = 'loading';
  const timeline = createTimeline({
    autoplay: false,
    defaults: { ease: 'outCubic' },
    onComplete: setFinalState,
  });

  timeline
    .add(
      '[data-reveal="brand"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 560 },
      1100,
    )
    .add(
      '[data-reveal="headline"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 670, delay: stagger(170) },
      1480,
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
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 460, delay: stagger(210) },
      1480,
    )
    .add(
      '[data-reveal="cta"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520 },
      3350,
    )
    .add(
      '[data-reveal="scroll"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520 },
      3970,
    );

  timeline.stretch(4_600);
  let playFrame = window.requestAnimationFrame(() => timeline.play());
  const onReducedMotionChange = (): void => {
    if (!reducedMotion.matches) return;
    window.cancelAnimationFrame(playFrame);
    playFrame = 0;
    timeline.pause();
    setFinalState();
  };
  reducedMotion.addEventListener('change', onReducedMotionChange);

  return {
    destroy: () => {
      window.cancelAnimationFrame(playFrame);
      reducedMotion.removeEventListener('change', onReducedMotionChange);
      timeline.pause();
      timeline.revert();
    },
  };
}
