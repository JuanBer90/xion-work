import {
  MOBILE_BULLET_GAP_AFTER_TITLE,
  MOBILE_BULLET_LINE_STEP,
  mobileSupportBulletLines,
} from './mobile-layout.ts';
import { seeded } from './seeded.ts';
import type { ArchitectureTone, ResolvedArchitectureNode } from './types.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

function appendParticleCloud<TId extends string>(
  parent: SVGGElement,
  node: ResolvedArchitectureNode<TId>,
): SVGCircleElement[] {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', `work-node__particles tone-${node.tone}`);
  const particles: SVGCircleElement[] = [];
  const { x, y, visual } = node;

  for (let index = 0; index < visual.particleCount; index += 1) {
    const angle = seeded(index, node.id.length) * Math.PI * 2;
    const distance = visual.spread * (0.12 + seeded(index, 19) ** 1.35 * 0.88);
    const radius = 0.35 + seeded(index, 23) * 0.85;
    const opacity = 0.18 + seeded(index, 29) * 0.62;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('class', 'work-node__particle');
    circle.setAttribute('cx', (x + Math.cos(angle) * distance).toFixed(2));
    circle.setAttribute('cy', (y + Math.sin(angle) * distance).toFixed(2));
    circle.setAttribute('r', radius.toFixed(2));
    circle.dataset.opacity = opacity.toFixed(3);
    group.append(circle);
    particles.push(circle);
  }

  parent.append(group);
  return particles;
}

function appendMicroMarks<TId extends string>(parent: SVGGElement, node: ResolvedArchitectureNode<TId>): void {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', `work-node__marks tone-${node.tone}`);
  const ringRadius = node.visual.spread * node.visual.outerRingScale;
  for (let index = 0; index < node.visual.microMarks; index += 1) {
    const angle = seeded(index, 41) * Math.PI * 2;
    const mark = document.createElementNS(SVG_NS, 'circle');
    mark.setAttribute('class', 'work-node__mark');
    mark.setAttribute('cx', (node.x + Math.cos(angle) * ringRadius).toFixed(2));
    mark.setAttribute('cy', (node.y + Math.sin(angle) * ringRadius).toFixed(2));
    mark.setAttribute('r', '0.75');
    group.append(mark);
  }
  parent.append(group);
}

function labelHorizontalBounds<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
  stackedMobileLabels: boolean,
): { left: number; right: number; bottom: number } {
  if (stackedMobileLabels) {
    const blockWidth = 96;
    const bulletCount = mobileSupportBulletLines(node).length;
    const bottom = node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + bulletCount * MOBILE_BULLET_LINE_STEP;
    if (node.labelAnchor === 'middle') {
      return {
        left: node.labelX - blockWidth / 2,
        right: node.labelX + blockWidth / 2,
        bottom,
      };
    }
    if (node.labelAnchor === 'end') {
      return { left: node.labelX - blockWidth, right: node.labelX + 6, bottom };
    }
    return { left: node.labelX - 4, right: node.labelX + blockWidth, bottom };
  }

  const labelWidth = 198;
  const bottom = node.labelY + 26;
  if (node.labelAnchor === 'end') {
    return { left: node.labelX - labelWidth, right: node.labelX + 8, bottom };
  }
  if (node.labelAnchor === 'middle') {
    return { left: node.labelX - labelWidth / 2, right: node.labelX + labelWidth / 2, bottom };
  }
  return { left: node.labelX - 6, right: node.labelX + labelWidth, bottom };
}

function hitAreaForNode<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
  viewWidth: number,
  stackedMobileLabels = false,
): { x: number; y: number; width: number; height: number } {
  const pad = node.visual.spread * 1.08;
  const labelBounds = labelHorizontalBounds(node, stackedMobileLabels);

  const left = Math.max(8, Math.min(node.x - pad, labelBounds.left));
  const top = Math.min(node.y - pad, node.labelY - 14);
  const right = Math.min(viewWidth - 8, Math.max(node.x + pad, labelBounds.right));
  const bottom = Math.max(node.y + pad, labelBounds.bottom);

  return {
    x: left,
    y: top,
    width: Math.max(right - left, pad * 2),
    height: Math.max(bottom - top, pad * 2),
  };
}

function appendNodeLabels<TId extends string>(
  labelGroup: SVGGElement,
  node: ResolvedArchitectureNode<TId>,
  stackedMobileLabels: boolean,
): void {
  const labelAnchor = node.labelAnchor ?? 'start';

  const title = document.createElementNS(SVG_NS, 'text');
  title.setAttribute('class', 'work-label work-label__title');
  title.setAttribute('x', String(node.labelX));
  title.setAttribute('y', String(node.labelY));
  title.setAttribute('text-anchor', labelAnchor);
  title.textContent = node.title;
  labelGroup.append(title);

  if (!stackedMobileLabels) {
    const support = document.createElementNS(SVG_NS, 'text');
    support.setAttribute('class', 'work-label work-label__support');
    support.setAttribute('x', String(node.labelX));
    support.setAttribute('y', String(node.labelY + 18));
    support.setAttribute('text-anchor', labelAnchor);
    support.textContent = node.support;
    labelGroup.append(support);
    return;
  }

  labelGroup.classList.add('work-label-group--mobile-stack');
  const bullets = mobileSupportBulletLines(node);
  for (const [index, line] of bullets.entries()) {
    const bullet = document.createElementNS(SVG_NS, 'text');
    bullet.setAttribute('class', 'work-label work-label__bullet');
    bullet.setAttribute('x', String(node.labelX));
    bullet.setAttribute('y', String(node.labelY + MOBILE_BULLET_GAP_AFTER_TITLE + index * MOBILE_BULLET_LINE_STEP));
    bullet.setAttribute('text-anchor', labelAnchor);
    bullet.textContent = `· ${line}`;
    labelGroup.append(bullet);
  }
}

export function buildArchitectureNode<TId extends string>(
  node: ResolvedArchitectureNode<TId>,
  viewWidth: number,
  stackedMobileLabels = false,
): SVGGElement {
  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'work-node-group');
  group.dataset.workNode = node.id;

  const interactive = document.createElementNS(SVG_NS, 'g');
  interactive.setAttribute('class', 'work-node__interactive');
  interactive.style.setProperty('--work-node-origin-x', `${node.x}px`);
  interactive.style.setProperty('--work-node-origin-y', `${node.y}px`);

  const hit = hitAreaForNode(node, viewWidth, stackedMobileLabels);
  const hitRect = document.createElementNS(SVG_NS, 'rect');
  hitRect.setAttribute('class', 'work-node-hit');
  hitRect.setAttribute('x', hit.x.toFixed(1));
  hitRect.setAttribute('y', hit.y.toFixed(1));
  hitRect.setAttribute('width', hit.width.toFixed(1));
  hitRect.setAttribute('height', hit.height.toFixed(1));
  hitRect.setAttribute('fill', 'transparent');

  const visual = document.createElementNS(SVG_NS, 'g');
  visual.setAttribute('class', 'work-node__visual');
  appendParticleCloud(visual, node);

  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('class', `work-node-ring work-node-ring--inner tone-${node.tone}`);
  innerRing.setAttribute('cx', String(node.x));
  innerRing.setAttribute('cy', String(node.y));
  innerRing.setAttribute('r', String(node.visual.spread * node.visual.innerRingScale));

  const outerRing = document.createElementNS(SVG_NS, 'circle');
  outerRing.setAttribute('class', `work-node-ring work-node-ring--outer tone-${node.tone}`);
  outerRing.setAttribute('cx', String(node.x));
  outerRing.setAttribute('cy', String(node.y));
  outerRing.setAttribute('r', String(node.visual.spread * node.visual.outerRingScale));

  visual.append(innerRing, outerRing);
  appendMicroMarks(visual, node);

  const core = document.createElementNS(SVG_NS, 'circle');
  const hubClass = node.hubCore ? ' work-node__core--hub' : '';
  core.setAttribute('class', `work-node__core tone-${node.tone}${hubClass}`);
  core.setAttribute('cx', String(node.x));
  core.setAttribute('cy', String(node.y));
  core.setAttribute('r', String(node.visual.coreRadius));
  visual.append(core);

  const labelGroup = document.createElementNS(SVG_NS, 'g');
  labelGroup.setAttribute('class', 'work-label-group');
  labelGroup.dataset.workLabel = node.id;

  appendNodeLabels(labelGroup, node, stackedMobileLabels);
  interactive.append(visual, labelGroup);
  group.append(interactive, hitRect);

  return group;
}

export function appendConnectionPathMicrodots(
  parent: SVGGElement,
  path: SVGPathElement,
  tone: ArchitectureTone,
): SVGCircleElement[] {
  const dots: SVGCircleElement[] = [];
  const length = path.getTotalLength();
  const count = 4;
  for (let index = 0; index < count; index += 1) {
    const point = path.getPointAtLength((length * (index + 1)) / (count + 1));
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('class', `work-link-dot tone-${tone}`);
    circle.setAttribute('cx', point.x.toFixed(2));
    circle.setAttribute('cy', point.y.toFixed(2));
    circle.setAttribute('r', '0.75');
    circle.dataset.opacity = String(0.22 + seeded(index, 79) * 0.35);
    parent.append(circle);
    dots.push(circle);
  }
  return dots;
}
