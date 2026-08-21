import { Container, Sprite, Texture } from "pixi.js";

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

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
    canvas.height * 0.5,
    10,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.46,
  );
  gradient.addColorStop(0, "rgba(8, 6, 5, 1)");
  gradient.addColorStop(0.44, "rgba(8, 6, 5, 0.76)");
  gradient.addColorStop(0.8, "rgba(8, 6, 5, 0.24)");
  gradient.addColorStop(1, "rgba(8, 6, 5, 0)");

  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.44,
    canvas.height * 0.24,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();

  return Texture.from(canvas);
}

export class WalkInCharacterShadowSystem implements UpdatableEffect {
  readonly container = new Container();

  private readonly shadow: Sprite;
  private elapsedMs = 0;

  constructor() {
    this.container.label = "walk-in-character-shadow-system";
    this.container.zIndex = 7;

    this.shadow = new Sprite(createShadowTexture());
    this.shadow.anchor.set(0.5, 0.5);
    this.shadow.width = 176;
    this.shadow.height = 22;
    this.shadow.rotation = 0.05;
    this.shadow.skew.set(-0.34, 0);
    this.shadow.alpha = 0.28;
    this.shadow.roundPixels = true;

    this.container.addChild(this.shadow);
  }

  setTarget(characterX: number, groundY: number, characterWidth: number) {
    this.shadow.position.set(characterX, groundY - 10);
    this.shadow.width = Math.max(128, characterWidth * 1.18);
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;

    const pulse = (Math.sin(this.elapsedMs * 0.0012 + 0.8) + 1) * 0.5;
    this.shadow.alpha = 0.27 + pulse * 0.028;
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
  }
}
