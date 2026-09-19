import { createTimeline, stagger, type Timeline } from 'animejs';

import { prefersReducedMotion } from '@/utils/motion';
import { isContactMobileViewport } from '@/utils/viewport';

const CONTACT_FADE_OUT_MS = 1060;

type ContactAmbientElements = {
  group: SVGGElement;
  dots: SVGCircleElement[];
  paths: SVGPathElement[];
};

function preparePaths(paths: SVGPathElement[]): void {
  for (const path of paths) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  }
}

function queryContactAmbient(section: HTMLElement): ContactAmbientElements | null {
  const group = section.querySelector<SVGGElement>('.contact-section__ambient .nw-ambient');
  if (!group) return null;

  return {
    group,
    dots: [...group.querySelectorAll<SVGCircleElement>('.nw-ambient__dot')],
    paths: [...group.querySelectorAll<SVGPathElement>('.nw-ambient__connection')],
  };
}

function isContactOrbitReveal(el: HTMLElement): boolean {
  return Boolean(el.closest('.contact-section__orbit'));
}

function revealDecorations(section: HTMLElement): void {
  for (const path of section.querySelectorAll<SVGPathElement>('.contact-section__orbit-arc, .contact-section__orbit-spark')) {
    path.style.strokeDashoffset = '0';
    path.style.opacity = '';
  }

  const ambient = queryContactAmbient(section);
  if (ambient) {
    ambient.group.style.opacity = '1';
    for (const dot of ambient.dots) dot.style.opacity = '';
    for (const path of ambient.paths) path.style.opacity = '';
  }
}

function revealContactSection(section: HTMLElement, options: { skipDecorations?: boolean } = {}): void {
  section.dataset.contactState = 'complete';

  if (!options.skipDecorations) {
    revealDecorations(section);
  }

  for (const el of section.querySelectorAll<HTMLElement>('[data-contact-reveal]')) {
    if (options.skipDecorations && isContactOrbitReveal(el)) continue;
    el.style.opacity = '1';
    el.style.transform = '';
  }
}

function clearIntroInlineStyles(section: HTMLElement): void {
  section.style.opacity = '';

  for (const path of section.querySelectorAll<SVGPathElement>('.contact-section__orbit-arc, .contact-section__orbit-spark')) {
    path.style.opacity = '';
    path.style.strokeDashoffset = '';
    path.style.strokeDasharray = '';
  }

  const ambient = queryContactAmbient(section);
  if (ambient) {
    ambient.group.style.opacity = '';
    for (const dot of ambient.dots) dot.style.opacity = '';
    for (const path of ambient.paths) path.style.opacity = '';
  }

  for (const el of section.querySelectorAll<HTMLElement>('[data-contact-reveal]')) {
    el.style.opacity = '';
    el.style.transform = '';
  }
}

export type ContactSectionIntroOptions = {
  /** Fired near the end of the cyan arc draw — reveal idle rocket at path start. */
  onRocketIdleReveal?: () => void;
};

export type ContactSectionIntroController = {
  play: () => void;
  reset: () => void;
  stop: () => void;
  fadeOut: (onComplete: () => void) => void;
  destroy: () => void;
};

export function createContactSectionIntroController(
  section: HTMLElement | null,
  options: ContactSectionIntroOptions = {},
): ContactSectionIntroController | null {
  if (!section) return null;

  const copyTargets = [...section.querySelectorAll<HTMLElement>('[data-contact-reveal]')];
  const orbitArc = section.querySelector<SVGPathElement>('.contact-section__orbit-arc');
  const orbitSparks = [...section.querySelectorAll<SVGPathElement>('.contact-section__orbit-spark')];
  const reducedMotion = prefersReducedMotion();
  const mobileSimplified = isContactMobileViewport();
  const skipDecorations = mobileSimplified;
  const revealTargets = skipDecorations
    ? copyTargets.filter((el) => !isContactOrbitReveal(el))
    : copyTargets;

  if (reducedMotion) {
    revealContactSection(section, { skipDecorations });
    if (!skipDecorations) {
      options.onRocketIdleReveal?.();
    }
    const noop = (): void => undefined;
    return {
      play: () => {
        revealContactSection(section, { skipDecorations });
        if (!skipDecorations) {
          options.onRocketIdleReveal?.();
        }
      },
      reset: noop,
      stop: noop,
      fadeOut: (onComplete) => onComplete(),
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
    section.dataset.contactState = 'loading';
    clearIntroInlineStyles(section);
    if (!skipDecorations) {
      if (orbitArc) preparePaths([orbitArc]);
      if (orbitSparks.length > 0) preparePaths(orbitSparks);

      const ambient = queryContactAmbient(section);
      if (ambient) {
        ambient.group.style.opacity = '0';
        for (const dot of ambient.dots) dot.style.opacity = '0';
        for (const path of ambient.paths) path.style.opacity = '0';
      }
    }
  };

  const buildTimeline = (): Timeline => {
    const ambient = queryContactAmbient(section);

    const nextTimeline = createTimeline({
      autoplay: false,
      defaults: { ease: 'outCubic' },
      onComplete: () => {
        section.dataset.contactState = 'complete';
        timeline = null;
      },
    });

    if (!skipDecorations) {
      if (ambient) {
        nextTimeline
          .add(
            ambient.group,
            { opacity: { to: 1 }, duration: 420, ease: 'outQuad' },
            0,
          )
          .add(
            ambient.dots,
            {
              opacity: { to: 1 },
              duration: 240,
              delay: stagger(10, { from: 'random' }),
              ease: 'outQuad',
            },
            60,
          )
          .add(
            ambient.paths,
            {
              opacity: { to: 1 },
              duration: 280,
              delay: stagger(14, { from: 'random' }),
              ease: 'outQuad',
            },
            120,
          );
      }

      if (orbitArc) {
        nextTimeline.add(
          orbitArc,
          {
            strokeDashoffset: { to: 0 },
            opacity: { to: 0.62 },
            duration: 520,
            ease: 'outCubic',
          },
          340,
        );
      }

      if (orbitSparks.length > 0) {
        nextTimeline.add(
          orbitSparks,
          {
            strokeDashoffset: { to: 0 },
            opacity: { to: 0.55 },
            duration: 360,
            delay: stagger(40),
            ease: 'outQuad',
          },
          720,
        );
      }

      nextTimeline.add(
        section,
        {
          duration: 1,
          onBegin: () => {
            options.onRocketIdleReveal?.();
          },
        },
        860,
      );
    }

    nextTimeline.add(
      revealTargets,
      {
        opacity: { to: 1 },
        translateY: { to: 0 },
        duration: 440,
        delay: stagger(42, { from: 'first' }),
      },
      skipDecorations ? 0 : 420,
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
    if (section.dataset.contactState === 'loading') {
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
    timeline.add(section, { opacity: { to: 0 }, duration: CONTACT_FADE_OUT_MS }, 0);
    timeline.play();
  };

  reset();

  return {
    play,
    reset,
    stop,
    fadeOut,
    destroy: () => {
      stop();
    },
  };
}
