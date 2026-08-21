import { BlurFilter, Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

const STAR_SPAWN_MIN_MS = 9000;
const STAR_SPAWN_MAX_MS = 18000;
const STAR_DURATION_MIN_MS = 850;
const STAR_DURATION_MAX_MS = 1350;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export class ShootingStarSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly star = new Sprite(Texture.WHITE);
  private readonly trail = new Sprite(Texture.WHITE);

  private isActive = false;
  private elapsedMs = 0;
  private durationMs = 0;
  private waitMs = randomBetween(STAR_SPAWN_MIN_MS, STAR_SPAWN_MAX_MS);
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;

  constructor() {
    this.container.label = "shooting-star-system";
    this.container.zIndex = 18;
    this.container.sortableChildren = true;

    this.trail.anchor.set(1, 0.5);
    this.trail.width = 58;
    this.trail.height = 2;
    this.trail.tint = 0xe6f2ff;
    this.trail.alpha = 0;
    this.trail.blendMode = "screen";
    this.trail.roundPixels = true;
    this.trail.filters = [new BlurFilter({ strength: 2, quality: 1, kernelSize: 5 })];

    this.star.anchor.set(0.5, 0.5);
    this.star.width = 4;
    this.star.height = 4;
    this.star.tint = 0xfff7da;
    this.star.alpha = 0;
    this.star.blendMode = "screen";
    this.star.roundPixels = true;

    this.container.addChild(this.trail);
    this.container.addChild(this.star);
  }

  update(deltaMs: number) {
    if (!this.isActive) {
      this.waitMs -= deltaMs;

      if (this.waitMs <= 0) {
        this.activate();
      }

      return;
    }

    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / this.durationMs);
    const eased = 1 - (1 - progress) * (1 - progress);
    const x = this.startX + (this.endX - this.startX) * eased;
    const y = this.startY + (this.endY - this.startY) * eased;
    const fade = progress < 0.15 ? progress / 0.15 : progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1;

    this.star.position.set(x, y);
    this.star.alpha = 0.95 * fade;

    this.trail.position.set(x - 1, y + 1);
    this.trail.rotation = Math.atan2(this.endY - this.startY, this.endX - this.startX);
    this.trail.alpha = 0.35 * fade;
    this.trail.width = 44 + (1 - progress) * 18;

    if (progress >= 1) {
      this.deactivate();
    }
  }

  destroy() {
    this.container.destroy({ children: true });
  }

  private activate() {
    this.isActive = true;
    this.elapsedMs = 0;
    this.durationMs = randomBetween(STAR_DURATION_MIN_MS, STAR_DURATION_MAX_MS);
    this.startX = randomBetween(1240, 1760);
    this.startY = randomBetween(70, 210);
    this.endX = this.startX - randomBetween(180, 320);
    this.endY = this.startY + randomBetween(90, 170);
    this.star.position.set(this.startX, this.startY);
    this.trail.position.set(this.startX, this.startY);
    this.star.alpha = 0;
    this.trail.alpha = 0;
  }

  private deactivate() {
    this.isActive = false;
    this.star.alpha = 0;
    this.trail.alpha = 0;
    this.waitMs = randomBetween(STAR_SPAWN_MIN_MS, STAR_SPAWN_MAX_MS);
  }
}
