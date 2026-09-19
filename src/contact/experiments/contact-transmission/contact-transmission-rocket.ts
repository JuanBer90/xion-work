import { TRANSMISSION_TRAIL_LENGTH } from '@/contact/experiments/contact-transmission/constants';
import {
  findClosestPathLength,
  getPathTangentAngle,
} from '@/contact/experiments/contact-transmission/svg-path-utils';

const ROCKET_NS = 'http://www.w3.org/2000/svg';
const ORIGIN_HIDDEN_CLASS = 'contact-transmission__origin-ref--hidden';
const ROCKET_VIEWPORT_CLASS = 'contact-transmission__rocket--viewport';
/** Default 🚀 glyph aims ~45° above +X; prior SVG rocket aimed along +X. */
const EMOJI_HEADING_OFFSET_DEG = 45;
const ROCKET_HALF_SIZE_PX = 12;
const EXIT_MIN_DURATION_MS = 600;
const EXIT_MAX_DURATION_MS = 2600;
const EXIT_SPEED_PX_PER_MS = 0.38;

export type ContactTransmissionRocketLayer = {
  trailPath: SVGPathElement;
  originLength: number;
  arcTotalLength: number;
  setRocketAtPathLength: (length: number, angleDeg: number) => void;
  setRocketAtPoint: (x: number, y: number, angleDeg: number, opacity: number) => void;
  prepareViewportExit: (angleDeg: number) => number;
  setViewportExitProgress: (progress: number, angleDeg: number, opacity: number) => void;
  setTrailAtPathLength: (length: number, intensity?: number) => void;
  setTrailExit: (x: number, y: number, angleDeg: number, tailLength: number, intensity: number) => void;
  reveal: (opacity: number) => void;
  hide: () => void;
  resetTrail: () => void;
  resetRocketPlacement: () => void;
  setIdleAtArcStart: () => void;
  destroy: () => void;
};

type ViewportExitPlan = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  durationMs: number;
};

function mapSvgPointToOrbit(
  svg: SVGSVGElement,
  orbit: HTMLElement,
  x: number,
  y: number,
): { x: number; y: number } {
  const viewBox = svg.viewBox.baseVal;
  const svgRect = svg.getBoundingClientRect();
  const orbitRect = orbit.getBoundingClientRect();

  if (viewBox.width <= 0 || viewBox.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const localX = ((x - viewBox.x) / viewBox.width) * svgRect.width;
  const localY = ((y - viewBox.y) / viewBox.height) * svgRect.height;

  return {
    x: svgRect.left - orbitRect.left + localX,
    y: svgRect.top - orbitRect.top + localY,
  };
}

function computeViewportExitPlan(startX: number, startY: number, angleDeg: number): ViewportExitPlan {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const margin = ROCKET_HALF_SIZE_PX + 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let t = 0;
  if (dx > 0) {
    t = Math.max(t, (vw + margin - startX) / dx);
  }
  if (dy < 0) {
    t = Math.max(t, (0 - margin - startY) / dy);
  }
  if (t <= 0) {
    t = Math.hypot(vw, vh);
  }

  const endX = startX + dx * t;
  const endY = startY + dy * t;
  const distance = Math.hypot(endX - startX, endY - startY);
  const durationMs = Math.min(
    EXIT_MAX_DURATION_MS,
    Math.max(EXIT_MIN_DURATION_MS, distance / EXIT_SPEED_PX_PER_MS),
  );

  return { startX, startY, endX, endY, durationMs };
}

export function mountContactTransmissionRocket(
  svg: SVGSVGElement,
  arc: SVGPathElement,
  originNode: SVGCircleElement,
): ContactTransmissionRocketLayer | null {
  const arcPath = arc.getAttribute('d');
  const orbit = svg.closest<HTMLElement>('.contact-section__orbit');
  if (!arcPath || !orbit) return null;

  originNode.classList.add(ORIGIN_HIDDEN_CLASS);

  const mount = document.createElementNS(ROCKET_NS, 'g');
  mount.setAttribute('class', 'contact-transmission__layer');
  mount.setAttribute('data-contact-transmission-layer', '');

  const trailPath = document.createElementNS(ROCKET_NS, 'path');
  trailPath.setAttribute('class', 'contact-transmission__trail');
  trailPath.setAttribute('d', arcPath);
  trailPath.setAttribute('fill', 'none');
  trailPath.setAttribute('vector-effect', 'non-scaling-stroke');

  mount.append(trailPath);
  svg.append(mount);

  const rocketEl = document.createElement('div');
  rocketEl.className = 'contact-transmission__rocket';
  rocketEl.setAttribute('data-contact-transmission-rocket', '');
  rocketEl.setAttribute('aria-hidden', 'true');
  rocketEl.textContent = '🚀';
  rocketEl.style.opacity = '0';
  orbit.append(rocketEl);

  const originLength = findClosestPathLength(
    arc,
    Number(originNode.getAttribute('cx')),
    Number(originNode.getAttribute('cy')),
  );
  const arcTotalLength = arc.getTotalLength();

  let exitPlan: ViewportExitPlan | null = null;

  const applyRocketHeading = (headingDeg: number): void => {
    rocketEl.style.transform = `translate(-50%, -50%) rotate(${headingDeg}deg)`;
  };

  const setRocketInOrbit = (x: number, y: number, angleDeg: number, opacity: number): void => {
    if (rocketEl.parentElement !== orbit) {
      resetRocketPlacement();
    }
    const local = mapSvgPointToOrbit(svg, orbit, x, y);
    rocketEl.style.position = 'absolute';
    rocketEl.style.left = `${local.x}px`;
    rocketEl.style.top = `${local.y}px`;
    applyRocketHeading(angleDeg + EMOJI_HEADING_OFFSET_DEG);
    rocketEl.style.opacity = String(opacity);
    rocketEl.style.visibility = opacity > 0 ? 'visible' : 'hidden';
  };

  const resetRocketPlacement = (): void => {
    exitPlan = null;
    rocketEl.classList.remove(ROCKET_VIEWPORT_CLASS);
    rocketEl.style.position = 'absolute';
    rocketEl.style.zIndex = '';
    if (rocketEl.parentElement !== orbit) {
      orbit.append(rocketEl);
    }
  };

  const setIdleAtArcStart = (): void => {
    resetRocketPlacement();
    const point = arc.getPointAtLength(0);
    const angle = getPathTangentAngle(arc, 0);
    setRocketInOrbit(point.x, point.y, angle, 1);
  };

  rocketEl.style.opacity = '0';
  rocketEl.style.visibility = 'hidden';

  return {
    trailPath,
    originLength,
    arcTotalLength,
    setRocketAtPathLength(length: number, angleDeg: number): void {
      const point = arc.getPointAtLength(length);
      setRocketInOrbit(point.x, point.y, angleDeg, 1);
    },
    setRocketAtPoint(x: number, y: number, angleDeg: number, opacity: number): void {
      setRocketInOrbit(x, y, angleDeg, opacity);
    },
    prepareViewportExit(angleDeg: number): number {
      const rect = rocketEl.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;
      exitPlan = computeViewportExitPlan(startX, startY, angleDeg);

      document.body.append(rocketEl);
      rocketEl.classList.add(ROCKET_VIEWPORT_CLASS);
      rocketEl.style.position = 'fixed';
      rocketEl.style.left = `${startX}px`;
      rocketEl.style.top = `${startY}px`;
      applyRocketHeading(angleDeg + EMOJI_HEADING_OFFSET_DEG);
      rocketEl.style.opacity = '1';
      rocketEl.style.visibility = 'visible';

      return exitPlan.durationMs;
    },
    setViewportExitProgress(progress: number, angleDeg: number, opacity: number): void {
      if (!exitPlan) return;
      const x = exitPlan.startX + (exitPlan.endX - exitPlan.startX) * progress;
      const y = exitPlan.startY + (exitPlan.endY - exitPlan.startY) * progress;
      rocketEl.style.left = `${x}px`;
      rocketEl.style.top = `${y}px`;
      applyRocketHeading(angleDeg + EMOJI_HEADING_OFFSET_DEG);
      rocketEl.style.opacity = String(opacity);
      rocketEl.style.visibility = opacity > 0 ? 'visible' : 'hidden';
    },
    setTrailAtPathLength(length: number, intensity = 1): void {
      const trailLen = Math.min(TRANSMISSION_TRAIL_LENGTH, length);
      trailPath.style.strokeDasharray = `${trailLen} ${arcTotalLength}`;
      trailPath.style.strokeDashoffset = `${-(length - trailLen)}`;
      trailPath.style.opacity = String(0.35 * intensity);
    },
    setTrailExit(x: number, y: number, angleDeg: number, tailLength: number, intensity: number): void {
      const rad = (angleDeg * Math.PI) / 180;
      const x2 = x - Math.cos(rad) * tailLength;
      const y2 = y - Math.sin(rad) * tailLength;
      trailPath.setAttribute('d', `M ${x2} ${y2} L ${x} ${y}`);
      trailPath.style.strokeDasharray = 'none';
      trailPath.style.strokeDashoffset = '0';
      trailPath.style.opacity = String(0.45 * intensity);
    },
    reveal(opacity: number): void {
      rocketEl.style.opacity = String(opacity);
      rocketEl.style.visibility = opacity > 0 ? 'visible' : 'hidden';
    },
    hide(): void {
      rocketEl.style.opacity = '0';
      rocketEl.style.visibility = 'hidden';
    },
    resetTrail(): void {
      trailPath.setAttribute('d', arcPath);
      trailPath.style.strokeDasharray = 'none';
      trailPath.style.strokeDashoffset = '0';
      trailPath.style.opacity = '0';
    },
    resetRocketPlacement,
    setIdleAtArcStart,
    destroy(): void {
      mount.remove();
      rocketEl.remove();
      originNode.classList.remove(ORIGIN_HIDDEN_CLASS);
      originNode.classList.remove(
        'contact-transmission__origin-pulse--cyan',
        'contact-transmission__origin-pulse--green',
      );
    },
  };
}

/** Origin marker is path reference only; no visible pulse (node stays hidden). */
export function pulseOriginNode(_node: SVGCircleElement, _variant: 'cyan' | 'green'): void {
  return undefined;
}

export function getTangentAngleAtPathEnd(arc: SVGPathElement): number {
  const total = arc.getTotalLength();
  return getPathTangentAngle(arc, total);
}
