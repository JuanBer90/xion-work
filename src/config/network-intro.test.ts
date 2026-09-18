import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_NETWORK_INTRO_OPTIONS,
  resolveNetworkIntroOptions,
  shouldScheduleNetworkRotation,
} from './network-intro.ts';

describe('resolveNetworkIntroOptions', () => {
  it('defaults rotation to enabled', () => {
    const resolved = resolveNetworkIntroOptions();
    assert.equal(resolved.rotation.enabled, DEFAULT_NETWORK_INTRO_OPTIONS.rotation.enabled);
    assert.equal(resolved.rotation.enabled, true);
  });

  it('honors explicit rotation disabled', () => {
    const resolved = resolveNetworkIntroOptions({ rotation: { enabled: false } });
    assert.equal(resolved.rotation.enabled, false);
  });
});

describe('shouldScheduleNetworkRotation', () => {
  it('schedules when rotation is enabled and motion is allowed', () => {
    const resolved = resolveNetworkIntroOptions();
    assert.equal(shouldScheduleNetworkRotation(resolved, false), true);
  });

  it('does not schedule when rotation is disabled', () => {
    const resolved = resolveNetworkIntroOptions({ rotation: { enabled: false } });
    assert.equal(shouldScheduleNetworkRotation(resolved, false), false);
  });

  it('does not schedule under reduced motion', () => {
    const resolved = resolveNetworkIntroOptions();
    assert.equal(shouldScheduleNetworkRotation(resolved, true), false);
  });
});
