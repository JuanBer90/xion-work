function isWorkNodeHit(target: EventTarget | null): SVGRectElement | null {
  if (!(target instanceof Element)) return null;
  const hit = target.closest<SVGRectElement>('.nw-node__hit');
  return hit ?? null;
}

function nodeIdFromHit(hit: SVGRectElement): string | null {
  const id = hit.closest<SVGGElement>('.work-node-group')?.dataset.nodeweaveNode;
  return id ?? null;
}

/** Scale emphasis for Dexstoore architecture items (visual + labels only). */
export function initWorkArchitectureInteraction(
  systemRoot: HTMLElement | null,
): () => void {
  const svg = systemRoot?.querySelector<SVGSVGElement>('.nodeweave');
  if (!svg) return () => undefined;

  const hits = [...svg.querySelectorAll<SVGRectElement>('.nw-node__hit')];
  const interactives = hits.flatMap((hit) => {
    const group = hit.closest<SVGGElement>('.work-node-group');
    return [
      group?.querySelector<SVGGElement>('.nw-node__visual'),
      group?.querySelector<SVGGElement>('.nw-node__labels'),
    ].filter((element): element is SVGGElement => element !== null && element !== undefined);
  });

  let hoveredId: string | null = null;
  let focusedId: string | null = null;

  const sync = (): void => {
    const activeId = hoveredId ?? focusedId;
    for (const interactive of interactives) {
      if (!interactive) continue;
      const id = interactive.closest<SVGGElement>('.work-node-group')?.dataset.nodeweaveNode;
      interactive.classList.toggle('work-node--engaged', id !== undefined && id === activeId);
    }
  };

  const cleanups: (() => void)[] = [];

  for (const hit of hits) {
    const id = nodeIdFromHit(hit);
    if (!id) continue;

    const onPointerEnter = (): void => {
      hoveredId = id;
      sync();
    };

    const onPointerLeave = (event: PointerEvent): void => {
      if (isWorkNodeHit(event.relatedTarget)) return;
      hoveredId = null;
      sync();
    };

    const onFocus = (): void => {
      focusedId = id;
      sync();
    };

    const onBlur = (event: FocusEvent): void => {
      if (isWorkNodeHit(event.relatedTarget)) return;
      focusedId = null;
      sync();
    };

    hit.addEventListener('pointerenter', onPointerEnter);
    hit.addEventListener('pointerleave', onPointerLeave);
    hit.addEventListener('focus', onFocus);
    hit.addEventListener('blur', onBlur);

    cleanups.push(() => {
      hit.removeEventListener('pointerenter', onPointerEnter);
      hit.removeEventListener('pointerleave', onPointerLeave);
      hit.removeEventListener('focus', onFocus);
      hit.removeEventListener('blur', onBlur);
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
    hoveredId = null;
    focusedId = null;
    for (const interactive of interactives) {
      interactive.classList.remove('work-node--engaged');
    }
  };
}
