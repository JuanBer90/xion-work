export type ContactSubmitPayload = {
  email: string;
  message: string;
  website: string;
};

export type ContactSubmitResult = 'success' | 'failure' | 'aborted';

const CONTACT_API_URL = 'https://api.xion.work/contact';

function isOkResponseBody(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'ok' in data &&
    (data as { ok: unknown }).ok === true
  );
}

export async function postContactMessage(
  payload: ContactSubmitPayload,
  signal?: AbortSignal,
): Promise<ContactSubmitResult> {
  let response: Response;

  try {
    response = await fetch(CONTACT_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    if (signal?.aborted) {
      return 'aborted';
    }
    return 'failure';
  }

  if (!response.ok) {
    return 'failure';
  }

  try {
    const data: unknown = await response.json();
    return isOkResponseBody(data) ? 'success' : 'failure';
  } catch {
    return 'failure';
  }
}
