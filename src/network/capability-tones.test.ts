import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isCapabilityTone } from './capability-tones.ts';

describe('isCapabilityTone', () => {
  it('accepts capability tones only', () => {
    assert.equal(isCapabilityTone('red'), true);
    assert.equal(isCapabilityTone('yellow'), false);
  });
});
