import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { POST_INTRO_ROTATION_DELAY_MS, resolveNetworkIntroOptions } from '../config/network-intro.ts';
import { runPostIntroEffects } from './network-intro-lifecycle.ts';

describe('runPostIntroEffects', () => {
  it('always applies final state when rotation is disabled', () => {
    const resolved = resolveNetworkIntroOptions({ rotation: { enabled: false } });
    let finalStateApplied = false;
    let depthStarted = false;

    const result = runPostIntroEffects(resolved, false, {
      setFinalState: () => {
        finalStateApplied = true;
      },
      startNetworkDepth: () => {
        depthStarted = true;
        return () => undefined;
      },
      setTimeout: ((handler: TimerHandler) => {
        if (typeof handler === 'function') handler();
        return 1 as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
    });

    assert.equal(finalStateApplied, true);
    assert.equal(depthStarted, false);
    assert.equal(result.ambientDelay, 0);
    assert.equal(result.stopAmbientDepth, null);
  });

  it('does not start rotation after build when disabled', () => {
    const resolved = resolveNetworkIntroOptions({ rotation: { enabled: false } });
    const timeouts: TimerHandler[] = [];

    runPostIntroEffects(resolved, false, {
      setFinalState: () => undefined,
      startNetworkDepth: () => () => undefined,
      setTimeout: ((handler: TimerHandler) => {
        timeouts.push(handler);
        return timeouts.length as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
    });

    assert.equal(timeouts.length, 0);
  });

  it('preserves enabled post-intro delay and depth start', () => {
    const resolved = resolveNetworkIntroOptions();
    let delayMs = -1;
    let depthStarted = false;

    runPostIntroEffects(resolved, false, {
      setFinalState: () => undefined,
      startNetworkDepth: () => {
        depthStarted = true;
        return () => undefined;
      },
      setTimeout: ((handler: TimerHandler, ms?: number) => {
        delayMs = ms ?? -1;
        if (typeof handler === 'function') handler();
        return 1 as ReturnType<typeof setTimeout>;
      }) as typeof setTimeout,
    });

    assert.equal(delayMs, POST_INTRO_ROTATION_DELAY_MS);
    assert.equal(depthStarted, true);
  });
});
