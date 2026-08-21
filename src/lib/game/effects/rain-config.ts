export type RainLayerConfig = {
  count: number;
  width: number;
  minLength: number;
  maxLength: number;
  minSpeedY: number;
  maxSpeedY: number;
  minSpeedX: number;
  maxSpeedX: number;
  minAlpha: number;
  maxAlpha: number;
  tint: number;
  blur?: number;
};

export type RainLayerPatch = Partial<Omit<RainLayerConfig, "count" | "tint">>;

export type RainCollisionZone = {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  splashMinX: number;
  splashMaxX: number;
  splashY: number;
  splashLayer?: "scene" | "overlay";
  randomSpread?: number;
  minWidth?: number;
  maxWidth?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
};

export type RainSceneConfig = {
  collisionZones: readonly RainCollisionZone[];
  spawnTop: number;
  despawnPaddingX: number;
  groundY: number;
  splashCount: number;
  splashTint: number;
  splashMinDurationMs: number;
  splashMaxDurationMs: number;
  lampGlowZone: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    alphaBoost: number;
  };
  layers: readonly RainLayerConfig[];
};
