import { createTimeline, stagger, type Timeline } from 'animejs';

const SVG_NS = 'http://www.w3.org/2000/svg';

function toneForPoint(x: number, y: number): string {
  if (y > 680 && x < 500) return 'blue';
  if (y > 600 && x >= 500) return 'cyan';
  if (x > 680 && y > 420) return 'green';
  if (x > 650 && y < 420) return 'orange';
  if (x < 410 && y > 480) return 'violet';
  return 'red';
}

function appendMicroDots(): SVGCircleElement[] {
  const group = document.querySelector('[data-network-micro]');
  if (!(group instanceof SVGGElement)) return [];

  const dots: SVGCircleElement[] = [];
  for (let row = 0; row < 17; row += 1) {
    for (let column = 0; column < 17; column += 1) {
      const index = row * 17 + column;
      const x = 205 + column * 39 + ((row * 13 + column * 7) % 3) * 3;
      const y = 148 + row * 42 + ((column * 11 + row * 5) % 4) * 2;
      const distance = Math.hypot(x - 530, y - 515);
      const keep = distance < 410 && (index * 17 + row * 9) % 5 !== 0;
      if (!keep) continue;

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.classList.add('network-micro-dot', `tone-${toneForPoint(x, y)}`);
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      dot.setAttribute('r', index % 11 === 0 ? '2' : '1.15');
      group.append(dot);
      dots.push(dot);
    }
  }
  return dots;
}

function setPathLengths(paths: SVGPathElement[]): void {
  for (const path of paths) {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
  }
}

function setFinalState(): void {
  document.body.dataset.intro = 'complete';
  for (const path of document.querySelectorAll<SVGPathElement>('.network-path')) {
    path.style.strokeDashoffset = '0';
  }
}

/** Builds the network and interface into their reference-matched resting state. */
export function initNetworkIntro(): Timeline | null {
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero) return null;

  const paths = [...document.querySelectorAll<SVGPathElement>('.network-path')];
  const nodes = [...document.querySelectorAll<SVGCircleElement>('.network-node')];
  const fragments = [...document.querySelectorAll<SVGPathElement>('.network-fragment')];
  const microDots = appendMicroDots();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  setPathLengths(paths);
  if (reducedMotion.matches) {
    setFinalState();
    return null;
  }

  document.body.dataset.intro = 'loading';
  const timeline = createTimeline({
    autoplay: false,
    defaults: { ease: 'outCubic' },
    onComplete: setFinalState,
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
        translateX: { to: 0 },
        duration: 440,
        delay: stagger(85),
      },
      2940,
    )
    .add(
      '[data-reveal="cta"]',
      { opacity: { to: 1 }, translateY: { to: 0 }, duration: 520 },
      3350,
    )
    .add(
      microDots,
      {
        opacity: { to: 1 },
        scale: { to: 1 },
        duration: 280,
        delay: stagger(9, { grid: [17, 17], from: 'center' }),
      },
      3500,
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
    setFinalState();
  });

  return timeline;
}
