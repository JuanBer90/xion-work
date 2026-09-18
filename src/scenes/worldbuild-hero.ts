import { WorldBuild } from 'worldbuild-js';

const XION_PARTICLE_COLORS = [
  '#FF4057',
  '#FF9D32',
  '#F6D83B',
  '#22E68A',
  '#1EDBE5',
  '#35A7FF',
  '#9A4DFF',
];

export type WorldbuildHeroController = {
  destroy(): void;
};

/** Mounts the published WorldBuild globe into the hero visual area. */
export function mountWorldbuildHero(container: HTMLElement): WorldbuildHeroController {
  const world = new WorldBuild({
    container,
    globe: { radius: 1, hideBackside: false },
    camera: { latitude: 0, longitude: 0 },
    particles: {
      size: 1,
      color: '#b8d4f0',
      colors: XION_PARTICLE_COLORS,
      colorDistribution: 'continent',
      opacity: 0.85,
    },
    build: {
      enabled: true,
      direction: 'south-to-north',
      duration: 2_000,
      randomness: 0.15,
    },
    rotation: {
      enabled: true,
      duration: 22_000,
    },
  });

  const resizeObserver = new ResizeObserver(() => world.resize());
  resizeObserver.observe(container);
  world.resize();

  return {
    destroy: () => {
      resizeObserver.disconnect();
      world.destroy();
    },
  };
}
