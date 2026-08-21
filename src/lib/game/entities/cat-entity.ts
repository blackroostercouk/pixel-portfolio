import { Assets, type Texture } from "pixi.js";
import type { AnimationClip } from "../animation/animation-clip";
import { createSingleFrameClip } from "../animation/animation-clip";
import { catSprite } from "../scene-data";
import type { FutureCatState } from "../types";
import { SceneActorEntity, type ActorAnimationLibrary, type ActorStateDefinitions } from "./scene-actor-entity";

function createCatIdleClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `cat-idle-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 70,
  }));

  return {
    id: "cat-idle",
    frames,
    loop: true,
  };
}

export function createCatEntity(texture: Texture) {
  const entityRef: { current: SceneActorEntity<FutureCatState> | null } = {
    current: null,
  };

  const animations: ActorAnimationLibrary<FutureCatState> = {
    idle: createCatIdleClip(),
    wake: createSingleFrameClip("cat-wake", texture),
    stand: createSingleFrameClip("cat-stand", texture),
    follow: createSingleFrameClip("cat-follow", texture),
  };

  const states: ActorStateDefinitions<FutureCatState> = {
    idle: {
      enter: () => {
        entityRef.current?.animator.play(animations.idle);
      },
    },
    wake: {
      enter: () => {
        entityRef.current?.animator.play(animations.wake);
      },
    },
    stand: {
      enter: () => {
        entityRef.current?.animator.play(animations.stand);
      },
    },
    follow: {
      enter: () => {
        entityRef.current?.animator.play(animations.follow);
      },
    },
  };

  const entity = new SceneActorEntity(catSprite, texture, animations, states);
  entityRef.current = entity;

  return entity;
}
