import {
  BlurFilter,
  Container,
  Sprite,
  Texture,
} from "pixi.js";
import { VIRTUAL_WIDTH } from "../constants";
import type { RainCollisionZone, RainLayerConfig, RainLayerPatch, RainSceneConfig } from "./rain-config";
import { rainSceneOneConfig } from "./rain-scene-configs";

type RainDropRuntime = {
  sprite: Sprite;
  baseAlpha: number;
  speedX: number;
  speedY: number;
  length: number;
};

type SplashRuntime = {
  sprite: Sprite;
  active: boolean;
  elapsedMs: number;
  durationMs: number;
  maxWidth: number;
  layer: "scene" | "overlay";
};

type UpdatableEffect = {
  update: (deltaMs: number) => void;
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createRainDrop(config: RainLayerConfig) {
  const sprite = new Sprite(Texture.WHITE);

  sprite.anchor.set(0.5, 1);
  sprite.tint = config.tint;
  sprite.blendMode = "screen";
  sprite.roundPixels = true;

  return sprite;
}

function createSplashSprite(tint: number) {
  const sprite = new Sprite(Texture.WHITE);

  sprite.anchor.set(0.5, 0.5);
  sprite.tint = tint;
  sprite.blendMode = "screen";
  sprite.visible = false;
  sprite.roundPixels = true;

  return sprite;
}

export class RainSystem implements UpdatableEffect {
  readonly container = new Container();
  readonly overlayContainer = new Container();

  private readonly farLayer = new Container();
  private readonly midLayer = new Container();
  private readonly nearLayer = new Container();
  private readonly splashLayer = new Container();
  private readonly overlaySplashLayer = new Container();
  private readonly drops: RainDropRuntime[] = [];
  private readonly splashes: SplashRuntime[] = [];
  private readonly layerContainers: Container[];
  private readonly layerConfigs: RainLayerConfig[];
  private readonly layerFilters: (BlurFilter | null)[];
  private dynamicCollisionZones: RainCollisionZone[] = [];
  private enabled = true;

  constructor(private readonly config: RainSceneConfig = rainSceneOneConfig) {
    this.container.label = "rain-system";
    this.container.zIndex = 4;
    this.container.sortableChildren = true;
    this.overlayContainer.label = "rain-overlay";
    this.overlayContainer.zIndex = 90;
    this.overlayContainer.sortableChildren = true;

    this.farLayer.zIndex = 1;
    this.midLayer.zIndex = 2;
    this.nearLayer.zIndex = 3;
    this.splashLayer.zIndex = 4;
    this.overlaySplashLayer.zIndex = 1;

    this.container.addChild(this.farLayer);
    this.container.addChild(this.midLayer);
    this.container.addChild(this.nearLayer);
    this.container.addChild(this.splashLayer);
    this.overlayContainer.addChild(this.overlaySplashLayer);

    this.layerContainers = [this.farLayer, this.midLayer, this.nearLayer];
    this.layerConfigs = config.layers.map((l) => ({ ...l }));
    this.layerFilters = this.layerConfigs.map((layerConfig, i) => {
      if (!layerConfig.blur) return null;
      const filter = new BlurFilter({ strength: layerConfig.blur });
      this.layerContainers[i]!.filters = [filter];
      return filter;
    });

    this.initializeDrops();
    this.initializeSplashes();
  }

  updateLayerConfig(layerIndex: number, patch: RainLayerPatch) {
    const layerConfig = this.layerConfigs[layerIndex];
    const container = this.layerContainers[layerIndex];
    if (!layerConfig || !container) return;

    Object.assign(layerConfig, patch);

    if (patch.blur !== undefined) {
      if (patch.blur > 0) {
        let filter = this.layerFilters[layerIndex];
        if (!filter) {
          filter = new BlurFilter({ strength: patch.blur });
          this.layerFilters[layerIndex] = filter;
          container.filters = [filter];
        } else {
          filter.strength = patch.blur;
        }
      } else {
        container.filters = [];
        this.layerFilters[layerIndex] = null;
      }
    }

    const layerDrops = this.drops.filter(
      (d) => Math.abs(d.sprite.width - (layerConfig.width ?? 1)) < 0.5 ||
        this.layerContainers[layerIndex]?.children.includes(d.sprite),
    );

    for (const drop of layerDrops) {
      this.resetDrop(drop, drop.sprite.x, drop.sprite.y, layerConfig);
    }
  }

  update(deltaMs: number) {
    if (!this.enabled) {
      return;
    }

    const deltaSeconds = deltaMs / 1000;

    for (const drop of this.drops) {
      const previousX = drop.sprite.x;
      const previousY = drop.sprite.y;

      drop.sprite.x += drop.speedX * deltaSeconds;
      drop.sprite.y += drop.speedY * deltaSeconds;

      const inLampZone =
        drop.sprite.x >= this.config.lampGlowZone.minX &&
        drop.sprite.x <= this.config.lampGlowZone.maxX &&
        drop.sprite.y >= this.config.lampGlowZone.minY &&
        drop.sprite.y <= this.config.lampGlowZone.maxY;

      drop.sprite.alpha = Math.min(
        drop.baseAlpha + (inLampZone ? this.config.lampGlowZone.alphaBoost : 0),
        0.72,
      );

      const collisionZone = this.findCollisionZone(
        previousX,
        previousY,
        drop.sprite.x,
        drop.sprite.y,
      );

      if (collisionZone) {
        const collisionCenterX = (collisionZone.splashMinX + collisionZone.splashMaxX) * 0.5;
        const spread = Math.max(collisionZone.randomSpread ?? 0, 0);
        const splashX =
          spread > 0
            ? collisionCenterX + randomInRange(-spread, spread)
            : randomInRange(collisionZone.splashMinX, collisionZone.splashMaxX);

        this.spawnSplash(
          splashX,
          collisionZone.splashY,
          collisionZone.splashLayer ?? "scene",
          collisionZone,
        );
        this.resetDrop(drop, undefined, this.config.spawnTop - randomInRange(0, 320));
        continue;
      }

      if (
        drop.sprite.y >= this.config.groundY ||
        drop.sprite.x <= -this.config.despawnPaddingX
      ) {
        this.spawnSplash(drop.sprite.x, this.config.groundY - 3, "scene");
        this.resetDrop(drop, undefined, this.config.spawnTop - randomInRange(0, 320));
      }
    }

    for (const splash of this.splashes) {
      if (!splash.active) {
        continue;
      }

      splash.elapsedMs += deltaMs;
      const progress = Math.min(splash.elapsedMs / splash.durationMs, 1);
      const width = splash.maxWidth * (0.35 + progress * 0.95);

      splash.sprite.width = width;
      splash.sprite.height = Math.max(1, 5 - progress * 2.6);
      splash.sprite.alpha = 0.28 * (1 - progress);

      if (progress >= 1) {
        splash.active = false;
        splash.sprite.visible = false;
      }
    }
  }

  destroy() {
    this.container.destroy({
      children: true,
    });
    this.overlayContainer.destroy({
      children: true,
    });
    this.drops.length = 0;
    this.splashes.length = 0;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.container.visible = enabled;
    this.overlayContainer.visible = enabled;

    if (enabled) {
      return;
    }

    for (const splash of this.splashes) {
      splash.active = false;
      splash.elapsedMs = 0;
      splash.sprite.visible = false;
      splash.sprite.alpha = 0;
    }
  }

  setDynamicCollisionZones(zones: readonly RainCollisionZone[]) {
    this.dynamicCollisionZones = [...zones];
  }

  private initializeDrops() {
    this.layerConfigs.forEach((layerConfig, layerIndex) => {
      const parent = this.layerContainers[layerIndex] ?? this.midLayer;

      for (let index = 0; index < layerConfig.count; index += 1) {
        const sprite = createRainDrop(layerConfig);
        const drop: RainDropRuntime = {
          sprite,
          baseAlpha: layerConfig.minAlpha,
          speedX: layerConfig.minSpeedX,
          speedY: layerConfig.minSpeedY,
          length: layerConfig.minLength,
        };

        this.resetDrop(
          drop,
          randomInRange(-this.config.despawnPaddingX, VIRTUAL_WIDTH + this.config.despawnPaddingX),
          randomInRange(this.config.spawnTop, this.config.groundY),
          layerConfig,
        );
        parent.addChild(sprite);
        this.drops.push(drop);
      }
    });
  }

  private initializeSplashes() {
    for (let index = 0; index < this.config.splashCount; index += 1) {
      for (const layer of ["scene", "overlay"] as const) {
        const sprite = createSplashSprite(this.config.splashTint);
        const splash: SplashRuntime = {
          sprite,
          active: false,
          elapsedMs: 0,
          durationMs: this.config.splashMinDurationMs,
          maxWidth: 16,
          layer,
        };

        if (layer === "overlay") {
          this.overlaySplashLayer.addChild(sprite);
        } else {
          this.splashLayer.addChild(sprite);
        }

        this.splashes.push(splash);
      }
    }
  }

  private resetDrop(
    drop: RainDropRuntime,
    x = randomInRange(
      -this.config.despawnPaddingX,
      VIRTUAL_WIDTH + this.config.despawnPaddingX,
    ),
    y = randomInRange(this.config.spawnTop, this.config.spawnTop - 320),
    layerConfig?: RainLayerConfig,
  ) {
    const config = layerConfig ?? this.resolveLayerConfig(drop.sprite.width);
    const length = randomInRange(config.minLength, config.maxLength);

    drop.baseAlpha = randomInRange(config.minAlpha, config.maxAlpha);
    drop.speedX = randomInRange(config.minSpeedX, config.maxSpeedX);
    drop.speedY = randomInRange(config.minSpeedY, config.maxSpeedY);
    drop.length = length;

    drop.sprite.position.set(x, y);
    drop.sprite.width = config.width;
    drop.sprite.height = length;
    drop.sprite.rotation = -0.16;
    drop.sprite.alpha = drop.baseAlpha;
  }

  private resolveLayerConfig(width: number) {
    return (
      this.config.layers.find((layer) => Math.abs(layer.width - width) < 0.01) ??
      this.config.layers[1]
    );
  }

  private findCollisionZone(
    previousX: number,
    previousY: number,
    nextX: number,
    nextY: number,
  ) {
    const activeZones = [...this.config.collisionZones, ...this.dynamicCollisionZones];

    return activeZones.find((zone) => {
      const enteredHorizontally =
        nextX >= zone.minX &&
        nextX <= zone.maxX;
      const crossedTopEdge =
        previousY < zone.minY &&
        nextY >= zone.minY;
      const isInsideZone =
        nextY >= zone.minY &&
        nextY <= zone.maxY;

      return enteredHorizontally && (crossedTopEdge || isInsideZone);
    });
  }

  private spawnSplash(
    x: number,
    y: number,
    layer: "scene" | "overlay",
    zone?: RainCollisionZone,
  ) {
    const splash = this.splashes.find((entry) => !entry.active && entry.layer === layer);

    if (!splash || x < 70 || x > VIRTUAL_WIDTH - 50) {
      return;
    }

    splash.active = true;
    splash.elapsedMs = 0;
    splash.durationMs = randomInRange(
      zone?.minDurationMs ?? this.config.splashMinDurationMs,
      zone?.maxDurationMs ?? this.config.splashMaxDurationMs,
    );
    splash.maxWidth = randomInRange(
      zone?.minWidth ?? 10,
      zone?.maxWidth ?? 22,
    );
    splash.sprite.position.set(x, y);
    splash.sprite.width = splash.maxWidth * 0.35;
    splash.sprite.height = 4;
    splash.sprite.alpha = 0.24;
    splash.sprite.visible = true;
  }
}
