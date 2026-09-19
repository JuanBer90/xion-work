import type { ContactSubmitState } from '@/contact/contact-form';
import { TRANSMISSION_TIMING } from '@/contact/experiments/contact-transmission/constants';
import {
  getTangentAngleAtPathEnd,
  mountContactTransmissionRocket,
  pulseOriginNode,
} from '@/contact/experiments/contact-transmission/contact-transmission-rocket';
import {
  bindContactTransmissionStatus,
  setContactTransmissionStatus,
} from '@/contact/experiments/contact-transmission/contact-transmission-status';
import {
  easeInCubic,
  easeInOutCubic,
  getPathTangentAngle,
} from '@/contact/experiments/contact-transmission/svg-path-utils';
import { prefersReducedMotion } from '@/utils/motion';

export type ContactTransmissionController = {
  start: () => void;
  complete: () => void;
  reset: () => void;
  destroy: () => void;
};

function noopController(): ContactTransmissionController {
  return {
    start: () => undefined,
    complete: () => undefined,
    reset: () => undefined,
    destroy: () => undefined,
  };
}

export function mountContactTransmissionExperiment(
  sectionRoot: HTMLElement | null,
): ContactTransmissionController {
  if (!sectionRoot) return noopController();

  const svg = sectionRoot.querySelector<SVGSVGElement>('.contact-section__orbit-svg');
  const arc = sectionRoot.querySelector<SVGPathElement>('.contact-section__orbit-arc');
  const originNode = sectionRoot.querySelector<SVGCircleElement>('.contact-section__orbit-node');
  const statusUi = bindContactTransmissionStatus(sectionRoot);

  if (!svg || !arc || !originNode || !statusUi) {
    return noopController();
  }

  const rocketLayer = mountContactTransmissionRocket(svg, arc, originNode);
  if (!rocketLayer) {
    return noopController();
  }

  let active = false;
  let rafId = 0;
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  const clearTimers = (): void => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    while (timeoutIds.length > 0) {
      const id = timeoutIds.pop();
      if (id !== undefined) clearTimeout(id);
    }
  };

  const schedule = (fn: () => void, delayMs: number): void => {
    timeoutIds.push(
      setTimeout(() => {
        if (!active) return;
        fn();
      }, delayMs),
    );
  };

  const setStage = (state: ContactSubmitState): void => {
    setContactTransmissionStatus(statusUi, state);
  };

  const clearTransmissionEffects = (): void => {
    rocketLayer.resetTrail();
    originNode.classList.remove(
      'contact-transmission__origin-pulse--cyan',
      'contact-transmission__origin-pulse--green',
    );
  };

  const reset = (): void => {
    active = false;
    clearTimers();
    clearTransmissionEffects();
    rocketLayer.setIdleAtArcStart();
    setStage('idle');
  };

  const finishDelivered = (): void => {
    rocketLayer.hide();
    rocketLayer.resetTrail();
    rocketLayer.resetRocketPlacement();
    pulseOriginNode(originNode, 'green');
    setStage('delivered');
    active = false;
    clearTimers();
  };

  const complete = (): void => {
    finishDelivered();
  };

  const runMotionSequence = (): void => {
    const { validating, securing, arcTravel, exit, deliveredDelay } = TRANSMISSION_TIMING;
    const arcStart = validating + securing;
    const exitStart = arcStart + arcTravel;

    const arcStartLength = 0;
    const arcEnd = rocketLayer.arcTotalLength;
    const endAngle = getTangentAngleAtPathEnd(arc);
    const endPoint = arc.getPointAtLength(arcEnd);
    const startAngle = getPathTangentAngle(arc, arcStartLength);

    pulseOriginNode(originNode, 'cyan');
    setStage('validating');
    rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);

    let exitDurationMs: number = exit;
    let deliveredAt = exitStart + exit + deliveredDelay;
    let exitPrepared = false;

    const startedAt = performance.now();

    const tick = (now: number): void => {
      if (!active) return;

      const elapsed = now - startedAt;

      if (elapsed < validating) {
        const revealT = easeInOutCubic(elapsed / validating);
        rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);
        rocketLayer.setTrailAtPathLength(arcStartLength, revealT * 0.4);
      } else if (elapsed < arcStart) {
        setStage('securing');
        rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);
        rocketLayer.setTrailAtPathLength(arcStartLength, 0.55);
      } else if (elapsed < exitStart) {
        setStage('transmitting');
        const arcElapsed = elapsed - arcStart;
        const arcT = easeInOutCubic(Math.min(1, arcElapsed / arcTravel));
        const length = arcStartLength + (arcEnd - arcStartLength) * arcT;
        const angle = getPathTangentAngle(arc, length);
        rocketLayer.setRocketAtPathLength(length, angle);
        rocketLayer.setTrailAtPathLength(length, 0.85);
      } else if (elapsed < exitStart + exitDurationMs) {
        if (!exitPrepared) {
          rocketLayer.setRocketAtPathLength(arcEnd, endAngle);
          exitDurationMs = rocketLayer.prepareViewportExit(endAngle);
          deliveredAt = exitStart + exitDurationMs + deliveredDelay;
          exitPrepared = true;
        }
        const exitElapsed = elapsed - exitStart;
        const exitT = easeInCubic(Math.min(1, exitElapsed / exitDurationMs));
        const tailScale = 1 + exitT * 0.85;
        rocketLayer.setViewportExitProgress(exitT, endAngle, 1 - exitT * 0.08);
        rocketLayer.setTrailExit(endPoint.x, endPoint.y, endAngle, 14 * tailScale, 0.5 + exitT * 0.45);
      } else if (elapsed < deliveredAt) {
        rocketLayer.hide();
        rocketLayer.resetTrail();
        rocketLayer.resetRocketPlacement();
      } else {
        finishDelivered();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  };

  const runReducedMotionSequence = (): void => {
    const { validating, securing, arcTravel, exit, deliveredDelay } = TRANSMISSION_TIMING;
    const arcStart = validating + securing;
    const exitStart = arcStart + arcTravel;
    const deliveredAt = exitStart + exit + deliveredDelay;

    pulseOriginNode(originNode, 'cyan');
    setStage('validating');

    schedule(() => setStage('securing'), validating);
    schedule(() => setStage('transmitting'), arcStart);
    schedule(() => {
      rocketLayer.hide();
      rocketLayer.resetTrail();
    }, exitStart);
    schedule(finishDelivered, deliveredAt);
  };

  const start = (): void => {
    if (active) return;

    clearTransmissionEffects();
    rocketLayer.resetRocketPlacement();
    rocketLayer.setRocketAtPathLength(0, getPathTangentAngle(arc, 0));
    active = true;

    if (prefersReducedMotion()) {
      runReducedMotionSequence();
      return;
    }

    runMotionSequence();
  };

  const destroy = (): void => {
    reset();
    rocketLayer.destroy();
  };

  return { start, complete, reset, destroy };
}
