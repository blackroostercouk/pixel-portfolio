import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type ShadowRuntime = {
  sprite: Sprite;
  baseAlpha: number;
  pulseAlpha: number;
  pulseSpeed: number;
  phase: number;
};

type ShadowConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  alpha: number;
  pulseAlpha: number;
  pulseSpeed: number;
  phase: number;
};

const SHADOW_CONFIGS: readonly ShadowConfig[] = [
  {
    x: 798,
    y: 942,
    width: 248,
    height: 68,
    rotation: 0.08,
    skewX: -0.42,
    alpha: 0.42,
    pulseAlpha: 0.026,
    pulseSpeed: 0.001,
    phase: 0.2,
  },
  {
    x: 944,
    y: 956,
    width: 188,
    height: 58,
    rotation: 0.12,
    skewX: -0.36,
    alpha: 0.34,
    pulseAlpha: 0.022,
    pulseSpeed: 0.0012,
    phase: 1.1,
  },
  {
    x: 1642,
    y: 892,
    width: 164,
    height: 44,
    rotation: 0.15,
    skewX: -0.28,
    alpha: 0.3,
    pulseAlpha: 0.02,
    pulseSpeed: 0.0011,
    phase: 2.3,
  },
];

function createShadowTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 128;

  const context = canvas.getContext("2d");

  if (!context) {
    return Texture.WHITE;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createRadialGradient(
    canvas.width * 0.38,
    canvas.height * 0.52,
    10,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.46,
  );
  gradient.addColorStop(0, "rgba(10, 7, 5, 1)");
  gradient.addColorStop(0.38, "rgba(10, 7, 5, 0.8)");
  gradient.addColorStop(0.76, "rgba(10, 7, 5, 0.32)");
  gradient.addColorStop(1, "rgba(16, 11, 8, 0)");

  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.44,
    canvas.height * 0.27,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  return Texture.from(canvas);
}

export class LampShadowSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly shadows: ShadowRuntime[] = [];
  private elapsedMs = 0;
  private enabled = true;

  constructor() {
    this.container.label = "lamp-shadow-system";
    this.container.zIndex = 6;
    this.container.sortableChildren = true;

    const texture = createShadowTexture();

    for (const config of SHADOW_CONFIGS) {
      const sprite = new Sprite(texture);

      sprite.anchor.set(0.5, 0.5);
      sprite.position.set(config.x, config.y);
      sprite.width = config.width;
      sprite.height = config.height;
      sprite.rotation = config.rotation ?? 0;
      sprite.skew.set(config.skewX ?? 0, config.skewY ?? 0);
      sprite.alpha = config.alpha;
      sprite.blendMode = "normal";
      sprite.roundPixels = true;

      this.container.addChild(sprite);
      this.shadows.push({
        sprite,
        baseAlpha: config.alpha,
        pulseAlpha: config.pulseAlpha,
        pulseSpeed: config.pulseSpeed,
        phase: config.phase,
      });
    }
  }

  update(deltaMs: number) {
    if (!this.enabled) {
      return;
    }

    this.elapsedMs += deltaMs;

    for (const shadow of this.shadows) {
      const pulse =
        (Math.sin(this.elapsedMs * shadow.pulseSpeed + shadow.phase) + 1) * 0.5;

      shadow.sprite.alpha = shadow.baseAlpha + pulse * shadow.pulseAlpha;
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.shadows.length = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;
  }
}
