import type { Sprite } from "pixi.js";
import type { AnimationClip } from "./animation-clip";

export class SpriteAnimator {
  private activeClip: AnimationClip | null = null;
  private elapsedInFrame = 0;
  private frameIndex = 0;
  private targetWidth: number;
  private targetHeight: number;

  constructor(private readonly sprite: Sprite) {
    this.targetWidth = sprite.width;
    this.targetHeight = sprite.height;
  }

  setSize(width: number, height: number) {
    this.targetWidth = width;
    this.targetHeight = height;
    this.sprite.width = width;
    this.sprite.height = height;
  }

  play(clip: AnimationClip) {
    if (this.activeClip?.id === clip.id) {
      return;
    }

    this.activeClip = clip;
    this.elapsedInFrame = 0;
    this.frameIndex = 0;
    this.applyCurrentFrame();
  }

  update(deltaMs: number) {
    if (!this.activeClip || this.activeClip.frames.length <= 1) {
      return;
    }

    let remainingDelta = deltaMs;

    while (remainingDelta > 0) {
      const frame = this.activeClip.frames[this.frameIndex];

      if (!frame || !Number.isFinite(frame.durationMs)) {
        return;
      }

      const remainingFrameTime = frame.durationMs - this.elapsedInFrame;

      if (remainingDelta < remainingFrameTime) {
        this.elapsedInFrame += remainingDelta;
        return;
      }

      remainingDelta -= remainingFrameTime;
      this.advanceFrame();
    }
  }

  private advanceFrame() {
    if (!this.activeClip) {
      return;
    }

    const isLastFrame = this.frameIndex >= this.activeClip.frames.length - 1;

    if (isLastFrame) {
      if (!this.activeClip.loop) {
        this.elapsedInFrame = 0;
        return;
      }

      this.frameIndex = 0;
    } else {
      this.frameIndex += 1;
    }

    this.elapsedInFrame = 0;
    this.applyCurrentFrame();
  }

  private applyCurrentFrame() {
    if (!this.activeClip) {
      return;
    }

    const frame = this.activeClip.frames[this.frameIndex];

    if (!frame) {
      return;
    }

    this.sprite.texture = frame.texture;
    this.sprite.width = this.targetWidth;
    this.sprite.height = this.targetHeight;
  }
}
