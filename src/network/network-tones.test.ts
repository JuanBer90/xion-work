import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INACTIVE_TONE_EMPHASIS,
  isCapabilityTone,
  toneEmphasisMultiplier,
} from './network-tones.ts';

describe('toneEmphasisMultiplier', () => {
  it('returns 1 when no capability is active', () => {
    assert.equal(toneEmphasisMultiplier('orange', null), 1);
  });

  it('keeps the active capability tone at full emphasis', () => {
    assert.equal(toneEmphasisMultiplier('green', 'green'), 1);
  });

  it('dims non-active tones including yellow', () => {
    assert.equal(toneEmphasisMultiplier('yellow', 'green'), INACTIVE_TONE_EMPHASIS);
    assert.equal(toneEmphasisMultiplier('red', 'green'), INACTIVE_TONE_EMPHASIS);
  });
});

describe('isCapabilityTone', () => {
  it('accepts capability tones only', () => {
    assert.equal(isCapabilityTone('red'), true);
    assert.equal(isCapabilityTone('yellow'), false);
  });
});
