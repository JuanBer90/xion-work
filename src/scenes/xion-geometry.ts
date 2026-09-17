export type PieceKind = 'dot' | 'line' | 'square' | 'ring' | 'fragment';
export type PieceTone = 'base' | 'muted' | 'accent';

export type SystemPiece = {
  id: string;
  kind: PieceKind;
  size: number;
  tone: PieceTone;
  index: number;
};

export type PiecePose = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
};

export type ResolvedLayouts = {
  dispersed: PiecePose[];
  xion: PiecePose[];
};

export type StageBounds = {
  width: number;
  height: number;
};

type Point = { x: number; y: number };
type GlyphGuide = { points: Point[]; count: number };
type GlyphSlot = Point & { rotate: number };

const PIECE_KINDS: readonly PieceKind[] = [
  'line',
  'dot',
  'square',
  'line',
  'fragment',
  'ring',
  'line',
  'dot',
];

const PIECE_SIZES = [15, 9, 11, 19, 12, 11, 17, 8] as const;

const GLYPH_GUIDES: readonly GlyphGuide[] = [
  // X
  { points: [{ x: 0, y: 0 }, { x: 112, y: 176 }], count: 7 },
  { points: [{ x: 112, y: 0 }, { x: 0, y: 176 }], count: 7 },
  // I
  { points: [{ x: 154, y: 0 }, { x: 224, y: 0 }], count: 2 },
  { points: [{ x: 189, y: 0 }, { x: 189, y: 176 }], count: 6 },
  { points: [{ x: 154, y: 176 }, { x: 224, y: 176 }], count: 2 },
  // O
  {
    points: [
      { x: 283, y: 20 },
      { x: 306, y: 0 },
      { x: 393, y: 0 },
      { x: 416, y: 20 },
      { x: 416, y: 156 },
      { x: 393, y: 176 },
      { x: 306, y: 176 },
      { x: 283, y: 156 },
      { x: 283, y: 20 },
    ],
    count: 18,
  },
  // N
  { points: [{ x: 478, y: 176 }, { x: 478, y: 0 }], count: 7 },
  { points: [{ x: 478, y: 0 }, { x: 598, y: 176 }], count: 8 },
  { points: [{ x: 598, y: 176 }, { x: 598, y: 0 }], count: 7 },
];

const SCATTER_A_ZONES: readonly Point[] = [
  { x: 0.12, y: 0.24 },
  { x: 0.33, y: 0.16 },
  { x: 0.61, y: 0.2 },
  { x: 0.84, y: 0.3 },
  { x: 0.18, y: 0.73 },
  { x: 0.46, y: 0.83 },
  { x: 0.72, y: 0.72 },
  { x: 0.89, y: 0.84 },
];

function fractional(value: number): number {
  return value - Math.floor(value);
}

function seeded(index: number, salt: number): number {
  return fractional(Math.sin(index * 91.173 + salt * 37.719) * 43758.5453);
}

function slotAlongPolyline(points: readonly Point[], amount: number): GlyphSlot[] {
  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segmentLengths.push(length);
    totalLength += length;
  }

  return Array.from({ length: amount }, (_, slotIndex) => {
    let remaining = ((slotIndex + 0.5) / amount) * totalLength;
    let segmentIndex = 0;

    while (
      segmentIndex < segmentLengths.length - 1 &&
      remaining > segmentLengths[segmentIndex]
    ) {
      remaining -= segmentLengths[segmentIndex];
      segmentIndex += 1;
    }

    const start = points[segmentIndex];
    const end = points[segmentIndex + 1];
    const length = segmentLengths[segmentIndex] || 1;
    const progress = remaining / length;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;

    return {
      x: start.x + deltaX * progress,
      y: start.y + deltaY * progress,
      rotate: (Math.atan2(deltaY, deltaX) * 180) / Math.PI,
    };
  });
}

const GLYPH_SLOTS = GLYPH_GUIDES.flatMap((guide) =>
  slotAlongPolyline(guide.points, guide.count),
);

export const SYSTEM_PIECES: readonly SystemPiece[] = GLYPH_SLOTS.map(
  (_, index) => ({
    id: `piece-${String(index + 1).padStart(2, '0')}`,
    kind: PIECE_KINDS[index % PIECE_KINDS.length],
    size: PIECE_SIZES[index % PIECE_SIZES.length],
    tone: index % 11 === 0 ? 'accent' : index % 5 === 0 ? 'muted' : 'base',
    index,
  }),
);

function resolveScatterPose(
  piece: SystemPiece,
  bounds: StageBounds,
  zones: readonly Point[],
  variant: number,
): PiecePose {
  const zone = zones[(piece.index * 5 + variant * 3) % zones.length];
  const spreadX = (seeded(piece.index, variant + 1) - 0.5) * 0.19;
  const spreadY = (seeded(piece.index, variant + 11) - 0.5) * 0.2;

  return {
    x: (zone.x + spreadX) * bounds.width,
    y: (zone.y + spreadY) * bounds.height,
    rotate: Math.round(seeded(piece.index, variant + 23) * 8) * 45,
    scale: 0.88 + seeded(piece.index, variant + 31) * 0.26,
    opacity: piece.tone === 'muted' ? 0.52 : 0.9,
  };
}

function resolveGlyphPose(slot: GlyphSlot, bounds: StageBounds): PiecePose {
  const glyphWidth = 598;
  const glyphHeight = 176;
  const availableWidth = Math.max(1, bounds.width - Math.min(80, bounds.width * 0.16));
  const availableHeight = Math.max(1, bounds.height * 0.32);
  const scale = Math.min(availableWidth / glyphWidth, availableHeight / glyphHeight);
  const offsetX = (bounds.width - glyphWidth * scale) / 2;
  const offsetY = (bounds.height - glyphHeight * scale) / 2;

  return {
    x: offsetX + slot.x * scale,
    y: offsetY + slot.y * scale,
    rotate: slot.rotate,
    scale: Math.min(1.16, Math.max(0.55, scale)),
    opacity: 1,
  };
}

/** Resolves the reusable entrance and assembled states for the current stage. */
export function resolveLayouts(bounds: StageBounds): ResolvedLayouts {
  return {
    dispersed: SYSTEM_PIECES.map((piece) =>
      resolveScatterPose(piece, bounds, SCATTER_A_ZONES, 0),
    ),
    xion: GLYPH_SLOTS.map((slot) => resolveGlyphPose(slot, bounds)),
  };
}
