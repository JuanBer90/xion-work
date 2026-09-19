import type { ContactSubmitPayload, ContactSubmitResult } from '@/contact/contact-api';
import { postContactMessage } from '@/contact/contact-api';
import type { ContactSubmitState } from '@/contact/contact-form';
import {
  TRANSMISSION_FAILURE_TIMING,
  TRANSMISSION_TIMING,
} from '@/contact/experiments/contact-transmission/constants';
import {
  createNoopContactTransmissionRocketLayer,
  getTangentAngleAtPathEnd,
  mountContactTransmissionRocket,
  pulseOriginNode,
} from '@/contact/experiments/contact-transmission/contact-transmission-rocket';
import { isContactMobileViewport } from '@/utils/viewport';
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

export type { ContactSubmitPayload };

export type ContactTransmissionController = {
  start: (payload: ContactSubmitPayload) => void;
  complete: () => void;
  reset: () => void;
  restoreIdleRocket: () => void;
  failOnArc: () => void;
  isActive: () => boolean;
  destroy: () => void;
};

type SubmissionGate = {
  apiOk: boolean | null;
  visualMinimumComplete: boolean;
  deliveredExitStarted: boolean;
  endAngle: number;
  endPoint: { x: number; y: number };
};

function noopController(): ContactTransmissionController {
  return {
    start: () => undefined,
    complete: () => undefined,
    reset: () => undefined,
    restoreIdleRocket: () => undefined,
    failOnArc: () => undefined,
    isActive: () => false,
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

  const visualRocketEnabled = !isContactMobileViewport();
  const rocketLayer = visualRocketEnabled
    ? mountContactTransmissionRocket(svg, arc, originNode)
    : createNoopContactTransmissionRocketLayer(arc);
  if (!rocketLayer) {
    return noopController();
  }

  let active = false;
  let motionGeneration = 0;
  let rafId = 0;
  let submitAbortController: AbortController | null = null;
  let gate: SubmissionGate | null = null;
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

  const abortSubmitRequest = (): void => {
    submitAbortController?.abort();
    submitAbortController = null;
  };

  const reset = (): void => {
    active = false;
    motionGeneration += 1;
    abortSubmitRequest();
    gate = null;
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
    abortSubmitRequest();
    gate = null;
    clearTimers();
  };

  const finishFailure = (): void => {
    rocketLayer.hide();
    rocketLayer.resetTrail();
    rocketLayer.resetRocketPlacement();
    setContactTransmissionFailure(statusUi);
    active = false;
    abortSubmitRequest();
    gate = null;
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

  const tryCompleteDelivery = (motionGen: number): void => {
    if (!active || motionGen !== motionGeneration || !gate) return;
    if (gate.apiOk !== true || !gate.visualMinimumComplete || gate.deliveredExitStarted) return;

    gate.deliveredExitStarted = true;

    if (!visualRocketEnabled || prefersReducedMotion()) {
      const { exit, deliveredDelay } = TRANSMISSION_TIMING;
      setStage('delivered');
      rocketLayer.hide();
      rocketLayer.resetTrail();
      schedule(() => {
        if (motionGen !== motionGeneration) return;
        finishDelivered();
      }, exit + deliveredDelay);
      return;
    }

    beginDeliveredExit(motionGen, gate.endAngle, gate.endPoint);
  };

  const tryFailure = (motionGen: number): void => {
    if (!active || motionGen !== motionGeneration || !gate) return;
    if (gate.apiOk !== false || gate.deliveredExitStarted) return;
    runFailureOnArc(motionGen);
  };

  const onVisualMinimumComplete = (
    motionGen: number,
    arcEnd: number,
    endAngle: number,
    endPoint: { x: number; y: number },
  ): void => {
    if (!gate) return;
    holdRocketAtArcEnd(arcEnd, endAngle);
    gate.endAngle = endAngle;
    gate.endPoint = endPoint;
    gate.visualMinimumComplete = true;
    setStage('transmitting');

    if (gate.apiOk === true) {
      tryCompleteDelivery(motionGen);
    } else if (gate.apiOk === false) {
      tryFailure(motionGen);
    }
  };

  const handleSubmitResult = (motionGen: number, result: ContactSubmitResult): void => {
    if (motionGen !== motionGeneration || !active || !gate) return;
    if (result === 'aborted') return;

    gate.apiOk = result === 'success';
    if (gate.apiOk) {
      tryCompleteDelivery(motionGen);
    } else {
      tryFailure(motionGen);
    }
  };

  const runMotionSequence = (motionGen: number): void => {
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

    const startedAt = performance.now();

    const tick = (now: number): void => {
      if (!active || motionGen !== motionGeneration || rocketLayer.isMotionFrozen()) {
        return;
      }

      if (gate?.deliveredExitStarted) {
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
        onVisualMinimumComplete(motionGen, arcEnd, endAngle, endPoint);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  };

  const runReducedMotionSequence = (motionGen: number): void => {
    const { validating, securing, arcTravel } = TRANSMISSION_TIMING;
    const arcStart = validating + securing;
    const arcEndTime = arcStart + arcTravel;
    const arcEnd = rocketLayer.arcTotalLength;
    const endAngle = getTangentAngleAtPathEnd(arc);
    const endPoint = arc.getPointAtLength(arcEnd);

    pulseOriginNode(originNode, 'cyan');
    setStage('validating');

    schedule(() => setStage('securing'), validating);
    schedule(() => setStage('transmitting'), arcStart);

    schedule(() => {
      if (motionGen !== motionGeneration || !gate) return;
      onVisualMinimumComplete(motionGen, arcEnd, endAngle, endPoint);
    }, arcEndTime);
  };

  const complete = (): void => {
    motionGeneration += 1;
    abortSubmitRequest();
    gate = null;
    clearTimers();
    rocketLayer.cancelFailureAnimation();
    finishDelivered();
  };

  const start = (payload: ContactSubmitPayload): void => {
    if (active) return;

    abortSubmitRequest();
    submitAbortController = new AbortController();
    const { signal } = submitAbortController;

    clearContactTransmissionFailure(statusUi);
    clearTransmissionEffects();
    rocketLayer.cancelFailureAnimation();
    rocketLayer.resetRocketPlacement();
    rocketLayer.setRocketAtPathLength(0, getPathTangentAngle(arc, 0));
    active = true;
    motionGeneration += 1;
    const motionGen = motionGeneration;

    gate = {
      apiOk: null,
      visualMinimumComplete: false,
      deliveredExitStarted: false,
      endAngle: 0,
      endPoint: { x: 0, y: 0 },
    };

    void postContactMessage(payload, signal).then((result) => {
      handleSubmitResult(motionGen, result);
    });

    if (!visualRocketEnabled || prefersReducedMotion()) {
      runReducedMotionSequence(motionGen);
      return;
    }

    runMotionSequence(motionGen);
  };

  const destroy = (): void => {
    reset();
    rocketLayer.destroy();
  };

  const restoreIdleRocket = (): void => {
    if (!visualRocketEnabled || active) return;
    if (statusUi.root.getAttribute('data-contact-transmission-outcome') === 'failed') {
      return;
    }
    rocketLayer.setIdleAtArcStart();
  };

  const failOnArc = (): void => {
    if (!active) return;
    runFailureOnArc(motionGeneration);
  };

  return {
    start,
    complete,
    reset,
    restoreIdleRocket,
    failOnArc,
    isActive: () => active,
    destroy,
  };
}
