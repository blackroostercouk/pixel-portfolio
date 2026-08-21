import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type MoteRuntime = {
  sprite: Sprite;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  baseAlpha: number;
  pulseAlpha: number;
  driftY: number;
};

const MOTE_CONFIGS = [
  {
    centerX: 982,
    centerY: 582,
    radiusX: 22,
    radiusY: 26,
    speed: 0.0012,
    phase: 0.1,
    baseAlpha: 0.15,
    pulseAlpha: 0.08,
    driftY: 5,
    size: 3,
  },
  {
    centerX: 964,
    centerY: 608,
    radiusX: 20,
    radiusY: 22,
    speed: 0.001,
    phase: 1.1,
    baseAlpha: 0.11,
    pulseAlpha: 0.07,
    driftY: 4,
    size: 2,
  },
  {
    centerX: 1004,
    centerY: 598,
    radiusX: 18,
    radiusY: 20,
    speed: 0.0013,
    phase: 2.2,
    baseAlpha: 0.1,
    pulseAlpha: 0.07,
    driftY: 4,
    size: 2,
  },
  {
    centerX: 972,
    centerY: 634,
    radiusX: 24,
    radiusY: 18,
    speed: 0.0009,
    phase: 3.0,
    baseAlpha: 0.08,
    pulseAlpha: 0.06,
    driftY: 5,
    size: 2,
  },
];

function createMoteSprite(size: number) {
  const sprite = new Sprite(Texture.WHITE);

  sprite.anchor.set(0.5, 0.5);
  sprite.width = size;
  sprite.height = size;
  sprite.tint = 0xf7deb0;
  sprite.blendMode = "screen";
  sprite.roundPixels = true;

  return sprite;
}

export class SceneTwoLampMoteSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly motes: MoteRuntime[] = [];
  private elapsedMs = 0;

  constructor() {
    this.container.label = "scene-two-lamp-mote-system";
    this.container.zIndex = 12;
    this.container.sortableChildren = true;

    for (const config of MOTE_CONFIGS) {
      const sprite = createMoteSprite(config.size);

      sprite.position.set(config.centerX, config.centerY);
      sprite.alpha = config.baseAlpha;
      this.container.addChild(sprite);
      this.motes.push({
        sprite,
        centerX: config.centerX,
        centerY: config.centerY,
        radiusX: config.radiusX,
        radiusY: config.radiusY,
        speed: config.speed,
        phase: config.phase,
        baseAlpha: config.baseAlpha,
        pulseAlpha: config.pulseAlpha,
        driftY: config.driftY,
      });
    }
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;

    for (const mote of this.motes) {
      const orbit = this.elapsedMs * mote.speed + mote.phase;
      const waveX = Math.sin(orbit);
      const waveY = Math.cos(orbit * 1.13);
      const shimmer = (Math.sin(orbit * 1.9) + 1) * 0.5;

      mote.sprite.x = mote.centerX + waveX * mote.radiusX;
      mote.sprite.y = mote.centerY + waveY * mote.radiusY - shimmer * mote.driftY;
      mote.sprite.alpha = mote.baseAlpha + shimmer * mote.pulseAlpha;
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.motes.length = 0;
  }
}
