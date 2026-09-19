import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import { postContactMessage } from './contact-api.ts';

const payload = {
  email: 'you@example.com',
  message: 'Hello',
  website: '',
};

describe('postContactMessage', () => {
  it('returns success for 2xx with ok true', async () => {
    mock.method(
      globalThis,
      'fetch',
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await postContactMessage(payload);
    assert.equal(result, 'success');

    mock.restoreAll();
  });

  it('returns failure for non-2xx', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));

    const result = await postContactMessage(payload);
    assert.equal(result, 'failure');

    mock.restoreAll();
  });

  it('returns failure for 2xx without ok true', async () => {
    mock.method(
      globalThis,
      'fetch',
      async () => new Response(JSON.stringify({ ok: false }), { status: 200 }),
    );

    const result = await postContactMessage(payload);
    assert.equal(result, 'failure');

    mock.restoreAll();
  });

  it('returns aborted when the signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    mock.method(globalThis, 'fetch', async () => {
      throw new DOMException('Aborted', 'AbortError');
    });

    const result = await postContactMessage(payload, controller.signal);
    assert.equal(result, 'aborted');

    mock.restoreAll();
  });
});
