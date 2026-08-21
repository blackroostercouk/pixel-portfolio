import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type ReflectionRuntime = {
  sprite: Sprite;
  baseAlpha: number;
  pulseAlpha: number;
  pulseSpeed: number;
  phase: number;
};

type ReflectionConfig = {
  layer?: "scene" | "overlay";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  alpha: number;
  pulseAlpha: number;
  pulseSpeed: number;
  phase: number;
};

const REFLECTION_CONFIGS: readonly ReflectionConfig[] = [
  {
    x: 744,
    y: 846,
    width: 96,
    height: 92,
    rotation: -0.1,
    alpha: 0.15,
    pulseAlpha: 0.045,
    pulseSpeed: 0.0012,
    phase: 0.1,
  },
  {
    x: 848,
    y: 802,
    width: 56,
    height: 166,
    rotation: -0.08,
    alpha: 0.12,
    pulseAlpha: 0.036,
    pulseSpeed: 0.0015,
    phase: 1.1,
  },
  {
    x: 782,
    y: 900,
    width: 16,
    height: 28,
    rotation: -0.06,
    alpha: 0.18,
    pulseAlpha: 0.05,
    pulseSpeed: 0.0017,
    phase: 2.2,
  },
  {
    x: 1498,
    y: 846,
    width: 30,
    height: 108,
    rotation: -0.04,
    alpha: 0.11,
    pulseAlpha: 0.03,
    pulseSpeed: 0.0011,
    phase: 2.8,
  },
  {
    x: 1619,
    y: 772,
    width: 26,
    height: 126,
    rotation: -0.05,
    alpha: 0.11,
    pulseAlpha: 0.032,
    pulseSpeed: 0.00125,
    phase: 3.4,
  },
];

function createVerticalGradientTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 96;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return Texture.WHITE;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const horizontalGradient = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalGradient.addColorStop(0, "rgba(236, 166, 96, 0)");
  horizontalGradient.addColorStop(0.18, "rgba(236, 166, 96, 0.72)");
  horizontalGradient.addColorStop(0.42, "rgba(236, 166, 96, 0.38)");
  horizontalGradient.addColorStop(0.72, "rgba(236, 166, 96, 0.16)");
  horizontalGradient.addColorStop(1, "rgba(236, 166, 96, 0)");

  context.fillStyle = horizontalGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalCompositeOperation = "destination-in";

  const verticalFade = context.createLinearGradient(0, 0, 0, canvas.height);
  verticalFade.addColorStop(0, "rgba(255, 255, 255, 0)");
  verticalFade.addColorStop(0.16, "rgba(255, 255, 255, 0.85)");
  verticalFade.addColorStop(0.5, "rgba(255, 255, 255, 1)");
  verticalFade.addColorStop(0.84, "rgba(255, 255, 255, 0.82)");
  verticalFade.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.fillStyle = verticalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const cornerMask = context.createRadialGradient(
    canvas.width * 0.34,
    canvas.height * 0.5,
    6,
    canvas.width * 0.34,
    canvas.height * 0.5,
    canvas.height * 0.52,
  );
  cornerMask.addColorStop(0, "rgba(255, 255, 255, 1)");
  cornerMask.addColorStop(0.7, "rgba(255, 255, 255, 0.92)");
  cornerMask.addColorStop(1, "rgba(255, 255, 255, 0)");

  context.fillStyle = cornerMask;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalCompositeOperation = "source-over";

  return Texture.from(canvas);
}

export class LampReflectionSystem implements UpdatableEffect {
  readonly container = new Container();
  readonly overlayContainer = new Container();

  private readonly reflections: ReflectionRuntime[] = [];
  private elapsedMs = 0;
  private enabled = true;

  constructor() {
    this.container.label = "lamp-reflection-system";
    this.container.zIndex = 8;
    this.container.sortableChildren = true;
    this.overlayContainer.label = "lamp-reflection-overlay";
    this.overlayContainer.zIndex = 85;
    this.overlayContainer.sortableChildren = true;

    const texture = createVerticalGradientTexture();

    for (const config of REFLECTION_CONFIGS) {
      const sprite = new Sprite(texture);

      sprite.anchor.set(0.5, 0.5);
      sprite.position.set(config.x, config.y);
      sprite.width = config.width;
      sprite.height = config.height;
      sprite.rotation = config.rotation ?? 0;
      sprite.alpha = config.alpha;
      sprite.blendMode = "screen";
      sprite.roundPixels = true;

      if (config.layer === "overlay") {
        this.overlayContainer.addChild(sprite);
      } else {
        this.container.addChild(sprite);
      }
      this.reflections.push({
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

    for (const reflection of this.reflections) {
      const pulse =
        (Math.sin(this.elapsedMs * reflection.pulseSpeed + reflection.phase) + 1) * 0.5;
      const flicker =
        Math.sin(this.elapsedMs * 0.017 + reflection.phase * 1.8) * 0.5 +
        Math.sin(this.elapsedMs * 0.031 + reflection.phase) * 0.5;

      reflection.sprite.alpha =
        reflection.baseAlpha +
        pulse * reflection.pulseAlpha +
        flicker * 0.009;
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.overlayContainer.destroy({
      children: true,
    });
    this.reflections.length = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;
    this.overlayContainer.visible = enabled;
  }
}
