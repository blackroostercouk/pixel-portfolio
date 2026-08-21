import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants";

export type SceneScaleLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function calculateCoverLayout(
  viewportWidth: number,
  viewportHeight: number,
): SceneScaleLayout {
  const scale = Math.max(viewportWidth / VIRTUAL_WIDTH, viewportHeight / VIRTUAL_HEIGHT);
  const worldWidth = VIRTUAL_WIDTH * scale;
  const worldHeight = VIRTUAL_HEIGHT * scale;

  return {
    scale,
    offsetX: (viewportWidth - worldWidth) * 0.5,
    offsetY: (viewportHeight - worldHeight) * 0.5,
  };
}
