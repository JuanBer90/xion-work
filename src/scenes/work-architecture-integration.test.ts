import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BEFIT_ARCHITECTURE } from './befit-architecture-config.ts';
import { DEXSTOORE_ARCHITECTURE } from './dexstoore-architecture-config.ts';

describe('work architecture integration configuration', () => {
  it('keeps both scene graphs and their mobile layouts in xion.work', () => {
    assert.equal(DEXSTOORE_ARCHITECTURE.nodes.length, 7);
    assert.equal(DEXSTOORE_ARCHITECTURE.connections.length, 6);
    assert.deepEqual(
      DEXSTOORE_ARCHITECTURE.nodes.find((node) => node.id === 'email')?.mobile,
      { x: 160, y: 470, labelX: 140, labelY: 510, labelAnchor: 'start' },
    );
    assert.deepEqual(
      DEXSTOORE_ARCHITECTURE.nodes.find((node) => node.id === 'whatsapp')?.mobile,
      { x: 290, y: 480, labelX: 304, labelY: 520, labelAnchor: 'start' },
    );
    assert.equal(BEFIT_ARCHITECTURE.nodes.length, 7);
    assert.equal(BEFIT_ARCHITECTURE.connections.length, 6);
  });
});
