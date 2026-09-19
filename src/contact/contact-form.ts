import { applyContactLinks } from '@/contact/contact-links';

export type ContactFormPayload = {
  email: string;
  message: string;
};

export type ContactSubmitState =
  | 'idle'
  | 'validating'
  | 'securing'
  | 'transmitting'
  | 'delivered'
  | 'error';

const MESSAGE_MAX_LENGTH = 1000;

function formatCharCount(length: number): string {
  return `${length}/${MESSAGE_MAX_LENGTH}`;
}

export function initContactForm(root: HTMLElement | null): () => void {
  if (!root) return () => undefined;

  applyContactLinks(root);

  const form = root.querySelector<HTMLFormElement>('[data-contact-form]');
  const emailInput = root.querySelector<HTMLInputElement>('input[name="email"]');
  const messageInput = root.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
  const counter = root.querySelector<HTMLElement>('[data-contact-char-count]');
  const statusRoot = root.querySelector<HTMLElement>('[data-contact-status]');

  if (!form || !emailInput || !messageInput || !counter) {
    return () => undefined;
  }

  const syncCounter = (): void => {
    counter.textContent = formatCharCount(messageInput.value.length);
  };

  syncCounter();

  const onMessageInput = (): void => {
    syncCounter();
  };

  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }
    statusRoot?.setAttribute('data-contact-submit-state', 'idle');
  };

  messageInput.addEventListener('input', onMessageInput);
  form.addEventListener('submit', onSubmit);

  return () => {
    messageInput.removeEventListener('input', onMessageInput);
    form.removeEventListener('submit', onSubmit);
  };
}
