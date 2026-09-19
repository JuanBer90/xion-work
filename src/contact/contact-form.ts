import { applyContactLinks } from '@/contact/contact-links';
import { prefersReducedMotion } from '@/utils/motion';

export type ContactFormPayload = {
  email: string;
  message: string;
  website: string;
};

export type ContactSubmitState =
  | 'idle'
  | 'validating'
  | 'securing'
  | 'transmitting'
  | 'delivered'
  | 'failed'
  | 'error';

const MESSAGE_MAX_LENGTH = 1000;
const VALIDATION_ERROR_WRAP_CLASS = 'contact-form__signal-wrap--validation-error';

type ValidatableField = HTMLInputElement | HTMLTextAreaElement;

type FieldValidationUi = {
  input: ValidatableField;
  signalWrap: HTMLElement;
  errorEl: HTMLElement;
  errorDescribedById: string;
};

function formatCharCount(length: number): string {
  return `${length}/${MESSAGE_MAX_LENGTH}`;
}

function getEmailValidationMessage(input: HTMLInputElement): string | null {
  if (input.validity.valueMissing) {
    return 'EMAIL IS REQUIRED';
  }
  if (input.validity.typeMismatch) {
    return 'ENTER A VALID EMAIL ADDRESS';
  }
  return null;
}

function getMessageValidationMessage(textarea: HTMLTextAreaElement): string | null {
  if (textarea.validity.valueMissing) {
    return 'MESSAGE IS REQUIRED';
  }
  return null;
}

function replayValidationErrorTrace(wrap: HTMLElement): void {
  wrap.classList.remove(VALIDATION_ERROR_WRAP_CLASS);
  void wrap.offsetWidth;
  wrap.classList.add(VALIDATION_ERROR_WRAP_CLASS);
}

function clearFieldValidationUi({ input, signalWrap, errorEl }: FieldValidationUi): void {
  errorEl.hidden = true;
  errorEl.textContent = '';
  signalWrap.classList.remove(VALIDATION_ERROR_WRAP_CLASS);
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
}

function showFieldValidationFailure(
  { input, signalWrap, errorEl, errorDescribedById }: FieldValidationUi,
  message: string,
): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', errorDescribedById);

  if (!prefersReducedMotion()) {
    replayValidationErrorTrace(signalWrap);
  } else {
    signalWrap.classList.add(VALIDATION_ERROR_WRAP_CLASS);
  }

  input.focus();
}

export type InitContactFormOptions = {
  onValidSubmit?: (payload: ContactFormPayload) => void;
  isSubmitInProgress?: () => boolean;
};

export function initContactForm(
  root: HTMLElement | null,
  options: InitContactFormOptions = {},
): () => void {
  if (!root) return () => undefined;

  applyContactLinks(root);

  const form = root.querySelector<HTMLFormElement>('[data-contact-form]');
  const emailInput = root.querySelector<HTMLInputElement>('input[name="email"]');
  const emailSignalWrap = root.querySelector<HTMLElement>('[data-contact-email-signal-wrap]');
  const emailError = root.querySelector<HTMLElement>('[data-contact-email-error]');
  const messageInput = root.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  const messageSignalWrap = root.querySelector<HTMLElement>('[data-contact-message-signal-wrap]');
  const messageError = root.querySelector<HTMLElement>('[data-contact-message-error]');
  const counter = root.querySelector<HTMLElement>('[data-contact-char-count]');
  const websiteInput = root.querySelector<HTMLInputElement>('input[name="website"]');

  if (
    !form ||
    !emailInput ||
    !messageInput ||
    !websiteInput ||
    !counter ||
    !emailSignalWrap ||
    !emailError ||
    !messageSignalWrap ||
    !messageError
  ) {
    return () => undefined;
  }

  const emailValidationUi: FieldValidationUi = {
    input: emailInput,
    signalWrap: emailSignalWrap,
    errorEl: emailError,
    errorDescribedById: 'contact-email-error',
  };

  const messageValidationUi: FieldValidationUi = {
    input: messageInput,
    signalWrap: messageSignalWrap,
    errorEl: messageError,
    errorDescribedById: 'contact-message-error',
  };

  const syncCounter = (): void => {
    counter.textContent = formatCharCount(messageInput.value.length);
  };

  syncCounter();

  const onEmailInput = (): void => {
    clearFieldValidationUi(emailValidationUi);
  };

  const onMessageInput = (): void => {
    syncCounter();
    clearFieldValidationUi(messageValidationUi);
  };

  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();

    if (options.isSubmitInProgress?.()) {
      return;
    }

    const emailMessage = getEmailValidationMessage(emailInput);
    if (emailMessage) {
      showFieldValidationFailure(emailValidationUi, emailMessage);
      return;
    }

    clearFieldValidationUi(emailValidationUi);

    const messageValidationMessage = getMessageValidationMessage(messageInput);
    if (messageValidationMessage) {
      showFieldValidationFailure(messageValidationUi, messageValidationMessage);
      return;
    }

    clearFieldValidationUi(messageValidationUi);

    options.onValidSubmit?.({
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      website: websiteInput.value,
    });
  };

  emailInput.addEventListener('input', onEmailInput);
  messageInput.addEventListener('input', onMessageInput);
  form.addEventListener('submit', onSubmit);

  return () => {
    emailInput.removeEventListener('input', onEmailInput);
    messageInput.removeEventListener('input', onMessageInput);
    form.removeEventListener('submit', onSubmit);
  };
}
