import { Container, Sprite, Texture, type BLEND_MODES, type Sprite as PixiSprite } from "pixi.js";
import type { SceneSpriteParticleConfig } from "../types";

type ParticleRuntime = {
  sprite: Sprite;
  orbitRadiusX: number;
  orbitRadiusY: number;
  speed: number;
  phase: number;
  baseAlpha: number;
  pulseAlpha: number;
  driftY: number;
};

const DEFAULT_PARTICLE_CONFIG: Required<SceneSpriteParticleConfig> = {
  enabled: false,
  count: 5,
  color: "#f7deb0",
  size: 4,
  opacity: 0.18,
  speed: 1,
  drift: 1,
  areaWidth: 56,
  areaHeight: 88,
  blendMode: "screen",
};

function toBlendMode(
  value: Required<SceneSpriteParticleConfig>["blendMode"],
): BLEND_MODES {
  return value;
}

export class CustomLightParticleSystem {
  readonly container = new Container();

  private readonly particles: ParticleRuntime[] = [];
  private elapsedMs = 0;
  private config: Required<SceneSpriteParticleConfig> = DEFAULT_PARTICLE_CONFIG;

  constructor(private readonly anchorSprite: PixiSprite) {
    this.container.label = `${anchorSprite.label ?? "light"}-particles`;
    this.container.zIndex = 14;
    this.container.sortableChildren = true;
    this.container.eventMode = "none";
  }

  update(deltaMs: number) {
    this.elapsedMs += deltaMs;
    this.container.position.copyFrom(this.anchorSprite.position);

    for (const particle of this.particles) {
      const orbit = this.elapsedMs * 0.0012 * this.config.speed * particle.speed + particle.phase;
      const waveX = Math.sin(orbit);
      const waveY = Math.cos(orbit * 1.17);
      const shimmer = (Math.sin(orbit * 1.8) + 1) * 0.5;

      particle.sprite.x = waveX * particle.orbitRadiusX;
      particle.sprite.y =
        -this.config.areaHeight * 0.15 +
        waveY * particle.orbitRadiusY -
        shimmer * particle.driftY * this.config.drift;
      particle.sprite.alpha = Math.max(
        0,
        Math.min(1, particle.baseAlpha + shimmer * particle.pulseAlpha),
      );
    }
  }

  setConfig(nextConfig?: SceneSpriteParticleConfig) {
    this.config = {
      ...DEFAULT_PARTICLE_CONFIG,
      ...nextConfig,
      enabled: nextConfig?.enabled ?? false,
    };

    this.container.visible = this.config.enabled;
    this.rebuildParticles();
  }

  setEnabled(enabled: boolean) {
    this.container.visible = enabled && this.config.enabled;
  }

  destroy() {
    this.container.destroy({ children: true });
    this.particles.length = 0;
  }

  private rebuildParticles() {
    this.container.removeChildren();
    this.particles.length = 0;

    if (!this.config.enabled) {
      return;
    }

    const count = Math.max(1, Math.round(this.config.count));
    for (let index = 0; index < count; index += 1) {
      const sprite = new Sprite(Texture.WHITE);
      const sizeJitter = 0.72 + ((index % 5) / 4) * 0.56;
      const orbitT = count === 1 ? 0.5 : index / Math.max(1, count - 1);
      const orbitRadiusX = Math.max(8, this.config.areaWidth * (0.18 + orbitT * 0.32));
      const orbitRadiusY = Math.max(12, this.config.areaHeight * (0.16 + orbitT * 0.42));
      const speed = 0.8 + (index % 4) * 0.16;
      const phase = index * 0.92;
      const baseAlpha = Math.max(0.02, this.config.opacity * (0.62 + orbitT * 0.28));
      const pulseAlpha = Math.max(0.02, this.config.opacity * 0.42);
      const driftY = 3 + orbitT * 7;

      sprite.anchor.set(0.5, 0.5);
      sprite.width = this.config.size * sizeJitter;
      sprite.height = this.config.size * sizeJitter;
      sprite.tint = Number.parseInt(this.config.color.replace("#", ""), 16);
      sprite.blendMode = toBlendMode(this.config.blendMode);
      sprite.alpha = baseAlpha;
      sprite.roundPixels = true;
      this.container.addChild(sprite);

      this.particles.push({
        sprite,
        orbitRadiusX,
        orbitRadiusY,
        speed,
        phase,
        baseAlpha,
        pulseAlpha,
        driftY,
      });
    }
  }
}
