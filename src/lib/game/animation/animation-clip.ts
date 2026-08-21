import type { Texture } from "pixi.js";

export type AnimationFrame = {
  texture: Texture;
  durationMs: number;
};

export type AnimationClip = {
  id: string;
  frames: AnimationFrame[];
  loop: boolean;
};

export function createSingleFrameClip(id: string, texture: Texture): AnimationClip {
  return {
    id,
    loop: true,
    frames: [
      {
        texture,
        durationMs: Number.POSITIVE_INFINITY,
      },
    ],
  };
}
