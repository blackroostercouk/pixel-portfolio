import { Sprite, type Texture } from "pixi.js";
import { createSingleFrameClip, type AnimationClip } from "../animation/animation-clip";
import { SpriteAnimator } from "../animation/sprite-animator";
import { StateMachine, type StateDefinition } from "../state-machines/state-machine";
import type { GroundActorConfig } from "../types";

export type ActorAnimationLibrary<TState extends string> = Record<TState, AnimationClip>;
export type ActorStateDefinitions<TState extends string> = Record<TState, StateDefinition<TState>>;

export class SceneActorEntity<TState extends string> {
  readonly sprite: Sprite;
  readonly animator: SpriteAnimator;
  readonly stateMachine: StateMachine<TState>;

  constructor(
    private readonly config: GroundActorConfig<TState>,
    texture: Texture,
    animationLibrary: ActorAnimationLibrary<TState>,
    stateDefinitions: ActorStateDefinitions<TState>,
  ) {
    this.sprite = new Sprite(texture);
    this.sprite.label = config.id;
    this.sprite.anchor.set(config.anchorX, config.anchorY);
    this.sprite.position.set(config.x, config.y);
    this.sprite.width = config.width;
    this.sprite.height = config.height;
    if (config.scaleX !== undefined || config.scaleY !== undefined) {
      this.sprite.scale.set(config.scaleX ?? 1, config.scaleY ?? 1);
    }

    this.animator = new SpriteAnimator(this.sprite);
    this.stateMachine = new StateMachine(config.initialState, stateDefinitions);

    const initialClip =
      animationLibrary[config.initialState] ?? createSingleFrameClip(config.initialState, texture);
    this.animator.play(initialClip);
  }

  get id() {
    return this.config.id;
  }

  get state() {
    return this.stateMachine.state;
  }

  transitionTo(nextState: TState) {
    this.stateMachine.transitionTo(nextState);
  }

  update(deltaMs: number) {
    this.stateMachine.update(deltaMs);
    this.animator.update(deltaMs);
  }
}
