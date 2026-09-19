import type { ContactSubmitState } from '@/contact/contact-form';

const STEP_ORDER: ContactSubmitState[] = [
  'validating',
  'securing',
  'transmitting',
  'delivered',
];

export type ContactTransmissionStatusUi = {
  root: HTMLElement;
  steps: HTMLElement[];
  failureMessage: HTMLElement | null;
};

export function bindContactTransmissionStatus(
  sectionRoot: HTMLElement,
): ContactTransmissionStatusUi | null {
  const root = sectionRoot.querySelector<HTMLElement>('[data-contact-status]');
  if (!root) return null;

  const steps = [...sectionRoot.querySelectorAll<HTMLElement>('[data-contact-step]')];
  const failureMessage = root.querySelector<HTMLElement>('[data-contact-transmission-failure]');
  return { root, steps, failureMessage };
}

function clearStepOutcomeClasses(step: HTMLElement): void {
  step.classList.remove(
    'contact-status__step--idle',
    'contact-status__step--active',
    'contact-status__step--complete',
    'contact-status__step--failed',
    'contact-status__step--skipped',
  );
}

export function clearContactTransmissionFailure(ui: ContactTransmissionStatusUi): void {
  if (ui.failureMessage) {
    ui.failureMessage.hidden = true;
  }
  ui.root.removeAttribute('data-contact-transmission-outcome');
}

export function setContactTransmissionFailure(ui: ContactTransmissionStatusUi): void {
  ui.root.setAttribute('data-contact-submit-state', 'failed');
  ui.root.setAttribute('data-contact-transmission-outcome', 'failed');

  if (ui.failureMessage) {
    ui.failureMessage.hidden = false;
  }

  for (const step of ui.steps) {
    const stepName = step.dataset.contactStep as ContactSubmitState | undefined;
    clearStepOutcomeClasses(step);

    if (stepName === 'validating' || stepName === 'securing') {
      step.classList.add('contact-status__step--complete');
    } else if (stepName === 'transmitting') {
      step.classList.add('contact-status__step--failed');
    } else if (stepName === 'delivered') {
      step.classList.add('contact-status__step--skipped');
    } else {
      step.classList.add('contact-status__step--idle');
    }
  }
}

export function setContactTransmissionStatus(
  ui: ContactTransmissionStatusUi,
  state: ContactSubmitState,
): void {
  clearContactTransmissionFailure(ui);
  ui.root.setAttribute('data-contact-submit-state', state);
  ui.root.removeAttribute('data-contact-transmission-outcome');

  for (const step of ui.steps) {
    const stepName = step.dataset.contactStep as ContactSubmitState | undefined;
    clearStepOutcomeClasses(step);

    if (state === 'idle' || !stepName || !STEP_ORDER.includes(stepName)) {
      step.classList.add('contact-status__step--idle');
      continue;
    }

    const stepIndex = STEP_ORDER.indexOf(stepName);
    const activeIndex = STEP_ORDER.indexOf(state);

    if (stepIndex < activeIndex) {
      step.classList.add('contact-status__step--complete');
    } else if (stepIndex === activeIndex) {
      step.classList.add('contact-status__step--active');
    } else {
      step.classList.add('contact-status__step--idle');
    }
  }
}
