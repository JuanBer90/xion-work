import type { SystemPiece } from '@/scenes/xion-geometry';

const SVG_NS = 'http://www.w3.org/2000/svg';

export type MountedPiece = {
  definition: SystemPiece;
  element: SVGGElement;
};

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  name: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

function appendShape(piece: SystemPiece, group: SVGGElement): void {
  const size = piece.size;

  switch (piece.kind) {
    case 'dot': {
      const circle = createSvgElement('circle');
      circle.setAttribute('r', String(size / 2));
      group.append(circle);
      return;
    }
    case 'ring': {
      const circle = createSvgElement('circle');
      circle.setAttribute('r', String(size / 2));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'currentColor');
      circle.setAttribute('stroke-width', String(Math.max(1.25, size * 0.16)));
      group.append(circle);
      return;
    }
    case 'square': {
      const rect = createSvgElement('rect');
      rect.setAttribute('x', String(-size / 2));
      rect.setAttribute('y', String(-size / 2));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(size));
      group.append(rect);
      return;
    }
    case 'line': {
      const rect = createSvgElement('rect');
      rect.setAttribute('x', String(-size / 2));
      rect.setAttribute('y', String(-Math.max(1.2, size * 0.1)));
      rect.setAttribute('width', String(size));
      rect.setAttribute('height', String(Math.max(2.4, size * 0.2)));
      group.append(rect);
      return;
    }
    case 'fragment': {
      const polygon = createSvgElement('polygon');
      polygon.setAttribute(
        'points',
        `${-size / 2},${size / 2} ${size / 2},0 ${-size / 2},${-size / 2}`,
      );
      group.append(polygon);
    }
  }
}

/** Mounts the persistent system pieces once; their transforms are animation-owned. */
export function mountSystemPieces(
  svg: SVGSVGElement,
  pieces: readonly SystemPiece[],
): MountedPiece[] {
  const fragment = document.createDocumentFragment();
  const mounted: MountedPiece[] = [];

  for (const piece of pieces) {
    const group = createSvgElement('g');
    group.classList.add('system-piece', `system-piece--${piece.tone}`);
    group.dataset.pieceId = piece.id;
    group.setAttribute('fill', 'currentColor');
    appendShape(piece, group);
    fragment.append(group);
    mounted.push({ definition: piece, element: group });
  }

  svg.append(fragment);
  return mounted;
}
