import { mountAmbientNetworkLayer } from './ambient-network.ts';
import { appendConnectionPathMicrodots, buildArchitectureNode } from './build-architecture-node.ts';
import { architectureNodeReach } from './node-reach.ts';
import {
  mobileArchitectureContentBottom,
  mobileArchitectureViewHeight,
} from './mobile-layout.ts';
import { architectureNodeById, resolveArchitectureNodes } from './resolve-nodes.ts';
import type { MountedWorkArchitecture, WorkArchitectureDefinition } from './types.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function mountWorkArchitecture<TId extends string>(
  container: HTMLElement,
  definition: WorkArchitectureDefinition<TId>,
): MountedWorkArchitecture {
  const mobileLayout = window.matchMedia(definition.mobileBreakpoint).matches;
  const nodes = resolveArchitectureNodes(definition, mobileLayout);
  const stackedMobileLabels = mobileLayout;
  const { desktop, mobile } = definition.viewport;
  const viewWidth = mobileLayout ? mobile.width : desktop.width;
  const mobileContentMaxY = mobileLayout ? mobileArchitectureContentBottom(nodes) : 0;
  const viewHeight = mobileLayout
    ? mobileArchitectureViewHeight(nodes, mobile.viewBottomPad)
    : desktop.height;
  const ambientHeight = mobileLayout
    ? mobileContentMaxY + mobile.ambientBottomPad
    : desktop.height;

  container.classList.toggle('work-section__system--mobile', mobileLayout);
  if (mobileLayout) {
    container.style.setProperty('--work-system-aspect', String(viewWidth / viewHeight));
  } else {
    container.style.removeProperty('--work-system-aspect');
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'work-system__svg');
  svg.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`);
  svg.setAttribute('role', 'presentation');

  const defs = document.createElementNS(SVG_NS, 'defs');
  svg.append(defs);

  const ambientGroup = document.createElementNS(SVG_NS, 'g');
  ambientGroup.setAttribute('class', 'work-system__ambient');
  const ambientHubs = mobileLayout ? definition.ambient.mobileHubs : definition.ambient.desktopHubs;
  const ambient = mountAmbientNetworkLayer(ambientGroup, viewWidth, ambientHeight, nodes, ambientHubs);

  const pathsGroup = document.createElementNS(SVG_NS, 'g');
  pathsGroup.setAttribute('class', 'work-system__paths');

  const linkDotsGroup = document.createElementNS(SVG_NS, 'g');
  linkDotsGroup.setAttribute('class', 'work-system__link-dots');

  const paths: SVGPathElement[] = [];
  const linkDots: SVGCircleElement[] = [];
  const pathResolver = mobileLayout
    ? definition.connectionPath.mobile
    : definition.connectionPath.desktop;

  for (const connection of definition.connections) {
    const gradientId = `work-link-${connection.id}`;
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    const from = architectureNodeById(nodes, connection.from);
    const to = architectureNodeById(nodes, connection.to);
    gradient.setAttribute('x1', String(from.x));
    gradient.setAttribute('y1', String(from.y));
    gradient.setAttribute('x2', String(to.x));
    gradient.setAttribute('y2', String(to.y));

    const stopA = document.createElementNS(SVG_NS, 'stop');
    stopA.setAttribute('offset', '0%');
    stopA.setAttribute('class', `work-link-stop tone-${connection.fromTone}`);
    stopA.setAttribute('stop-opacity', '0.72');

    const stopB = document.createElementNS(SVG_NS, 'stop');
    stopB.setAttribute('offset', '100%');
    stopB.setAttribute('class', `work-link-stop tone-${connection.toTone}`);
    stopB.setAttribute('stop-opacity', '0.5');

    gradient.append(stopA, stopB);
    defs.append(gradient);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'work-path work-path--link');
    path.setAttribute('stroke', `url(#${gradientId})`);
    path.setAttribute(
      'd',
      pathResolver({
        connection,
        from,
        to,
        nodeReach: architectureNodeReach,
      }),
    );
    path.dataset.workConnection = connection.id;
    pathsGroup.append(path);
    paths.push(path);
    linkDots.push(...appendConnectionPathMicrodots(linkDotsGroup, path, connection.toTone));
  }

  const nodesGroup = document.createElementNS(SVG_NS, 'g');
  nodesGroup.setAttribute('class', 'work-system__nodes');

  const nodeGroups: SVGGElement[] = [];
  for (const node of nodes) {
    const group = buildArchitectureNode(node, viewWidth, stackedMobileLabels);
    nodesGroup.append(group);
    nodeGroups.push(group);
  }

  svg.append(ambientGroup, pathsGroup, linkDotsGroup, nodesGroup);
  container.replaceChildren(svg);

  return {
    svg,
    paths,
    nodeGroups,
    ambientGroup,
    ambientDots: ambient.ambientDots,
    ambientPaths: ambient.ambientPaths,
    linkDots,
  };
}
