import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type PuddleRuntime = {
  base: Sprite;
  highlight: Sprite;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  driftAmplitude: number;
  phase: number;
  speed: number;
  baseAlpha: number;
  shimmerAlpha: number;
};

const PUDDLE_CONFIGS = [
  {
    centerX: 246,
    centerY: 938,
    width: 126,
    height: 15,
    driftAmplitude: 18,
    phase: 0.2,
    speed: 0.0013,
    baseAlpha: 0.08,
    shimmerAlpha: 0.14,
  },
  {
    centerX: 420,
    centerY: 944,
    width: 172,
    height: 18,
    driftAmplitude: 22,
    phase: 1.4,
    speed: 0.0011,
    baseAlpha: 0.07,
    shimmerAlpha: 0.12,
  },
  {
    centerX: 952,
    centerY: 972,
    width: 244,
    height: 16,
    driftAmplitude: 30,
    phase: 2.1,
    speed: 0.00095,
    baseAlpha: 0.05,
    shimmerAlpha: 0.1,
  },
];

function createPuddleBase(width: number, height: number) {
  const sprite = new Sprite(Texture.WHITE);

  sprite.anchor.set(0.5, 0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.tint = 0xd6c598;
  sprite.alpha = 0.06;
  sprite.blendMode = "screen";
  sprite.roundPixels = true;

  return sprite;
}

function createPuddleHighlight(width: number, height: number) {
  const sprite = new Sprite(Texture.WHITE);

  sprite.anchor.set(0.5, 0.5);
  sprite.width = width * 0.26;
  sprite.height = Math.max(2, height * 0.42);
  sprite.tint = 0xf6e7bd;
  sprite.alpha = 0.12;
  sprite.blendMode = "screen";
  sprite.roundPixels = true;

  return sprite;
}

export class PuddleShimmerSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly puddles: PuddleRuntime[] = [];
  private elapsedMs = 0;

  constructor() {
    this.container.label = "puddle-shimmer-system";
    this.container.zIndex = 2;
    this.container.sortableChildren = true;

    for (const config of PUDDLE_CONFIGS) {
      const base = createPuddleBase(config.width, config.height);
      const highlight = createPuddleHighlight(config.width, config.height);

      base.position.set(config.centerX, config.centerY);
      highlight.position.set(config.centerX, config.centerY);
      base.zIndex = 1;
      highlight.zIndex = 2;

      this.container.addChild(base);
      this.container.addChild(highlight);
      this.puddles.push({
        base,
        highlight,
        centerX: config.centerX,
        centerY: config.centerY,
        width: config.width,
        height: config.height,
        driftAmplitude: config.driftAmplitude,
        phase: config.phase,
        speed: config.speed,
        baseAlpha: config.baseAlpha,
        shimmerAlpha: config.shimmerAlpha,
      });
    }
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;

    for (const puddle of this.puddles) {
      const wave = Math.sin(this.elapsedMs * puddle.speed + puddle.phase);
      const waveSecondary = Math.sin(this.elapsedMs * puddle.speed * 0.7 + puddle.phase * 1.9);
      const drift = wave * puddle.driftAmplitude;

      puddle.base.alpha = puddle.baseAlpha + (waveSecondary * 0.5 + 0.5) * 0.035;
      puddle.highlight.alpha = puddle.shimmerAlpha + (wave * 0.5 + 0.5) * 0.08;
      puddle.highlight.x = puddle.centerX + drift;
      puddle.highlight.y = puddle.centerY - (waveSecondary * 0.5 + 0.5) * 0.8;
      puddle.highlight.width = puddle.width * (0.18 + (waveSecondary * 0.5 + 0.5) * 0.16);
      puddle.highlight.height = Math.max(2, puddle.height * 0.38);
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.puddles.length = 0;
  }
}
