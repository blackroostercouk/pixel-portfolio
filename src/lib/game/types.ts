export type SceneLayerName =
  | "backgroundLayer"
  | "environmentLayer"
  | "actorLayer"
  | "effectsLayer";

export type SceneAssetId =
  | "background"
  | "backgroundScene2"
  | "backgroundScene3"
  | "backgroundScene4"
  | "scene3Smoke"
  | "lamp"
  | "bench"
  | "bag"
  | "raincot"
  | "knottyAds"
  | "knottyBasket1"
  | "knottyBasket2"
  | "knottyCenterSign"
  | "knottyChair"
  | "knottyEmptyBasket"
  | "knottyFlower"
  | "knottyFlower2"
  | "knottyFlower3"
  | "knottyFlower4"
  | "knottyGift"
  | "knottyGimmick"
  | "knottyKnitts"
  | "knottyLeadder"
  | "knottyLamp"
  | "knottyModel"
  | "knottyPaint"
  | "scene2Character"
  | "knottyShopSign"
  | "knottyStone"
  | "knottyTable"
  | "knottyWhole"
  | "shopifyHouse"
  | "shopifyBoxes"
  | "shopifyFlowerBasket"
  | "shopifyUmbrella"
  | "webflowMainPart"
  | "webflowCube1"
  | "webflowCube2"
  | "webflowDecor1"
  | "webflowDecor2"
  | "webflowDecor3"
  | "webflowDetailBar"
  | "webflowGrass"
  | "webflowHerb"
  | "webflowMaskot"
  | "webflowSandik"
  | "webflowSign"
  | "webflowStoneDecor1"
  | "webflowStoneDecor5"
  | "webflowStoneDecorMashroom"
  | "webflowStoneDecorMini"
  | "webflowStoneGate"
  | "webflowStoneLedder1"
  | "webflowStoneMini2"
  | "webflowTable"
  | "webflowFirstProp"
  | "webflowSignProp"
  | "webflowDirection"
  | "trash"
  | "coffee"
  | "sign"
  | "ufo"
  | "logo"
  | "bubble"
  | "bubbleMouse"
  | "infoIcon"
  | "collectIcon"
  | "character"
  | "cat";

export type SceneActionIconKind = "info" | "collect";

export type SceneInfoModalStageId = "normal" | "updated" | "final";

export type SceneInfoModalStageConfig = {
  title?: string;
  text?: string;
  imageSrc?: string;
  secondImageSrc?: string;
  windowMode?: boolean;
  bodyText?: string;
  portraitSrc?: string;
  inputEnabled?: boolean;
  inputPlaceholder?: string;
  correctAnswer?: string;
};

export type SceneInfoModalConfig = {
  normal?: SceneInfoModalStageConfig;
  updated?: SceneInfoModalStageConfig;
  final?: SceneInfoModalStageConfig;
};

export type SceneDrawerConfig = {
  title?: string;
  bodyHtml?: string;
};

export type SceneSpriteRainSplashSegmentConfig = {
  enabled?: boolean;
  zoneLeft?: number;
  zoneRight?: number;
  zoneTop?: number;
  zoneBottom?: number;
  splashLeft?: number;
  splashRight?: number;
  splashY?: number;
  splashLayer?: "scene" | "overlay";
  randomSpread?: number;
  widthRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  minWidthRatio?: number;
  maxWidthRatio?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
};

export type SceneSpriteRainSplashConfig = SceneSpriteRainSplashSegmentConfig;

export type SceneSpriteVisualConfig = {
  brightness?: number;
  contrast?: number;
};

export type SceneSpriteLightConfig = {
  color?: string;
  intensity?: number;
  blendMode?: "normal" | "screen" | "add" | "lighten";
};

export type SceneSpriteParticleConfig = {
  enabled?: boolean;
  count?: number;
  color?: string;
  size?: number;
  opacity?: number;
  speed?: number;
  drift?: number;
  areaWidth?: number;
  areaHeight?: number;
  blendMode?: "normal" | "screen" | "add" | "lighten";
};

export type SceneSpriteInteractionConfig = {
  clickable?: boolean;
  hasInfo?: boolean;
  hasDrawer?: boolean;
  collectible?: boolean;
  bubbleMessage?: string;
  infoTitle?: string;
  infoDescription?: string;
  infoImageSrc?: string;
  infoModal?: SceneInfoModalConfig;
  drawer?: SceneDrawerConfig;
};

export type SceneActionIconConfig = {
  id: string;
  kind: SceneActionIconKind;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  message: string;
  inventoryItemId?: string;
  consumeObjectOnUse?: boolean;
};

export type SceneObjectActionMenuConfig = {
  objectId: string;
  originX: number;
  originY: number;
  onInteractMessage?: string;
  actions: SceneActionIconConfig[];
};

export type InventoryItemDefinition = {
  id: string;
  label: string;
  iconSrc: string;
};

export type FutureCharacterState =
  | "idle"
  | "closeLaptop"
  | "standUp"
  | "walk"
  | "exit";

export type FutureCatState = "idle" | "wake" | "stand" | "follow";

export type SceneRuntimeSpriteType =
  | "character"
  | "character-idle"
  | "cat"
  | "light"
  | "wind-turbine";

export type SceneSpriteConfig = {
  id: string;
  assetId: string;
  src?: string;
  runtimeType?: SceneRuntimeSpriteType;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  alpha?: number;
  blendMode?: "normal" | "screen" | "add" | "lighten";
  ignoreSceneScale?: boolean;
  layer?: SceneLayerName;
  zIndex?: number;
  interaction?: SceneSpriteInteractionConfig;
  rainSplash?: SceneSpriteRainSplashConfig;
  rainSplashSegments?: SceneSpriteRainSplashSegmentConfig[];
  visuals?: SceneSpriteVisualConfig;
  light?: SceneSpriteLightConfig;
  particles?: SceneSpriteParticleConfig;
};

export type LayoutSpriteSnapshot = {
  id: string;
  assetId: string;
  src?: string;
  runtimeType?: SceneRuntimeSpriteType;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  alpha?: number;
  blendMode?: "normal" | "screen" | "add" | "lighten";
  ignoreSceneScale?: boolean;
  layer?: SceneLayerName;
  zIndex?: number;
  interaction?: SceneSpriteInteractionConfig;
  rainSplash?: SceneSpriteRainSplashConfig;
  rainSplashSegments?: SceneSpriteRainSplashSegmentConfig[];
  visuals?: SceneSpriteVisualConfig;
  light?: SceneSpriteLightConfig;
  particles?: SceneSpriteParticleConfig;
};

export type SceneThreeSmokeControls = {
  x: number;
  y: number;
  scale: number;
  density: number;
  drift: number;
  rise: number;
  speed: number;
  zIndex: number;
};

export type GroundActorConfig<TState extends string> = SceneSpriteConfig & {
  kind: "groundActor";
  initialState: TState;
  futureStates: readonly TState[];
};
