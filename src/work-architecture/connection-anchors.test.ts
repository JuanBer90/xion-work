import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { architectureConnectionAnchors } from './connection-anchors.ts';
import type { ResolvedArchitectureNode } from './types.ts';

function mockNode(
  x: number,
  y: number,
  spread = 20,
): ResolvedArchitectureNode<'test'> {
  return {
    id: 'test',
    tone: 'cyan',
    title: 'Test',
    support: 'A · B',
    x,
    y,
    labelX: x,
    labelY: y,
    visual: {
      weight: 'md',
      coreRadius: 3,
      spread,
      particleCount: 40,
      innerRingScale: 0.5,
      outerRingScale: 0.9,
      microMarks: 4,
    },
  };
}

const reach = (node: ResolvedArchitectureNode<'test'>): number => node.visual.spread * 0.42;

describe('architectureConnectionAnchors', () => {
  it('uses bottom-to-top halo exits when target is below source', () => {
    const from = mockNode(100, 80);
    const to = mockNode(100, 200);
    const anchors = architectureConnectionAnchors(from, to, reach);

    assert.equal(anchors.startX, 100);
    assert.equal(anchors.startY, 80 + reach(from));
    assert.equal(anchors.endX, 100);
    assert.equal(anchors.endY, 200 - reach(to));
  });

  it('uses top-to-bottom halo exits when target is above source', () => {
    const from = mockNode(100, 200);
    const to = mockNode(100, 80);
    const anchors = architectureConnectionAnchors(from, to, reach);

    assert.equal(anchors.startY, 200 - reach(from));
    assert.equal(anchors.endY, 80 + reach(to));
  });

  it('anchors on horizontal axis when dx dominates', () => {
    const from = mockNode(50, 100);
    const to = mockNode(220, 105);
    const anchors = architectureConnectionAnchors(from, to, reach);

    assert.equal(anchors.startX, 50 + reach(from));
    assert.equal(anchors.startY, 100);
    assert.equal(anchors.endX, 220 - reach(to));
    assert.equal(anchors.endY, 105);
  });

  it('anchors left when target is to the left', () => {
    const from = mockNode(200, 100);
    const to = mockNode(40, 98);
    const anchors = architectureConnectionAnchors(from, to, reach);

    assert.equal(anchors.startX, 200 - reach(from));
    assert.equal(anchors.endX, 40 + reach(to));
  });
});
