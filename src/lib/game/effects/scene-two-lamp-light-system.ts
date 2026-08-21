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
  gradient.addColorStop(0.38, innerColor);
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

export class SceneTwoLampLightSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly lights: LightRuntime[] = [];
  private elapsedMs = 0;
  private enabled = true;

  constructor() {
    this.container.label = "scene-two-lamp-light-system";
    this.container.zIndex = 6;
    this.container.sortableChildren = true;

    const ambientTexture = createRadialGradientTexture(
      "rgba(236, 144, 74, 0.42)",
      "rgba(236, 144, 74, 0)",
    );
    const coreTexture = createRadialGradientTexture(
      "rgba(255, 206, 144, 0.94)",
      "rgba(255, 206, 144, 0)",
    );

    const ambientGlow = createLightSprite(ambientTexture, 196, 196);
    ambientGlow.position.set(982, 580);
    ambientGlow.alpha = 0.16;
    ambientGlow.zIndex = 1;

    const coreGlow = createLightSprite(coreTexture, 70, 70);
    coreGlow.position.set(982, 600);
    coreGlow.alpha = 0.28;
    coreGlow.zIndex = 2;

    this.container.addChild(ambientGlow);
    this.container.addChild(coreGlow);

    this.lights.push(
      {
        sprite: ambientGlow,
        baseAlpha: 0.16,
        pulseAlpha: 0.02,
        pulseSpeed: 0.001,
        phase: 0.4,
        baseScaleX: 1,
        baseScaleY: 1,
        scalePulse: 0.012,
      },
      {
        sprite: coreGlow,
        baseAlpha: 0.28,
        pulseAlpha: 0.035,
        pulseSpeed: 0.00145,
        phase: 1.4,
        baseScaleX: 1,
        baseScaleY: 1,
        scalePulse: 0.02,
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
      const scaleWave =
        Math.sin(this.elapsedMs * light.pulseSpeed * 0.85 + light.phase * 1.3) *
        light.scalePulse;

      light.sprite.alpha = light.baseAlpha + pulse * light.pulseAlpha;
      light.sprite.scale.set(
        light.baseScaleX + scaleWave,
        light.baseScaleY + scaleWave * 0.9,
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
