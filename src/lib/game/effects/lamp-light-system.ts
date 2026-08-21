import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

type LightRuntime = {
  sprite: Sprite;
  baseAlpha: number;
  pulseAlpha: number;
  pulseSpeed: number;
  phase: number;
  baseScaleX: number;
  baseScaleY: number;
  scalePulse: number;
  flickerAmount: number;
};

function createRadialGradientTexture(innerColor: string, outerColor: string) {
  const canvas = document.createElement("canvas");

  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext("2d");

  if (!context) {
    return Texture.WHITE;
  }

  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.45, innerColor);
  gradient.addColorStop(1, outerColor);

  context.clearRect(0, 0, 256, 256);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  return Texture.from(canvas);
}

function createLightSprite(texture: Texture, width: number, height: number) {
  const sprite = new Sprite(texture);

  sprite.anchor.set(0.5, 0.5);
  sprite.width = width;
  sprite.height = height;
  sprite.blendMode = "screen";
  sprite.roundPixels = true;

  return sprite;
}

export class LampLightSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly lights: LightRuntime[] = [];
  private elapsedMs = 0;
  private enabled = true;

  constructor() {
    this.container.label = "lamp-light-system";
    this.container.zIndex = 1;
    this.container.sortableChildren = true;

    const ambientTexture = createRadialGradientTexture(
      "rgba(228, 124, 62, 0.52)",
      "rgba(228, 124, 62, 0)",
    );
    const coreTexture = createRadialGradientTexture(
      "rgba(255, 188, 118, 0.98)",
      "rgba(255, 188, 118, 0)",
    );
    const groundTexture = createRadialGradientTexture(
      "rgba(219, 116, 56, 0.58)",
      "rgba(219, 116, 56, 0)",
    );

    const ambientGlow = createLightSprite(ambientTexture, 360, 430);
    ambientGlow.position.set(170, 560);
    ambientGlow.alpha = 0.12;
    ambientGlow.zIndex = 1;
    ambientGlow.scale.set(1, 1);

    const coreGlow = createLightSprite(coreTexture, 124, 176);
    coreGlow.position.set(169, 432);
    coreGlow.alpha = 0.31;
    coreGlow.zIndex = 2;
    coreGlow.scale.set(1, 1);

    const groundGlow = createLightSprite(groundTexture, 500, 138);
    groundGlow.position.set(246, 932);
    groundGlow.alpha = 0.1;
    groundGlow.zIndex = 1;
    groundGlow.scale.y = 0.62;
    groundGlow.scale.x = 1;

    this.container.addChild(ambientGlow);
    this.container.addChild(groundGlow);
    this.container.addChild(coreGlow);

    this.lights.push(
      {
        sprite: ambientGlow,
        baseAlpha: 0.12,
        pulseAlpha: 0.016,
        pulseSpeed: 0.0011,
        phase: 0.1,
        baseScaleX: 1,
        baseScaleY: 1,
        scalePulse: 0.009,
        flickerAmount: 0.006,
      },
      {
        sprite: coreGlow,
        baseAlpha: 0.31,
        pulseAlpha: 0.038,
        pulseSpeed: 0.0016,
        phase: 1.2,
        baseScaleX: 1,
        baseScaleY: 1,
        scalePulse: 0.016,
        flickerAmount: 0.012,
      },
      {
        sprite: groundGlow,
        baseAlpha: 0.1,
        pulseAlpha: 0.012,
        pulseSpeed: 0.00095,
        phase: 2.1,
        baseScaleX: 1,
        baseScaleY: 0.62,
        scalePulse: 0.01,
        flickerAmount: 0.004,
      },
    );
  }

  update(deltaMs: number) {
    if (!this.enabled) {
      return;
    }

    this.elapsedMs += deltaMs;

    for (const light of this.lights) {
      const pulse = (Math.sin(this.elapsedMs * light.pulseSpeed + light.phase) + 1) * 0.5;
      const flicker =
        Math.sin(this.elapsedMs * 0.013 + light.phase * 2.7) * 0.5 +
        Math.sin(this.elapsedMs * 0.029 + light.phase * 1.3) * 0.5;
      const normalizedFlicker = flicker * light.flickerAmount;
      const scaleWave =
        Math.sin(this.elapsedMs * (light.pulseSpeed * 0.8) + light.phase * 1.6) * light.scalePulse;

      light.sprite.alpha = light.baseAlpha + pulse * light.pulseAlpha + normalizedFlicker;
      light.sprite.scale.set(
        light.baseScaleX + scaleWave,
        light.baseScaleY + scaleWave * 0.72,
      );
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.lights.length = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;
  }
}
