import { Assets, type Texture } from "pixi.js";
import type { AnimationClip } from "../animation/animation-clip";
import { createSingleFrameClip } from "../animation/animation-clip";
import { characterSprite } from "../scene-data";
import type { FutureCharacterState } from "../types";
import { SceneActorEntity, type ActorAnimationLibrary, type ActorStateDefinitions } from "./scene-actor-entity";

type CharacterEntityOptions = {
  onCloseLaptopComplete?: () => void;
};

function createCharacterIdleClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(4, "0");

    return `character-idle-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 70,
  }));

  return {
    id: "character-idle",
    frames,
    loop: true,
  };
}

function createCharacterCloseLaptopClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `character-close-laptop-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 55,
  }));

  return {
    id: "character-close-laptop",
    frames,
    loop: false,
  };
}

export function createCharacterEntity(
  texture: Texture,
  options: CharacterEntityOptions = {},
) {
  const entityRef: { current: SceneActorEntity<FutureCharacterState> | null } = {
    current: null,
  };

  const animations: ActorAnimationLibrary<FutureCharacterState> = {
    idle: createCharacterIdleClip(),
    closeLaptop: createCharacterCloseLaptopClip(),
    standUp: createSingleFrameClip("character-stand-up", texture),
    walk: createSingleFrameClip("character-walk", texture),
    exit: createSingleFrameClip("character-exit", texture),
  };

  const states: ActorStateDefinitions<FutureCharacterState> = {
    idle: {
      enter: (previousState) => {
        entityRef.current?.animator.play(animations.idle);

        if (previousState === "closeLaptop") {
          options.onCloseLaptopComplete?.();
        }
      },
    },
    closeLaptop: {
      enter: () => {
        entityRef.current?.animator.play(animations.closeLaptop);
      },
      durationMs: animations.closeLaptop.frames.length * 55,
      nextState: "idle",
    },
    standUp: {
      enter: () => {
        entityRef.current?.animator.play(animations.standUp);
      },
    },
    walk: {
      enter: () => {
        entityRef.current?.animator.play(animations.walk);
      },
    },
    exit: {
      enter: () => {
        entityRef.current?.animator.play(animations.exit);
      },
    },
  };

  const entity = new SceneActorEntity(characterSprite, texture, animations, states);
  entityRef.current = entity;

  return entity;
}
