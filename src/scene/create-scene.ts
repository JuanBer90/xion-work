import type { CreateSceneOptions, Scene } from './types.ts';

/** Builds a scene handle; lifecycle hooks may run many times across scroll visits. */
export function createScene({ id, element, lifecycle = {} }: CreateSceneOptions): Scene {
  return {
    id,
    element,
    lifecycle,
  };
}
