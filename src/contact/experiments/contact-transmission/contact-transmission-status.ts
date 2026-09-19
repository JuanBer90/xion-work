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
};

export function bindContactTransmissionStatus(
  sectionRoot: HTMLElement,
): ContactTransmissionStatusUi | null {
  const root = sectionRoot.querySelector<HTMLElement>('[data-contact-status]');
  if (!root) return null;

  const steps = [...sectionRoot.querySelectorAll<HTMLElement>('[data-contact-step]')];
  return { root, steps };
}

export function setContactTransmissionStatus(
  ui: ContactTransmissionStatusUi,
  state: ContactSubmitState,
): void {
  ui.root.setAttribute('data-contact-submit-state', state);

  for (const step of ui.steps) {
    const stepName = step.dataset.contactStep as ContactSubmitState | undefined;
    step.classList.remove(
      'contact-status__step--idle',
      'contact-status__step--active',
      'contact-status__step--complete',
    );

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
