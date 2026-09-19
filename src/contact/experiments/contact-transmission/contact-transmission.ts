import type { ContactSubmitState } from '@/contact/contact-form';
import {
  TRANSMISSION_FAILURE_TIMING,
  TRANSMISSION_TIMING,
} from '@/contact/experiments/contact-transmission/constants';
import {
  getTangentAngleAtPathEnd,
  mountContactTransmissionRocket,
  pulseOriginNode,
} from '@/contact/experiments/contact-transmission/contact-transmission-rocket';
import {
  bindContactTransmissionStatus,
  clearContactTransmissionFailure,
  setContactTransmissionFailure,
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
  restoreIdleRocket: () => void;
  destroy: () => void;
};

function noopController(): ContactTransmissionController {
  return {
    start: () => undefined,
    complete: () => undefined,
    reset: () => undefined,
    restoreIdleRocket: () => undefined,
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
  let validAttemptCount = 0;
  let motionGeneration = 0;
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
    motionGeneration += 1;
    clearTimers();
    rocketLayer.cancelFailureAnimation();
    clearTransmissionEffects();
    clearContactTransmissionFailure(statusUi);
    rocketLayer.hide();
    rocketLayer.resetRocketPlacement();
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

  const finishFailure = (): void => {
    rocketLayer.hide();
    rocketLayer.resetTrail();
    rocketLayer.resetRocketPlacement();
    setContactTransmissionFailure(statusUi);
    active = false;
    clearTimers();
  };

  const runFailureOnArc = (motionGen: number): void => {
    clearTimers();
    const { pauseMs, fadeMs } = TRANSMISSION_FAILURE_TIMING;
    void rocketLayer.fail(pauseMs, fadeMs).then(() => {
      if (motionGen !== motionGeneration) return;
      finishFailure();
    });
  };

  /** Free-flight exit — only call after `setStage('delivered')`. */
  const beginDeliveredExit = (
    motionGen: number,
    endAngle: number,
    endPoint: { x: number; y: number },
  ): void => {
    setStage('delivered');

    const exitDurationMs = rocketLayer.prepareViewportExit(endAngle);
    const { deliveredDelay } = TRANSMISSION_TIMING;
    const exitStartedAt = performance.now();

    const exitTick = (now: number): void => {
      if (!active || motionGen !== motionGeneration || rocketLayer.isMotionFrozen()) {
        return;
      }

      const exitElapsed = now - exitStartedAt;
      const exitT = easeInCubic(Math.min(1, exitElapsed / exitDurationMs));

      if (exitT < 1) {
        const tailScale = 1 + exitT * 0.85;
        rocketLayer.setViewportExitProgress(exitT, endAngle, 1 - exitT * 0.08);
        rocketLayer.setTrailExit(endPoint.x, endPoint.y, endAngle, 14 * tailScale, 0.5 + exitT * 0.45);
        rafId = requestAnimationFrame(exitTick);
        return;
      }

      if (exitElapsed < exitDurationMs + deliveredDelay) {
        rocketLayer.hide();
        rocketLayer.resetTrail();
        rocketLayer.resetRocketPlacement();
        rafId = requestAnimationFrame(exitTick);
        return;
      }

      finishDelivered();
    };

    rafId = requestAnimationFrame(exitTick);
  };

  const holdRocketAtArcEnd = (arcEnd: number, endAngle: number): void => {
    rocketLayer.setRocketAtPathLength(arcEnd, endAngle);
    rocketLayer.setTrailAtPathLength(arcEnd, 0.85);
  };

  const resolveArcEnd = (
    motionGen: number,
    simulateFailure: boolean,
    arcEnd: number,
    endAngle: number,
    endPoint: { x: number; y: number },
    deliveredExitStarted: { value: boolean },
  ): void => {
    holdRocketAtArcEnd(arcEnd, endAngle);

    if (simulateFailure) {
      runFailureOnArc(motionGen);
      return;
    }

    if (!deliveredExitStarted.value) {
      deliveredExitStarted.value = true;
      beginDeliveredExit(motionGen, endAngle, endPoint);
    }
  };

  const runMotionSequence = (simulateFailure: boolean): void => {
    const motionGen = motionGeneration;
    const { validating, securing, arcTravel } = TRANSMISSION_TIMING;
    const arcStart = validating + securing;
    const arcEndTime = arcStart + arcTravel;

    const arcStartLength = 0;
    const arcEnd = rocketLayer.arcTotalLength;
    const endAngle = getTangentAngleAtPathEnd(arc);
    const endPoint = arc.getPointAtLength(arcEnd);
    const startAngle = getPathTangentAngle(arc, arcStartLength);

    pulseOriginNode(originNode, 'cyan');
    setStage('validating');
    rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);

    const deliveredExitStarted = { value: false };

    const startedAt = performance.now();

    const tick = (now: number): void => {
      if (!active || motionGen !== motionGeneration || rocketLayer.isMotionFrozen()) {
        return;
      }

      if (deliveredExitStarted.value) {
        return;
      }

      const elapsed = now - startedAt;

      if (elapsed < validating) {
        const revealT = easeInOutCubic(elapsed / validating);
        rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);
        rocketLayer.setTrailAtPathLength(arcStartLength, revealT * 0.4);
      } else if (elapsed < arcStart) {
        setStage('securing');
        rocketLayer.setRocketAtPathLength(arcStartLength, startAngle);
        rocketLayer.setTrailAtPathLength(arcStartLength, 0.55);
      } else if (elapsed < arcEndTime) {
        setStage('transmitting');
        const arcElapsed = elapsed - arcStart;
        const arcT = easeInOutCubic(Math.min(1, arcElapsed / arcTravel));
        const length = arcStartLength + (arcEnd - arcStartLength) * arcT;
        const angle = getPathTangentAngle(arc, length);
        rocketLayer.setRocketAtPathLength(length, angle);
        rocketLayer.setTrailAtPathLength(length, 0.85);
      } else {
        setStage('transmitting');
        resolveArcEnd(motionGen, simulateFailure, arcEnd, endAngle, endPoint, deliveredExitStarted);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  };

  const runReducedMotionSequence = (simulateFailure: boolean): void => {
    const { validating, securing, arcTravel, exit, deliveredDelay } = TRANSMISSION_TIMING;
    const arcStart = validating + securing;
    const arcEndTime = arcStart + arcTravel;
    const arcEnd = rocketLayer.arcTotalLength;
    const endAngle = getTangentAngleAtPathEnd(arc);
    const motionGen = motionGeneration;

    pulseOriginNode(originNode, 'cyan');
    setStage('validating');

    schedule(() => setStage('securing'), validating);
    schedule(() => setStage('transmitting'), arcStart);

    schedule(() => {
      holdRocketAtArcEnd(arcEnd, endAngle);
      if (simulateFailure) {
        runFailureOnArc(motionGen);
        return;
      }
      setStage('delivered');
      rocketLayer.hide();
      rocketLayer.resetTrail();
      schedule(finishDelivered, exit + deliveredDelay);
    }, arcEndTime);
  };

  const complete = (): void => {
    finishDelivered();
  };

  const start = (): void => {
    if (active) return;

    validAttemptCount += 1;
    const simulateFailure = validAttemptCount === 1;

    clearContactTransmissionFailure(statusUi);
    clearTransmissionEffects();
    rocketLayer.cancelFailureAnimation();
    rocketLayer.resetRocketPlacement();
    rocketLayer.setRocketAtPathLength(0, getPathTangentAngle(arc, 0));
    active = true;
    motionGeneration += 1;

    if (prefersReducedMotion()) {
      runReducedMotionSequence(simulateFailure);
      return;
    }

    runMotionSequence(simulateFailure);
  };

  const destroy = (): void => {
    reset();
    rocketLayer.destroy();
  };

  const restoreIdleRocket = (): void => {
    if (active) return;
    if (statusUi.root.getAttribute('data-contact-transmission-outcome') === 'failed') {
      return;
    }
    rocketLayer.setIdleAtArcStart();
  };

  return { start, complete, reset, restoreIdleRocket, destroy };
}
