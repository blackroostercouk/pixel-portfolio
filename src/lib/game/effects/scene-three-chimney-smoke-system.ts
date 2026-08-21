import { Container, Sprite, Texture } from "pixi.js";
import type { SceneThreeSmokeControls } from "../types";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type SmokePuff = {
  sprite: Sprite;
  originX: number;
  originY: number;
  driftX: number;
  riseDistance: number;
  durationMs: number;
  delayMs: number;
  elapsedMs: number;
  baseScale: number;
  scaleGrowth: number;
  alpha: number;
};

const SMOKE_PUFF_CONFIGS = [
  {
    originX: 0,
    originY: 0,
    driftX: -26,
    riseDistance: 74,
    durationMs: 3000,
    delayMs: 0,
    baseScale: 0.92,
    scaleGrowth: 0.62,
    alpha: 0.32,
  },
  {
    originX: 10,
    originY: -6,
    driftX: -18,
    riseDistance: 82,
    durationMs: 3360,
    delayMs: 900,
    baseScale: 0.76,
    scaleGrowth: 0.66,
    alpha: 0.27,
  },
  {
    originX: -8,
    originY: 4,
    driftX: -22,
    riseDistance: 68,
    durationMs: 2840,
    delayMs: 1480,
    baseScale: 0.66,
    scaleGrowth: 0.52,
    alpha: 0.22,
  },
  {
    originX: 6,
    originY: 10,
    driftX: -12,
    riseDistance: 60,
    durationMs: 2600,
    delayMs: 1960,
    baseScale: 0.58,
    scaleGrowth: 0.44,
    alpha: 0.18,
  },
] as const;

const DEFAULT_SMOKE_CONTROLS: SceneThreeSmokeControls = {
  x: 1388,
  y: 325,
  scale: 1.18,
  density: 1.42,
  drift: 0.74,
  rise: 1,
  speed: 1,
  zIndex: 14,
};

function createSmokeTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 96;
  canvas.height = 96;

  const context = canvas.getContext("2d");

  if (!context) {
    return Texture.WHITE;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const circles = [
    { x: 44, y: 40, radius: 24, alpha: 0.9 },
    { x: 64, y: 34, radius: 18, alpha: 0.82 },
    { x: 30, y: 56, radius: 17, alpha: 0.76 },
    { x: 58, y: 58, radius: 16, alpha: 0.72 },
  ];

  for (const circle of circles) {
    const gradient = context.createRadialGradient(
      circle.x,
      circle.y,
      1,
      circle.x,
      circle.y,
      circle.radius,
    );

    gradient.addColorStop(0, `rgba(255,255,255,${circle.alpha})`);
    gradient.addColorStop(0.72, `rgba(255,255,255,${circle.alpha * 0.52})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    context.fill();
  }

  return Texture.from(canvas);
}

export class SceneThreeChimneySmokeSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly puffs: SmokePuff[] = [];
  private enabled = true;
  private controls: SceneThreeSmokeControls = { ...DEFAULT_SMOKE_CONTROLS };

  constructor() {
    this.container.label = "scene-three-chimney-smoke-system";
    this.container.zIndex = DEFAULT_SMOKE_CONTROLS.zIndex;
    this.container.sortableChildren = true;

    const texture = createSmokeTexture();

    for (const config of SMOKE_PUFF_CONFIGS) {
      const sprite = new Sprite(texture);

      sprite.anchor.set(0.5, 0.5);
      sprite.tint = 0xcfc9c1;
      sprite.alpha = 0;
      sprite.blendMode = "screen";
      sprite.roundPixels = true;
      sprite.scale.set(config.baseScale);
      sprite.position.set(config.originX, config.originY);

      this.container.addChild(sprite);
      this.puffs.push({
        sprite,
        originX: config.originX,
        originY: config.originY,
        driftX: config.driftX,
        riseDistance: config.riseDistance,
        durationMs: config.durationMs,
        delayMs: config.delayMs,
        elapsedMs: config.delayMs,
        baseScale: config.baseScale,
        scaleGrowth: config.scaleGrowth,
        alpha: config.alpha,
      });
    }
  }

  update(deltaMs: number) {
    if (!this.enabled) {
      return;
    }

    for (const puff of this.puffs) {
      puff.elapsedMs =
        (puff.elapsedMs + deltaMs * this.controls.speed) % (puff.durationMs + puff.delayMs);

      const activeElapsed = puff.elapsedMs - puff.delayMs;

      if (activeElapsed < 0) {
        puff.sprite.alpha = 0;
        puff.sprite.position.set(puff.originX, puff.originY);
        puff.sprite.scale.set(puff.baseScale);
        continue;
      }

      const progress = Math.min(1, activeElapsed / puff.durationMs);
      const eased = 1 - Math.pow(1 - progress, 2);
      const fadeIn = Math.min(1, progress / 0.22);
      const fadeOut = Math.max(0, 1 - Math.max(0, progress - 0.58) / 0.42);
      const alphaWave = fadeIn * fadeOut;

      puff.sprite.x = puff.originX + puff.driftX * this.controls.drift * eased;
      puff.sprite.y = puff.originY - puff.riseDistance * this.controls.rise * eased;
      puff.sprite.alpha = puff.alpha * this.controls.density * alphaWave;

      const nextScale = puff.baseScale + puff.scaleGrowth * eased;
      puff.sprite.scale.set(nextScale);
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.puffs.length = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;
  }

  getControls(): SceneThreeSmokeControls {
    return { ...this.controls };
  }

  setControls(nextControls: Partial<SceneThreeSmokeControls>) {
    this.controls = {
      ...this.controls,
      ...nextControls,
    };

    this.container.position.set(this.controls.x, this.controls.y);
    this.container.scale.set(this.controls.scale);
    this.container.zIndex = this.controls.zIndex;
    this.container.parent?.sortChildren();
  }
}
