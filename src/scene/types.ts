export type SceneLifecycle = {
  /** Called when this scene becomes the sole active viewport scene. */
  enter?: () => void;
  /** Called when another scene becomes active (or on teardown). */
  leave?: () => void;
  /** Optional manual reset; not invoked automatically by the scroll controller. */
  reset?: () => void;
  /** Called once when the scene is unregistered / app tears down. */
  destroy?: () => void;
};

export type Scene = {
  id: string;
  element: HTMLElement;
  lifecycle: SceneLifecycle;
};

export type CreateSceneOptions = {
  id: string;
  element: HTMLElement;
  lifecycle?: SceneLifecycle;
};
