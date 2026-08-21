import {
  Application,
  Assets,
  ColorMatrixFilter,
  Container,
  FederatedPointerEvent,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from "pixi.js";
import { gsap } from "gsap";
import type { AnimationClip } from "./animation/animation-clip";
import { SpriteAnimator } from "./animation/sprite-animator";
import {
  MAX_RENDER_RESOLUTION,
  SCENE_SPRITE_OFFSET_Y,
  SCENE_SPRITE_SCALE,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
} from "./constants";
import { sceneAssetsManifest } from "./asset-manifest";
import {
  backgroundSprite,
  effectSprites,
  environmentSprites,
  interactiveObjectIds,
  interactiveObjectMessages,
  objectActionMenus,
  sceneFourEnvironmentSprites,
  sceneThreeEnvironmentSprites,
  sceneTwoEnvironmentSprites,
} from "./scene-data";
import { calculateCoverLayout } from "./scene-scale";
import type {
  LayoutSpriteSnapshot,
  SceneActionIconKind,
  SceneLayerName,
  SceneObjectActionMenuConfig,
  SceneSpriteLightConfig,
  SceneSpriteParticleConfig,
  SceneSpriteRainSplashConfig,
  SceneSpriteRainSplashSegmentConfig,
  SceneSpriteVisualConfig,
  SceneThreeSmokeControls,
  SceneSpriteConfig,
} from "./types";
import { createCharacterEntity } from "./entities/character-entity";
import { createCatEntity } from "./entities/cat-entity";
import type { SceneActorEntity } from "./entities/scene-actor-entity";
import { DitherFilter } from "./filters/dither-filter";
import characterBubbleMessages from "./content/character-bubble-messages.json";
import type { GameState } from "./core/game-state";
import { RainSystem } from "./effects/rain-system";
import { PuddleShimmerSystem } from "./effects/puddle-shimmer-system";
import { LampLightSystem } from "./effects/lamp-light-system";
import { LampReflectionSystem } from "./effects/lamp-reflection-system";
import { LampMoteSystem } from "./effects/lamp-mote-system";
import { LampShadowSystem } from "./effects/lamp-shadow-system";
import { CustomLightParticleSystem } from "./effects/custom-light-particle-system";
import type { SceneId } from "./core/game-state";
import { sceneRegistry } from "./scene-registry";
import { SceneTwoLampLightSystem } from "./effects/scene-two-lamp-light-system";
import { SceneTwoLampMoteSystem } from "./effects/scene-two-lamp-mote-system";
import { WalkInCharacterShadowSystem } from "./effects/walk-in-character-shadow-system";
import { LampLightSystem as SceneThreeLampLightSystem } from "./effects/lamp-light-system";
import { LampMoteSystem as SceneThreeLampMoteSystem } from "./effects/lamp-mote-system";
import { SceneThreeChimneySmokeSystem } from "./effects/scene-three-chimney-smoke-system";
import { ShootingStarSystem } from "./effects/shooting-star-system";
import type { RainCollisionZone } from "./effects/rain-config";

type SceneLayers = Record<SceneLayerName, Container>;
type PixelSceneControllerOptions = {
  sceneId?: SceneId;
  runtimeSceneBackgroundSrc?: string | null;
  runtimeSceneSprites?: SceneSpriteConfig[];
  onLoadProgress?: (progress: number) => void;
  onCharacterClick?: () => void;
  onActionMenuAction?: (objectId: string, actionId: string) => void;
  onInteractiveHoverChange?: (isHovering: boolean) => void;
  onLayoutStateChange?: (state: {
    isEnabled: boolean;
    selectedSpriteId: string | null;
    sprites: LayoutSpriteSnapshot[];
  }) => void;
  getInteractionOverrideMessage?: (objectId: string) => string | null;
  getDefaultObjectActionId?: (objectId: string) => string | null;
};
type UpdatableActor = {
  update: (deltaMs: number) => void;
};

type BubbleState = "hidden" | "fadingIn" | "visible" | "fadingOut";
type BubbleTarget = "character" | "cat";
type BubbleRuntime = {
  sprite: Sprite | null;
  text: Text | null;
  state: BubbleState;
  visibleElapsedMs: number;
  typingElapsedMs: number;
  displayedTextLength: number;
  baseX: number;
  baseY: number;
  baseWidth: number;
  baseHeight: number;
  followSprite: Sprite | null;
  offsetX: number;
  offsetY: number;
};
type ActionMenuIconRuntime = {
  sprite: Sprite;
  menuId: string;
  objectId: string;
  actionId: string;
  kind: SceneActionIconKind;
  message: string;
  inventoryItemId?: string;
  consumeObjectOnUse?: boolean;
  width: number;
  height: number;
  originOffsetX: number;
  originOffsetY: number;
  targetOffsetX: number;
  targetOffsetY: number;
};
type ActionMenuIconsState = "hidden" | "revealing" | "visible";
type LayoutEditableSpriteRuntime = {
  sprite: Sprite;
  config: SceneSpriteConfig;
  animator?: SpriteAnimator;
  colorFilter?: ColorMatrixFilter;
};
type CustomLightRuntime = {
  sprite: Sprite;
  elapsedMs: number;
  baseWidth: number;
  baseHeight: number;
  particleSystem?: CustomLightParticleSystem;
};
type SceneWalkInCharacterRuntime = {
  sprite: Sprite;
  animator: SpriteAnimator;
  idleClip: AnimationClip;
  walkClip: AnimationClip;
  idleWidth: number;
  walkWidth: number;
  walkHeight: number;
  height: number;
  idleX: number;
  entryStartX: number;
  walkSpeed: number;
  hasEntered: boolean;
  skipEntryWalk: boolean;
  targetX: number | null;
  inputDirection: -1 | 0 | 1;
};
type ActiveLayoutDrag = {
  spriteId: string;
  parent: Container;
  offsetX: number;
  offsetY: number;
};
type ActionMenuAnchor = {
  menuId: string;
  x: number;
  y: number;
};

const BUBBLE_FADE_IN_MS = 600;
const BUBBLE_VISIBLE_MS = 4200;
const BUBBLE_FADE_OUT_MS = 450;
const ACTION_MENU_ICONS_REVEAL_MS = 320;
const ACTION_MENU_ICON_HOVER_SCALE = 1.08;
const CHARACTER_TYPING_STEP_MS = 42;
const DEFAULT_CHARACTER_BUBBLE_MESSAGE = "Hi, my name is Kenan.";
const SIGN_HINT_MESSAGE = "You'll need to solve the puzzle before moving on to the next stage.";
const CHARACTER_BUBBLE_MIN_WIDTH = 250;
const CHARACTER_BUBBLE_MAX_WIDTH = 390;
const CHARACTER_BUBBLE_MIN_HEIGHT = 92;
const CHARACTER_BUBBLE_MAX_HEIGHT = 186;
const CHARACTER_BUBBLE_HORIZONTAL_PADDING = 48;
const CHARACTER_BUBBLE_VERTICAL_PADDING = 38;
const CHARACTER_BUBBLE_TAIL_ALLOWANCE = 18;
const CHARACTER_BUBBLE_TEXT_Y_RATIO = 0.54;
const WALKABLE_GROUND_MIN_Y = 930;
const WALKABLE_GROUND_MAX_Y = 1078;
const WALKABLE_GROUND_MIN_X = 80;
const WALKABLE_GROUND_MAX_X = 1840;
const SCENE_TWO_WALK_TRIM_TRAILING_FRAMES = 2;

const SCENE_ASSET_FALLBACKS = {
  "scene-4": [
    { alias: "backgroundScene4", src: "/assets/scene/webflow/webflow_bg.webp" },
    { alias: "webflowMainPart", src: "/assets/scene/webflow/main_part.webp" },
  ],
} as const;

function createTrashMouseIdleClip(): AnimationClip {
  const frames = Array.from({ length: 14 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `trash-mouse-idle-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 85,
  }));

  return {
    id: "trash-mouse-idle",
    frames,
    loop: true,
  };
}

function createSceneCatIdleClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `cat-idle-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 70,
  }));

  return {
    id: "scene-cat-idle",
    frames,
    loop: true,
  };
}

function createCharacterIdleClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(4, "0");

    return `character-idle-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 80,
  }));

  return {
    id: "character-idle",
    frames,
    loop: true,
  };
}

function createWindTurbineClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `wind-turbine-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 90,
  }));

  return {
    id: "wind-turbine-idle",
    frames,
    loop: true,
  };
}

function createUfoIdleClip(): AnimationClip {
  const frames = Array.from({ length: 21 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `ufo-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 140,
  }));

  return {
    id: "ufo-idle",
    frames,
    loop: true,
  };
}

function createSceneTwoCharacterClip(): AnimationClip {
  const frames = Array.from({ length: 36 }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `scene2-character-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 90,
  }));

  return {
    id: "scene2-character-idle",
    frames,
    loop: true,
  };
}

function createSceneTwoCharacterWalkClip(): AnimationClip {
  const totalFrames = 34;
  const activeFrames = Math.max(1, totalFrames - SCENE_TWO_WALK_TRIM_TRAILING_FRAMES);
  const frames = Array.from({ length: activeFrames }, (_, index) => {
    const frameNumber = index.toString().padStart(3, "0");

    return `scene2-character-walk-${frameNumber}`;
  }).map((assetId) => ({
    texture: Assets.get(assetId) as Texture,
    durationMs: 72,
  }));

  return {
    id: "scene2-character-walk",
    frames,
    loop: true,
  };
}

function getRenderResolution() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, MAX_RENDER_RESOLUTION);
}

export class PixelSceneController {
  constructor(private readonly options: PixelSceneControllerOptions = {}) {}

  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private world: Container | null = null;
  private layers: SceneLayers | null = null;
  private scaledSceneRoot: Container | null = null;
  private environmentSpritesById = new Map<string, Sprite>();
  private layoutEditableSpritesById = new Map<string, LayoutEditableSpriteRuntime>();
  private collectedLayoutSpriteIds = new Set<string>();
  private customLightsById = new Map<string, CustomLightRuntime>();
  private actorEntities: UpdatableActor[] = [];
  private environmentAnimators: UpdatableActor[] = [];
  private effectSystems: UpdatableActor[] = [];
  private characterEntity: SceneActorEntity<"idle" | "closeLaptop" | "standUp" | "walk" | "exit"> | null = null;
  private rainSystem: RainSystem | null = null;
  private puddleShimmerSystem: PuddleShimmerSystem | null = null;
  private lampLightSystem: LampLightSystem | null = null;
  private lampReflectionSystem: LampReflectionSystem | null = null;
  private lampMoteSystem: LampMoteSystem | null = null;
  private lampShadowSystem: LampShadowSystem | null = null;
  private sceneTwoLampLightSystem: SceneTwoLampLightSystem | null = null;
  private sceneTwoLampMoteSystem: SceneTwoLampMoteSystem | null = null;
  private actorCharacterShadowSystem: WalkInCharacterShadowSystem | null = null;
  private walkInCharacterShadowSystem: WalkInCharacterShadowSystem | null = null;
  private sceneThreeLampLightSystem: SceneThreeLampLightSystem | null = null;
  private sceneThreeLampMoteSystem: SceneThreeLampMoteSystem | null = null;
  private sceneThreeChimneySmokeSystem: SceneThreeChimneySmokeSystem | null = null;
  private shootingStarSystem: ShootingStarSystem | null = null;
  private sceneWalkInCharacterRuntime: SceneWalkInCharacterRuntime | null = null;
  private lightingEnabled = true;
  private ditherFilter: DitherFilter | null = null;
  private characterBubble: BubbleRuntime = {
    sprite: null,
    text: null,
    state: "hidden",
    visibleElapsedMs: 0,
    typingElapsedMs: 0,
    displayedTextLength: 0,
    baseX: 960,
    baseY: 580,
    baseWidth: 250,
    baseHeight: 92,
    followSprite: null,
    offsetX: 48,
    offsetY: -18,
  };
  private catBubble: BubbleRuntime = {
    sprite: null,
    text: null,
    state: "hidden",
    visibleElapsedMs: 0,
    typingElapsedMs: 0,
    displayedTextLength: 0,
    baseX: 1098,
    baseY: 833,
    baseWidth: 104,
    baseHeight: 107,
    followSprite: null,
    offsetX: -16,
    offsetY: -10,
  };
  private characterBubbleMessageIndex = 0;
  private activeCharacterBubbleMessageIndex = 0;
  private activeCharacterBubbleOverrideMessage: string | null = null;
  private actionMenuIcons: ActionMenuIconRuntime[] = [];
  private actionMenuIconsState: ActionMenuIconsState = "hidden";
  private actionMenuIconsElapsedMs = 0;
  private actionMenuAnchor: ActionMenuAnchor | null = null;
  private actionMenuConfigByObjectId = new Map(
    objectActionMenus.map((config) => [config.objectId, config]),
  );
  private assetsLoaded = false;
  private isLayoutModeEnabled = false;
  private selectedLayoutSpriteId: string | null = null;
  private activeLayoutDrag: ActiveLayoutDrag | null = null;
  private readonly sceneId: SceneId = this.options.sceneId ?? "scene-1";

  private hasTextureAsset(assetId: string) {
    try {
      return Boolean(Assets.get(assetId));
    } catch {
      return false;
    }
  }

  async mount(host: HTMLElement) {
    this.host = host;

    const app = new Application();
    await app.init({
      antialias: false,
      autoDensity: true,
      backgroundAlpha: 0,
      preference: "webgl",
      resolution: getRenderResolution(),
      width: Math.max(host.clientWidth, 1),
      height: Math.max(host.clientHeight, 1),
    });

    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.display = "block";
    app.canvas.setAttribute("aria-hidden", "true");

    if (this.host !== host) {
      app.destroy(true, {
        children: true,
      });
      return;
    }

    this.app = app;
    host.appendChild(app.canvas);

    await this.loadAssets();
    this.buildScene();
    this.resize(host.clientWidth, host.clientHeight);
    this.startLoop();
  }

  resize(width: number, height: number) {
    if (!this.app || !this.world) {
      return;
    }

    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);

    this.app.renderer.resize(safeWidth, safeHeight);
    this.ditherFilter?.setResolution(safeWidth, safeHeight);

    const layout = calculateCoverLayout(safeWidth, safeHeight);
    this.world.scale.set(layout.scale);
    this.world.position.set(layout.offsetX, layout.offsetY);
  }

  syncSceneState(state: Pick<GameState, "hiddenSceneObjectIds" | "flags">) {
    for (const [objectId, sprite] of this.environmentSpritesById.entries()) {
      if (objectId === "trash") {
        const isAnimatedTrashVisible = state.flags.trash_mouse_awake === true;
        sprite.visible = !isAnimatedTrashVisible;
        sprite.eventMode = sprite.visible && this.isSpriteClickableForGameplay(objectId) ? "static" : "none";
        continue;
      }

      if (objectId === "trash-active") {
        const isAnimatedTrashVisible = state.flags.trash_mouse_awake === true;
        sprite.visible = isAnimatedTrashVisible;
        sprite.eventMode = "none";
        continue;
      }

      const isHidden = state.hiddenSceneObjectIds.includes(objectId);
      sprite.visible = !isHidden;
      sprite.eventMode = sprite.visible && this.isSpriteClickableForGameplay(objectId) ? "static" : "none";
    }
  }

  destroy() {
    if (this.app?.ticker) {
      this.app.ticker.remove(this.handleTick);
    }

    this.actorEntities = [];
    this.environmentAnimators = [];
    this.effectSystems = [];
    this.characterEntity = null;
    this.rainSystem?.destroy();
    this.rainSystem = null;
    this.puddleShimmerSystem?.destroy();
    this.puddleShimmerSystem = null;
    this.lampLightSystem?.destroy();
    this.lampLightSystem = null;
    this.lampReflectionSystem?.destroy();
    this.lampReflectionSystem = null;
    this.lampMoteSystem?.destroy();
    this.lampMoteSystem = null;
    this.lampShadowSystem?.destroy();
    this.lampShadowSystem = null;
    this.sceneTwoLampLightSystem?.destroy();
    this.sceneTwoLampLightSystem = null;
    this.sceneTwoLampMoteSystem?.destroy();
    this.sceneTwoLampMoteSystem = null;
    this.actorCharacterShadowSystem?.destroy();
    this.actorCharacterShadowSystem = null;
    this.walkInCharacterShadowSystem?.destroy();
    this.walkInCharacterShadowSystem = null;
    this.sceneThreeLampLightSystem?.destroy();
    this.sceneThreeLampLightSystem = null;
    this.sceneThreeLampMoteSystem?.destroy();
    this.sceneThreeLampMoteSystem = null;
    for (const runtime of this.customLightsById.values()) {
      runtime.particleSystem?.destroy();
    }
    this.sceneThreeChimneySmokeSystem?.destroy();
    this.sceneThreeChimneySmokeSystem = null;
    this.shootingStarSystem?.destroy();
    this.shootingStarSystem = null;
    this.sceneWalkInCharacterRuntime = null;
    this.ditherFilter = null;
    this.characterBubble = {
      sprite: null,
      text: null,
      state: "hidden",
      visibleElapsedMs: 0,
      typingElapsedMs: 0,
      displayedTextLength: 0,
      baseX: 960,
      baseY: 580,
      baseWidth: 250,
      baseHeight: 92,
      followSprite: null,
      offsetX: 48,
      offsetY: -18,
    };
    this.catBubble = {
      sprite: null,
      text: null,
      state: "hidden",
      visibleElapsedMs: 0,
      typingElapsedMs: 0,
      displayedTextLength: 0,
      baseX: 1098,
      baseY: 833,
      baseWidth: 104,
      baseHeight: 107,
      followSprite: null,
      offsetX: -16,
      offsetY: -10,
    };
    this.characterBubbleMessageIndex = 0;
    this.activeCharacterBubbleMessageIndex = 0;
    this.activeCharacterBubbleOverrideMessage = null;
    this.environmentSpritesById = new Map();
    this.layoutEditableSpritesById = new Map();
    this.actionMenuIcons = [];
    this.actionMenuIconsState = "hidden";
    this.actionMenuIconsElapsedMs = 0;
    this.isLayoutModeEnabled = false;
    this.selectedLayoutSpriteId = null;
    this.activeLayoutDrag = null;
    this.layers = null;
    this.scaledSceneRoot = null;
    this.world = null;
    this.assetsLoaded = false;

    if (this.app) {
      this.app.destroy(true, {
        children: true,
      });
      this.app = null;
    }

    this.host = null;
  }

  setRainEnabled(enabled: boolean) {
    this.rainSystem?.setEnabled(enabled);
  }

  updateRainLayerConfig(layerIndex: number, patch: import("./effects/rain-config").RainLayerPatch) {
    this.rainSystem?.updateLayerConfig(layerIndex, patch);
  }

  setLightingEnabled(enabled: boolean) {
    this.lightingEnabled = enabled;
    this.lampLightSystem?.setEnabled(enabled);
    this.lampReflectionSystem?.setEnabled(enabled);
    this.lampShadowSystem?.setEnabled(enabled);
    this.sceneTwoLampLightSystem?.setEnabled(enabled);
    this.sceneTwoLampMoteSystem?.container && (this.sceneTwoLampMoteSystem.container.visible = enabled);
    this.sceneThreeLampLightSystem?.setEnabled(enabled);
    this.sceneThreeLampMoteSystem?.container && (this.sceneThreeLampMoteSystem.container.visible = enabled);
    this.sceneThreeChimneySmokeSystem?.setEnabled(enabled);
    for (const runtime of this.customLightsById.values()) {
      runtime.sprite.visible = enabled;
      runtime.particleSystem?.setEnabled(enabled);
    }
  }

  setLayoutMode(enabled: boolean) {
    this.isLayoutModeEnabled = enabled;

    if (!enabled) {
      this.activeLayoutDrag = null;
    }

    this.refreshLayoutEditableSpriteInteractions();
    this.emitLayoutStateChange();
  }

  setSelectedLayoutSprite(spriteId: string | null) {
    if (spriteId && !this.layoutEditableSpritesById.has(spriteId)) {
      return;
    }

    this.selectedLayoutSpriteId = spriteId;
    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteInteraction(
    nextInteraction: Partial<NonNullable<SceneSpriteConfig["interaction"]>>,
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const currentInteraction = selectedSprite.config.interaction ?? {};
    const mergedInteraction = {
      ...currentInteraction,
      ...nextInteraction,
    };

    selectedSprite.config.interaction = Object.values(mergedInteraction).some(
      (value) => value !== undefined,
    )
      ? mergedInteraction
      : undefined;

    this.refreshLayoutEditableSpriteInteractions();
    this.rebuildActionMenuIcons();
    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteRainSplash(
    nextRainSplash: Partial<SceneSpriteRainSplashConfig>,
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const currentRainSplash = selectedSprite.config.rainSplash ?? {};
    const mergedRainSplash = {
      ...currentRainSplash,
      ...nextRainSplash,
    };

    selectedSprite.config.rainSplash = Object.values(mergedRainSplash).some(
      (value) => value !== undefined,
    )
      ? mergedRainSplash
      : undefined;

    if (!selectedSprite.config.rainSplashSegments?.length && selectedSprite.config.rainSplash) {
      selectedSprite.config.rainSplashSegments = [selectedSprite.config.rainSplash];
    }

    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteVisuals(
    nextVisuals: Partial<SceneSpriteVisualConfig>,
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const currentVisuals = selectedSprite.config.visuals ?? {};
    const mergedVisuals = {
      ...currentVisuals,
      ...nextVisuals,
    };

    selectedSprite.config.visuals = Object.values(mergedVisuals).some(
      (value) => value !== undefined,
    )
      ? mergedVisuals
      : undefined;

    this.applyVisualsToLayoutSprite(selectedSprite);
    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteLight(
    nextLight: Partial<SceneSpriteLightConfig>,
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite || selectedSprite.config.runtimeType !== "light") {
      return;
    }

    const currentLight = selectedSprite.config.light ?? {};
    const mergedLight = {
      ...currentLight,
      ...nextLight,
    };

    selectedSprite.config.light = Object.values(mergedLight).some(
      (value) => value !== undefined,
    )
      ? mergedLight
      : undefined;

    this.applyCustomLightConfig(selectedSprite.config.id);
    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteParticles(
    nextParticles: Partial<SceneSpriteParticleConfig>,
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite || selectedSprite.config.runtimeType !== "light") {
      return;
    }

    const currentParticles = selectedSprite.config.particles ?? {};
    const mergedParticles = {
      ...currentParticles,
      ...nextParticles,
    };

    selectedSprite.config.particles = Object.values(mergedParticles).some(
      (value) => value !== undefined,
    )
      ? mergedParticles
      : undefined;

    this.applyCustomLightConfig(selectedSprite.config.id);
    this.emitLayoutStateChange();
  }

  updateSelectedLayoutSpriteAlpha(alpha: number) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite || !Number.isFinite(alpha)) {
      return;
    }

    selectedSprite.config.alpha = Math.max(0, Math.min(1, alpha));

    if (selectedSprite.config.runtimeType === "light") {
      this.applyCustomLightConfig(selectedSprite.config.id);
    } else {
      selectedSprite.sprite.alpha = selectedSprite.config.alpha;
    }

    this.emitLayoutStateChange();
  }

  setSelectedLayoutSpriteRainSplashSegments(
    segments: SceneSpriteRainSplashSegmentConfig[],
  ) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    selectedSprite.config.rainSplashSegments = segments.length > 0 ? segments : undefined;
    selectedSprite.config.rainSplash = segments[0];

    this.emitLayoutStateChange();
  }

  scaleSelectedLayoutSprite(multiplier: number) {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return;
    }

    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const nextWidth = Math.max(8, Math.round(Math.abs(selectedSprite.sprite.width) * multiplier));
    const nextHeight = Math.max(8, Math.round(Math.abs(selectedSprite.sprite.height) * multiplier));

    if (selectedSprite.animator) {
      selectedSprite.animator.setSize(nextWidth, nextHeight);
    } else {
      selectedSprite.sprite.width = nextWidth;
      selectedSprite.sprite.height = nextHeight;
    }
    this.emitLayoutStateChange();
  }

  flipSelectedLayoutSpriteHorizontally() {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    selectedSprite.sprite.scale.x *= -1;
    this.emitLayoutStateChange();
  }

  offsetSelectedLayoutSpriteZIndex(delta: number) {
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    selectedSprite.sprite.zIndex = Math.round(selectedSprite.sprite.zIndex + delta);
    selectedSprite.sprite.parent?.sortChildren();
    this.emitLayoutStateChange();
  }

  bringSelectedLayoutSpriteToFront() {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const parent = selectedSprite.sprite.parent;

    if (!parent) {
      return;
    }

    const siblingZIndexes = parent.children
      .filter((child) => child !== selectedSprite.sprite)
      .map((child) => child.zIndex);
    const maxSiblingZIndex = siblingZIndexes.length > 0 ? Math.max(...siblingZIndexes) : 0;

    selectedSprite.sprite.zIndex = maxSiblingZIndex + 1;
    parent.sortChildren();
    this.emitLayoutStateChange();
  }

  sendSelectedLayoutSpriteToBack() {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    const parent = selectedSprite.sprite.parent;

    if (!parent) {
      return;
    }

    const siblingZIndexes = parent.children
      .filter((child) => child !== selectedSprite.sprite)
      .map((child) => child.zIndex);
    const minSiblingZIndex = siblingZIndexes.length > 0 ? Math.min(...siblingZIndexes) : 0;

    selectedSprite.sprite.zIndex = minSiblingZIndex - 1;
    parent.sortChildren();
    this.emitLayoutStateChange();
  }

  setSelectedLayoutSpriteLayer(layerName: SceneLayerName) {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite || !this.layers) {
      return;
    }

    const targetLayer = this.layers[layerName];

    if (!targetLayer) {
      return;
    }

    selectedSprite.sprite.removeFromParent();
    targetLayer.addChild(selectedSprite.sprite);
    selectedSprite.config.layer = layerName;
    this.emitLayoutStateChange();
  }

  deleteSelectedLayoutSprite() {
    const selectedSprite = this.selectedLayoutSpriteId
      ? this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId)
      : null;

    if (!selectedSprite) {
      return;
    }

    selectedSprite.sprite.removeFromParent();
    this.layoutEditableSpritesById.delete(selectedSprite.config.id);
    this.environmentSpritesById.delete(selectedSprite.config.id);
    const customLightRuntime = this.customLightsById.get(selectedSprite.config.id);
    customLightRuntime?.particleSystem?.destroy();
    this.customLightsById.delete(selectedSprite.config.id);

    const animatorIndex = this.environmentAnimators.findIndex(
      (entry) => selectedSprite.animator !== undefined && entry === selectedSprite.animator,
    );

    if (animatorIndex >= 0) {
      this.environmentAnimators.splice(animatorIndex, 1);
    }

    this.selectedLayoutSpriteId = null;
    this.emitLayoutStateChange();
  }

  getLayoutSnapshot() {
    return Array.from(this.layoutEditableSpritesById.values())
      .map((entry) => this.createLayoutSnapshot(entry))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  getSelectedLayoutSpriteSnapshot() {
    if (!this.selectedLayoutSpriteId) {
      return null;
    }

    const entry = this.layoutEditableSpritesById.get(this.selectedLayoutSpriteId);

    if (!entry) {
      return null;
    }

    return this.createLayoutSnapshot(entry);
  }

  getSelectedLayoutSpriteInteraction() {
    if (!this.selectedLayoutSpriteId) {
      return null;
    }

    return this.getResolvedInteractionConfig(this.selectedLayoutSpriteId);
  }

  getLayoutSpriteSnapshotById(spriteId: string) {
    const entry = this.layoutEditableSpritesById.get(spriteId);

    if (!entry) {
      return null;
    }

    return this.createLayoutSnapshot(entry);
  }

  getSceneThreeSmokeControls() {
    return this.sceneThreeChimneySmokeSystem?.getControls() ?? null;
  }

  updateSceneThreeSmokeControls(nextControls: Partial<SceneThreeSmokeControls>) {
    this.sceneThreeChimneySmokeSystem?.setControls(nextControls);
  }

  private async loadAssets() {
    if (this.assetsLoaded) {
      this.options.onLoadProgress?.(1);
      return;
    }

    await Assets.init({ manifest: sceneAssetsManifest });
    this.options.onLoadProgress?.(0);
    await Assets.loadBundle("scene", (progress) => {
      this.options.onLoadProgress?.(progress);
    });

    const sceneFallbackAssets = SCENE_ASSET_FALLBACKS[this.sceneId as keyof typeof SCENE_ASSET_FALLBACKS];

    if (sceneFallbackAssets) {
      await Assets.load(sceneFallbackAssets);
    }

    if (this.options.runtimeSceneBackgroundSrc) {
      await Assets.load(this.options.runtimeSceneBackgroundSrc).catch((error) => {
        console.error("[PixelSceneController] Failed to load runtime background", {
          sceneId: this.sceneId,
          src: this.options.runtimeSceneBackgroundSrc,
          error,
        });
      });
    }

    const runtimeSpriteAssets = (this.options.runtimeSceneSprites ?? []).filter(
      (sprite): sprite is SceneSpriteConfig & { src: string } => Boolean(sprite.src),
    );

    if (runtimeSpriteAssets.length > 0) {
      await Promise.allSettled(
        runtimeSpriteAssets.map((sprite) =>
          Assets.load({
            alias: sprite.assetId,
            src: sprite.src!,
          }).catch((error) => {
            console.error("[PixelSceneController] Failed to load runtime sprite asset", {
              sceneId: this.sceneId,
              spriteId: sprite.id,
              assetId: sprite.assetId,
              src: sprite.src,
              error,
            });
          }),
        ),
      );
    }

    this.assetsLoaded = true;
    this.options.onLoadProgress?.(1);
  }

  private buildScene() {
    if (!this.app) {
      return;
    }

    const sceneDefinition = sceneRegistry[this.sceneId];
    const hasRuntimeSceneSprites =
      this.sceneId !== "scene-builder" && (this.options.runtimeSceneSprites?.length ?? 0) > 0;

    const world = new Container();
    world.sortableChildren = true;
    const ditherFilter = new DitherFilter();
    const scaledSceneRoot = new Container();
    scaledSceneRoot.scale.set(SCENE_SPRITE_SCALE);
    scaledSceneRoot.position.set(
      (1 - SCENE_SPRITE_SCALE) * 0.5 * VIRTUAL_WIDTH,
      (1 - SCENE_SPRITE_SCALE) * VIRTUAL_HEIGHT + SCENE_SPRITE_OFFSET_Y,
    );
    scaledSceneRoot.eventMode = "static";
    // Keep the current visual composition, but expand the interaction bounds so
    // sprites dragged near the left/right edges remain hittable after the scene
    // root is scaled down and shifted inward.
    scaledSceneRoot.hitArea = new Rectangle(
      -VIRTUAL_WIDTH,
      -VIRTUAL_HEIGHT,
      VIRTUAL_WIDTH * 3,
      VIRTUAL_HEIGHT * 3,
    );
    scaledSceneRoot.on("pointertap", this.handleSceneGroundClick);

    const layers: SceneLayers = {
      backgroundLayer: new Container(),
      environmentLayer: new Container(),
      actorLayer: new Container(),
      effectsLayer: new Container(),
    };
    this.layers = layers;

    layers.backgroundLayer.zIndex = 0;
    layers.environmentLayer.zIndex = 10;
    layers.actorLayer.zIndex = 20;
    layers.effectsLayer.zIndex = 30;
    layers.backgroundLayer.sortableChildren = true;
    layers.environmentLayer.sortableChildren = true;
    layers.actorLayer.sortableChildren = true;
    layers.effectsLayer.sortableChildren = true;

    world.filters = [ditherFilter];
    this.app.stage.sortableChildren = true;
    this.app.stage.eventMode = "static";
    this.app.stage.addChild(world);
    this.app.stage.on("globalpointermove", this.handleLayoutPointerMove);
    this.app.stage.on("pointerup", this.handleLayoutPointerUp);
    this.app.stage.on("pointerupoutside", this.handleLayoutPointerUp);

    world.addChild(layers.backgroundLayer);
    world.addChild(scaledSceneRoot);

    scaledSceneRoot.addChild(layers.environmentLayer);
    scaledSceneRoot.addChild(layers.actorLayer);
    scaledSceneRoot.addChild(layers.effectsLayer);

    const resolvedBackgroundAssetId =
      this.options.runtimeSceneBackgroundSrc &&
      this.hasTextureAsset(this.options.runtimeSceneBackgroundSrc)
        ? this.options.runtimeSceneBackgroundSrc
        : sceneDefinition.backgroundAssetId;

    layers.backgroundLayer.addChild(this.createBackgroundSprite(resolvedBackgroundAssetId));

    if (sceneDefinition.enablePuddleShimmer) {
      const puddleShimmerSystem = new PuddleShimmerSystem();
      layers.environmentLayer.addChild(puddleShimmerSystem.container);
      this.puddleShimmerSystem = puddleShimmerSystem;
      this.effectSystems = [...this.effectSystems, puddleShimmerSystem];
    }

    const shootingStarSystem = new ShootingStarSystem();
    layers.effectsLayer.addChild(shootingStarSystem.container);
    this.shootingStarSystem = shootingStarSystem;
    this.effectSystems = [...this.effectSystems, shootingStarSystem];

    if (sceneDefinition.enableLampEffects) {
      const lampLightSystem = new LampLightSystem();
      layers.effectsLayer.addChild(lampLightSystem.container);
      this.lampLightSystem = lampLightSystem;
      this.effectSystems = [...this.effectSystems, lampLightSystem];

      const lampShadowSystem = new LampShadowSystem();
      layers.environmentLayer.addChild(lampShadowSystem.container);
      this.lampShadowSystem = lampShadowSystem;
      this.effectSystems = [...this.effectSystems, lampShadowSystem];

      const lampMoteSystem = new LampMoteSystem();
      layers.effectsLayer.addChild(lampMoteSystem.container);
      this.lampMoteSystem = lampMoteSystem;
      this.effectSystems = [...this.effectSystems, lampMoteSystem];

      const lampReflectionSystem = new LampReflectionSystem();
      layers.effectsLayer.addChild(lampReflectionSystem.container);
      world.addChild(lampReflectionSystem.overlayContainer);
      this.lampReflectionSystem = lampReflectionSystem;
      this.effectSystems = [...this.effectSystems, lampReflectionSystem];
    }

    if (this.sceneId === "scene-2") {
      const sceneTwoLampLightSystem = new SceneTwoLampLightSystem();
      layers.effectsLayer.addChild(sceneTwoLampLightSystem.container);
      this.sceneTwoLampLightSystem = sceneTwoLampLightSystem;
      this.effectSystems = [...this.effectSystems, sceneTwoLampLightSystem];

      const sceneTwoLampMoteSystem = new SceneTwoLampMoteSystem();
      layers.effectsLayer.addChild(sceneTwoLampMoteSystem.container);
      this.sceneTwoLampMoteSystem = sceneTwoLampMoteSystem;
      this.effectSystems = [...this.effectSystems, sceneTwoLampMoteSystem];
    }

    if (this.sceneId === "scene-3") {
      const sceneThreeLampLightSystem = new SceneThreeLampLightSystem();
      sceneThreeLampLightSystem.container.position.set(1278, 436);
      sceneThreeLampLightSystem.container.scale.set(0.58);
      layers.effectsLayer.addChild(sceneThreeLampLightSystem.container);
      this.sceneThreeLampLightSystem = sceneThreeLampLightSystem;
      this.effectSystems = [...this.effectSystems, sceneThreeLampLightSystem];

      const sceneThreeLampMoteSystem = new SceneThreeLampMoteSystem();
      sceneThreeLampMoteSystem.container.position.set(1278, 436);
      sceneThreeLampMoteSystem.container.scale.set(0.58);
      layers.effectsLayer.addChild(sceneThreeLampMoteSystem.container);
      this.sceneThreeLampMoteSystem = sceneThreeLampMoteSystem;
      this.effectSystems = [...this.effectSystems, sceneThreeLampMoteSystem];

      const sceneThreeChimneySmokeSystem = new SceneThreeChimneySmokeSystem();
      sceneThreeChimneySmokeSystem.setControls({
        x: 1388,
        y: 325,
        scale: 1.18,
        density: 1.42,
        drift: 0.74,
      });
      layers.effectsLayer.addChild(sceneThreeChimneySmokeSystem.container);
      this.sceneThreeChimneySmokeSystem = sceneThreeChimneySmokeSystem;
      this.effectSystems = [...this.effectSystems, sceneThreeChimneySmokeSystem];
    }

    if (this.sceneId === "scene-2" || this.sceneId === "scene-3" || this.sceneId === "scene-4") {
      const walkInCharacterShadowSystem = new WalkInCharacterShadowSystem();
      layers.environmentLayer.addChild(walkInCharacterShadowSystem.container);
      this.walkInCharacterShadowSystem = walkInCharacterShadowSystem;
      this.effectSystems = [...this.effectSystems, walkInCharacterShadowSystem];
    }

    const rainSystem = new RainSystem(sceneDefinition.rainConfig);
    layers.effectsLayer.addChild(rainSystem.container);
    world.addChild(rainSystem.overlayContainer);
    this.rainSystem = rainSystem;
    this.effectSystems = [...this.effectSystems, rainSystem];

    if (sceneDefinition.enableEnvironmentSprites) {
      const activeEnvironmentSprites =
        this.sceneId === "scene-builder"
          ? this.options.runtimeSceneSprites ?? []
          : hasRuntimeSceneSprites
            ? this.options.runtimeSceneSprites ?? []
          :
        this.sceneId === "scene-2"
          ? sceneTwoEnvironmentSprites
          : this.sceneId === "scene-3"
            ? sceneThreeEnvironmentSprites
            : this.sceneId === "scene-4"
              ? sceneFourEnvironmentSprites
            : environmentSprites;

      for (const spriteConfig of activeEnvironmentSprites) {
        const isRuntimeLight = spriteConfig.runtimeType === "light";

        if (!isRuntimeLight && !this.hasTextureAsset(spriteConfig.assetId)) {
          console.warn("[PixelSceneController] Skipping missing sprite texture", {
            sceneId: this.sceneId,
            spriteId: spriteConfig.id,
            assetId: spriteConfig.assetId,
            src: spriteConfig.src,
          });
          continue;
        }

        const isRuntimeCharacter = spriteConfig.runtimeType === "character";
        const isRuntimeCharacterIdle = spriteConfig.runtimeType === "character-idle";
        const isRuntimeCat = spriteConfig.runtimeType === "cat";
        const isRuntimeWindTurbine = spriteConfig.runtimeType === "wind-turbine";
        const sprite =
          spriteConfig.id === "trash-active"
            ? this.createAnimatedEnvironmentSprite(spriteConfig, createTrashMouseIdleClip())
            : spriteConfig.id === "scene2-character" ||
                spriteConfig.id === "scene3-character" ||
                spriteConfig.id === "scene4-character" ||
                isRuntimeCharacter
              ? this.createSceneTwoCharacterSprite(spriteConfig)
              : isRuntimeCharacterIdle
                ? this.createAnimatedEnvironmentSprite(spriteConfig, createCharacterIdleClip())
              : isRuntimeLight
                ? this.createCustomLightSprite(spriteConfig)
                : isRuntimeWindTurbine
                  ? this.createAnimatedEnvironmentSprite(spriteConfig, createWindTurbineClip())
              : spriteConfig.id === "scene3-cat" ||
                  spriteConfig.id === "scene4-cat" ||
                  isRuntimeCat
                ? this.createAnimatedEnvironmentSprite(spriteConfig, createSceneCatIdleClip())
                : this.createSprite(spriteConfig);

        if (
          spriteConfig.id === "scene2-character" ||
          spriteConfig.id === "scene3-character" ||
          spriteConfig.id === "scene4-character" ||
          isRuntimeCharacter ||
          isRuntimeCharacterIdle
        ) {
          sprite.eventMode = "static";
          sprite.cursor = "default";
          sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
          sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
        }

        if (spriteConfig.id === "sign") {
          sprite.eventMode = "static";
          sprite.cursor = "pointer";
          sprite.on("pointertap", this.handleSignClick);
          sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
          sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
        }

        if (
          spriteConfig.id !== "sign" &&
          spriteConfig.id !== "scene2-character" &&
          spriteConfig.id !== "scene3-character" &&
          spriteConfig.id !== "scene4-character" &&
          !isRuntimeCharacter &&
          !isRuntimeCharacterIdle &&
          !isRuntimeLight
        ) {
          sprite.eventMode = "static";
          sprite.cursor = "pointer";
          sprite.on("pointertap", (event: FederatedPointerEvent) =>
            this.handleObjectActionMenuClick(spriteConfig.id, event),
          );
          sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
          sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
        }

        this.environmentSpritesById.set(spriteConfig.id, sprite);
        if (isRuntimeLight) {
          this.customLightsById.set(spriteConfig.id, {
            sprite,
            elapsedMs: 0,
            baseWidth: spriteConfig.width,
            baseHeight: spriteConfig.height,
          });
          sprite.visible = this.lightingEnabled;
        }
        this.registerLayoutEditableSprite(
          spriteConfig,
          sprite,
          spriteConfig.id === "trash-active"
            ? this.environmentAnimators.at(-1) instanceof SpriteAnimator
              ? (this.environmentAnimators.at(-1) as SpriteAnimator)
              : undefined
            : spriteConfig.id === "scene2-character" ||
                spriteConfig.id === "scene3-character" ||
                spriteConfig.id === "scene4-character" ||
                isRuntimeCharacter
              ? this.sceneWalkInCharacterRuntime?.animator
              : isRuntimeCharacterIdle
                ? this.environmentAnimators.at(-1) instanceof SpriteAnimator
                  ? (this.environmentAnimators.at(-1) as SpriteAnimator)
                  : undefined
              : isRuntimeWindTurbine
                ? this.environmentAnimators.at(-1) instanceof SpriteAnimator
                  ? (this.environmentAnimators.at(-1) as SpriteAnimator)
                  : undefined
              : spriteConfig.id === "scene3-cat" ||
                  spriteConfig.id === "scene4-cat" ||
                  isRuntimeCat
                ? this.environmentAnimators.at(-1) instanceof SpriteAnimator
                  ? (this.environmentAnimators.at(-1) as SpriteAnimator)
                  : undefined
                : undefined,
        );
        const targetLayer =
          spriteConfig.layer === "actorLayer"
            ? layers.actorLayer
            : spriteConfig.layer === "effectsLayer"
              ? layers.effectsLayer
              : layers.environmentLayer;
        if (spriteConfig.ignoreSceneScale) {
          sprite.zIndex = spriteConfig.zIndex ?? 80;
          world.addChild(sprite);
        } else {
          targetLayer.addChild(sprite);
        }
        if (isRuntimeLight) {
          this.applyCustomLightConfig(spriteConfig.id);
          targetLayer.sortChildren();
        }
      }
    }

    if (sceneDefinition.enableActorSprites) {
      const characterTexture = Assets.get("character") as Texture;
      const catTexture = Assets.get("cat") as Texture;
      const characterEntity = createCharacterEntity(characterTexture);
      const catEntity = createCatEntity(catTexture);

      characterEntity.sprite.eventMode = "static";
      characterEntity.sprite.cursor = "pointer";
      characterEntity.sprite.on("pointertap", this.handleCharacterClick);
      characterEntity.sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
      characterEntity.sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
      catEntity.sprite.eventMode = "static";
      catEntity.sprite.cursor = "pointer";
      catEntity.sprite.on("pointertap", this.handleCatClick);
      catEntity.sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
      catEntity.sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));

      this.actorEntities = [...this.actorEntities, characterEntity, catEntity];
      this.characterEntity = characterEntity;

      const actorCharacterShadowSystem = new WalkInCharacterShadowSystem();
      layers.environmentLayer.addChild(actorCharacterShadowSystem.container);
      this.actorCharacterShadowSystem = actorCharacterShadowSystem;
      this.effectSystems = [...this.effectSystems, actorCharacterShadowSystem];

      layers.actorLayer.addChild(characterEntity.sprite);
      layers.actorLayer.addChild(catEntity.sprite);
    }

    const characterBubble = this.createBubbleSprite(
      "character-bubble",
      "bubble",
      960,
      580,
      250,
      92,
      true,
    );
    const catBubble = this.createBubbleSprite(
      "cat-bubble",
      "bubbleMouse",
      1098,
      833,
      104,
      107,
      false,
    );
    layers.effectsLayer.addChild(characterBubble.sprite);
    characterBubble.sprite.zIndex = 20;
    if (characterBubble.text) {
      characterBubble.text.zIndex = 21;
      layers.effectsLayer.addChild(characterBubble.text);
    }
    catBubble.sprite.zIndex = 22;
    layers.effectsLayer.addChild(catBubble.sprite);
    this.actionMenuIcons = this.createActionMenuIcons();
    for (const icon of this.actionMenuIcons) {
      icon.sprite.zIndex = 30;
      layers.effectsLayer.addChild(icon.sprite);
    }

    this.characterBubble.sprite = characterBubble.sprite;
    this.characterBubble.text = characterBubble.text;
    this.characterBubble.followSprite =
      this.sceneWalkInCharacterRuntime?.sprite ?? this.characterEntity?.sprite ?? null;
    this.catBubble.sprite = catBubble.sprite;
    this.catBubble.followSprite =
      this.environmentSpritesById.get("scene4-cat") ??
      this.environmentSpritesById.get("scene3-cat") ??
      null;

    if (sceneDefinition.enableEffectSprites && !hasRuntimeSceneSprites) {
      for (const spriteConfig of effectSprites) {
        const sprite = this.createSprite(spriteConfig);
        if (spriteConfig.alpha !== undefined) {
          sprite.alpha = spriteConfig.alpha;
        }

        if (spriteConfig.id !== "logo") {
          sprite.eventMode = "static";
          sprite.cursor = "pointer";
          sprite.on("pointertap", (event: FederatedPointerEvent) =>
            this.handleObjectActionMenuClick(spriteConfig.id, event),
          );
          sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
          sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
        }

        this.registerLayoutEditableSprite(spriteConfig, sprite);

        if (spriteConfig.ignoreSceneScale) {
          sprite.zIndex = 80;
          world.addChild(sprite);
        } else {
          layers.effectsLayer.addChild(sprite);
        }
      }
    }

    this.world = world;
    this.ditherFilter = ditherFilter;
    this.scaledSceneRoot = scaledSceneRoot;
    this.layers = layers;
    this.refreshLayoutEditableSpriteInteractions();
    this.emitLayoutStateChange();
  }

  private startLoop() {
    if (!this.app) {
      return;
    }

    this.app.ticker.remove(this.handleTick);
    this.app.ticker.add(this.handleTick);
  }

  private createSprite(config: SceneSpriteConfig) {
    const texture = Assets.get(config.assetId) as Texture;
    const sprite = new Sprite(texture);

    sprite.label = config.id;
    sprite.anchor.set(config.anchorX, config.anchorY);
    sprite.position.set(config.x, config.y);
    sprite.width = config.width;
    sprite.height = config.height;
    if (config.scaleX !== undefined || config.scaleY !== undefined) {
      sprite.scale.set(config.scaleX ?? 1, config.scaleY ?? 1);
    }
    sprite.rotation = config.rotation ?? 0;
    sprite.alpha = config.alpha ?? 1;
    sprite.zIndex = config.zIndex ?? 0;
    if (config.blendMode) {
      sprite.blendMode = config.blendMode;
    }

    return sprite;
  }

  private createCustomLightTexture(color: string) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d");

    if (!context) {
      return Texture.WHITE;
    }

    const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 128);

    gradient.addColorStop(0, this.hexToRgba(color, 0.8));
    gradient.addColorStop(0.34, this.hexToRgba(color, 0.42));
    gradient.addColorStop(1, this.hexToRgba(color, 0));

    context.clearRect(0, 0, 256, 256);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    return Texture.from(canvas);
  }

  private createCustomLightSprite(config: SceneSpriteConfig) {
    const sprite = new Sprite(
      this.createCustomLightTexture(config.light?.color ?? "#e47c3e"),
    );
    sprite.label = config.id;
    sprite.anchor.set(config.anchorX, config.anchorY);
    sprite.position.set(config.x, config.y);
    sprite.width = config.width;
    sprite.height = config.height;
    sprite.alpha = config.alpha ?? 0.22;
    sprite.zIndex = config.zIndex ?? 6;
    sprite.blendMode = config.light?.blendMode ?? "screen";
    sprite.roundPixels = true;
    sprite.eventMode = "static";
    sprite.cursor = "pointer";

    return sprite;
  }

  private hexToRgba(hex: string, alpha: number) {
    const normalized = hex.replace("#", "");
    const safeHex =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : normalized.padEnd(6, "0").slice(0, 6);
    const red = Number.parseInt(safeHex.slice(0, 2), 16);
    const green = Number.parseInt(safeHex.slice(2, 4), 16);
    const blue = Number.parseInt(safeHex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  private applyCustomLightConfig(spriteId: string) {
    const entry = this.layoutEditableSpritesById.get(spriteId);
    const runtime = this.customLightsById.get(spriteId);

    if (!entry || !runtime) {
      return;
    }

    const light = entry.config.light;
    runtime.sprite.texture = this.createCustomLightTexture(light?.color ?? "#e47c3e");
    runtime.baseWidth = entry.config.width;
    runtime.baseHeight = entry.config.height;
    runtime.sprite.width = runtime.baseWidth;
    runtime.sprite.height = runtime.baseHeight;

    runtime.sprite.alpha = Math.max(
      0,
      Math.min(1, (entry.config.alpha ?? 0.22) * (light?.intensity ?? 1)),
    );
    runtime.sprite.blendMode = light?.blendMode ?? "screen";

    const particleConfig = entry.config.particles;

    if (particleConfig?.enabled) {
      if (!runtime.particleSystem && this.layers) {
        runtime.particleSystem = new CustomLightParticleSystem(runtime.sprite);
        this.layers.effectsLayer.addChild(runtime.particleSystem.container);
      }

      runtime.particleSystem?.setConfig(particleConfig);
      runtime.particleSystem?.setEnabled(this.lightingEnabled);
    } else if (runtime.particleSystem) {
      runtime.particleSystem.destroy();
      runtime.particleSystem = undefined;
    }
  }

  private applyVisualsToLayoutSprite(entry: LayoutEditableSpriteRuntime) {
    const visuals = entry.config.visuals;
    const sprite = entry.sprite;

    if (!visuals) {
      sprite.filters = [];
      return;
    }

    let colorFilter = entry.colorFilter;

    if (!colorFilter) {
      colorFilter = new ColorMatrixFilter();
      entry.colorFilter = colorFilter;
    }

    colorFilter.reset();
    colorFilter.brightness(1 + (visuals.brightness ?? 0), false);
    colorFilter.contrast(1 + (visuals.contrast ?? 0), true);
    sprite.filters = [colorFilter];
  }

  private createBackgroundSprite(
    assetId:
      | "background"
      | "backgroundScene2"
      | "backgroundScene3"
      | "backgroundScene4"
      | "__runtime-scene-background__"
      | string,
  ) {
    const texture = Assets.get(assetId) as Texture;

    if (!texture) {
      throw new Error(`Background texture not loaded for assetId: ${assetId}`);
    }

    const sprite = new Sprite(texture);
    const coverScale = Math.max(VIRTUAL_WIDTH / texture.width, VIRTUAL_HEIGHT / texture.height);

    sprite.label = backgroundSprite.id;
    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(VIRTUAL_WIDTH * 0.5, VIRTUAL_HEIGHT * 0.5);
    sprite.scale.set(coverScale);

    return sprite;
  }

  private registerLayoutEditableSprite(
    config: SceneSpriteConfig,
    sprite: Sprite,
    animator?: SpriteAnimator,
  ) {
    if (config.id === backgroundSprite.id || config.id === "trash-active") {
      return;
    }

    sprite.on("pointerdown", (event: FederatedPointerEvent) =>
      this.handleLayoutPointerDown(config.id, event),
    );
    sprite.on("pointertap", (event: FederatedPointerEvent) => {
      if (!this.isLayoutModeEnabled) {
        this.handleObjectActionMenuClick(config.id, event);
        event.stopPropagation();
      }
    });
    sprite.on("pointerover", () => this.handleInteractiveHoverChange(true));
    sprite.on("pointerout", () => this.handleInteractiveHoverChange(false));
    this.layoutEditableSpritesById.set(config.id, {
      sprite,
      config,
      animator,
    });
  }

  private rebuildActionMenuIcons() {
    const effectsLayer = this.layers?.effectsLayer;
    if (!effectsLayer) return;

    for (const icon of this.actionMenuIcons) {
      effectsLayer.removeChild(icon.sprite);
      icon.sprite.destroy();
    }

    this.actionMenuIcons = this.createActionMenuIcons();
    for (const icon of this.actionMenuIcons) {
      icon.sprite.zIndex = 30;
      effectsLayer.addChild(icon.sprite);
    }
  }

  private refreshLayoutEditableSpriteInteractions() {
    for (const [spriteId, entry] of this.layoutEditableSpritesById.entries()) {
      const sprite = entry.sprite;
      const canUseGameplayInteraction = this.isSpriteClickableForGameplay(spriteId);

      if (this.isLayoutModeEnabled) {
        sprite.eventMode = "static";
        sprite.cursor = this.selectedLayoutSpriteId === spriteId ? "grabbing" : "grab";
        continue;
      }

      if (canUseGameplayInteraction) {
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        continue;
      }

      sprite.eventMode = "none";
      sprite.cursor = "default";
    }
  }

  private createLayoutSnapshot(entry: LayoutEditableSpriteRuntime): LayoutSpriteSnapshot {
    const { config, sprite } = entry;
    const isSceneWalkCharacter =
      config.id === "scene2-character" ||
      config.id === "scene3-character" ||
      config.id === "scene4-character" ||
      config.runtimeType === "character";
    const snapshotX = isSceneWalkCharacter && !this.isLayoutModeEnabled ? config.x : Math.round(sprite.position.x);
    const snapshotY = isSceneWalkCharacter && !this.isLayoutModeEnabled ? config.y : Math.round(sprite.position.y);
    const snapshotWidth = isSceneWalkCharacter ? config.width : Math.round(Math.abs(sprite.width));
    const snapshotHeight = isSceneWalkCharacter ? config.height : Math.round(Math.abs(sprite.height));
    const resolvedInteraction = this.getResolvedInteractionConfig(config.id);
    const nextInteraction =
      resolvedInteraction.clickable ||
      resolvedInteraction.hasInfo ||
      resolvedInteraction.hasDrawer ||
      resolvedInteraction.collectible ||
      resolvedInteraction.bubbleMessage !== undefined ||
      resolvedInteraction.infoTitle !== undefined ||
      resolvedInteraction.infoDescription !== undefined ||
      resolvedInteraction.infoImageSrc !== undefined ||
      resolvedInteraction.infoModal !== undefined ||
      resolvedInteraction.drawer !== undefined
        ? resolvedInteraction
        : undefined;

    return {
      id: config.id,
      assetId: config.assetId,
      src: config.src,
      runtimeType: config.runtimeType,
      x: snapshotX,
      y: snapshotY,
      width: snapshotWidth,
      height: snapshotHeight,
      anchorX: config.anchorX,
      anchorY: config.anchorY,
      scaleX: config.scaleX,
      scaleY: config.scaleY,
      rotation: config.rotation,
      alpha: config.alpha,
      blendMode: config.blendMode,
      ignoreSceneScale: config.ignoreSceneScale,
      layer: config.layer,
      zIndex: sprite.zIndex,
      interaction: nextInteraction,
      rainSplash: config.rainSplash,
      rainSplashSegments: config.rainSplashSegments,
      visuals: config.visuals,
      light: config.light,
      particles: config.particles,
    };
  }

  private getBaseInteractionConfig(spriteId: string) {
    const menu = this.actionMenuConfigByObjectId.get(spriteId);
    const actions = menu
      ? this.actionMenuIcons.filter((icon) => icon.menuId === menu.objectId)
      : [];

    return {
      clickable:
        interactiveObjectIds.has(spriteId) ||
        spriteId === "sign" ||
        spriteId === "scene2-character" ||
        spriteId === "scene3-character" ||
        spriteId === "scene4-character",
      hasInfo: actions.some((action) => action.kind === "info"),
      hasDrawer: false,
      collectible: actions.some((action) => action.kind === "collect"),
    };
  }

  private getResolvedInteractionConfig(spriteId: string) {
    const baseConfig = this.getBaseInteractionConfig(spriteId);
    const layoutConfig = this.layoutEditableSpritesById.get(spriteId)?.config.interaction;

    return {
      clickable: layoutConfig?.clickable ?? baseConfig.clickable,
      hasInfo: layoutConfig?.hasInfo ?? baseConfig.hasInfo,
      hasDrawer: layoutConfig?.hasDrawer ?? baseConfig.hasDrawer,
      collectible: layoutConfig?.collectible ?? baseConfig.collectible,
      collectLabel: layoutConfig?.collectLabel,
      collectIconSrc: layoutConfig?.collectIconSrc,
      collectTargetObjectId: layoutConfig?.collectTargetObjectId,
      bubbleMessage: layoutConfig?.bubbleMessage,
      infoTitle: layoutConfig?.infoTitle,
      infoDescription: layoutConfig?.infoDescription,
      infoImageSrc: layoutConfig?.infoImageSrc,
      infoModal: layoutConfig?.infoModal,
      drawer: layoutConfig?.drawer,
    };
  }

  private isSpriteClickableForGameplay(spriteId: string) {
    return this.getResolvedInteractionConfig(spriteId).clickable;
  }

  private getEnabledActionMenuIcons(menuId: string) {
    const interaction = this.getResolvedInteractionConfig(menuId);

    return this.actionMenuIcons.filter((icon) => {
      if (icon.menuId !== menuId) {
        return false;
      }

      if (icon.kind === "info" && !interaction.hasInfo) {
        return false;
      }

      if (icon.kind === "collect" && (!interaction.collectible || this.collectedLayoutSpriteIds.has(menuId))) {
        return false;
      }

      return true;
    });
  }

  private emitLayoutStateChange() {
    this.refreshLayoutSpriteVisuals();
    this.options.onLayoutStateChange?.({
      isEnabled: this.isLayoutModeEnabled,
      selectedSpriteId: this.selectedLayoutSpriteId,
      sprites: this.getLayoutSnapshot(),
    });
  }

  private refreshLayoutSpriteVisuals() {
    for (const entry of this.layoutEditableSpritesById.values()) {
      this.applyVisualsToLayoutSprite(entry);
    }
  }

  private createActionIcon(
    menuId: string,
    objectId: string,
    kind: SceneActionIconKind,
    label: string,
    message: string,
    actionId: string,
    inventoryItemId: string | undefined,
    consumeObjectOnUse: boolean | undefined,
    originOffsetX: number,
    originOffsetY: number,
    targetOffsetX: number,
    targetOffsetY: number,
    width: number,
    height: number,
  ) {
    const texture = Assets.get(kind === "info" ? "infoIcon" : "collectIcon") as Texture;
    const sprite = new Sprite(texture);

    sprite.label = label;
    sprite.anchor.set(0.5, 1);
    sprite.position.set(0, 0);
    sprite.width = width;
    sprite.height = height;
    sprite.alpha = 0;
    sprite.scale.set(0.6);
    sprite.visible = false;
    sprite.zIndex = 40;
    sprite.eventMode = "static";
    sprite.cursor = "pointer";

    return {
      sprite,
      menuId,
      objectId,
      actionId,
      kind,
      message,
      inventoryItemId,
      consumeObjectOnUse,
      width,
      height,
      originOffsetX,
      originOffsetY,
      targetOffsetX,
      targetOffsetY,
    };
  }

  private createActionMenuIcons() {
    const icons: ActionMenuIconRuntime[] = [];

    for (const menu of objectActionMenus) {
      for (const action of menu.actions) {
        const baseSprite = environmentSprites.find((sprite) => sprite.id === menu.objectId);
        const baseX = baseSprite?.x ?? 0;
        const baseY = baseSprite?.y ?? 0;
        const icon = this.createActionIcon(
          menu.objectId,
          menu.objectId,
          action.kind,
          `${action.id}-icon`,
          action.message,
          action.id,
          action.inventoryItemId,
          action.consumeObjectOnUse,
          menu.originX - baseX,
          menu.originY - baseY,
          action.targetX - baseX,
          action.targetY - baseY,
          action.width,
          action.height,
        );

        icon.sprite.on("pointertap", () => this.handleActionMenuIconClick(icon));
        icon.sprite.on("pointerover", () => this.handleActionMenuIconHover(icon, true));
        icon.sprite.on("pointerout", () => this.handleActionMenuIconHover(icon, false));
        icons.push(icon);
      }
    }

    for (const [objectId, entry] of this.layoutEditableSpritesById.entries()) {
      const existingMenu = this.actionMenuConfigByObjectId.get(objectId);

      if (existingMenu && existingMenu.actions.length > 0) {
        continue;
      }

      const interaction = entry.config.interaction;

      if (
        !interaction?.clickable ||
        (!interaction.hasInfo && !interaction.collectible)
      ) {
        continue;
      }

      const objectWidth = Math.max(Math.abs(entry.sprite.width), 1);
      const objectHeight = Math.max(Math.abs(entry.sprite.height), 1);
      const verticalLift = Math.min(Math.max(objectHeight * 0.34, 46), 88);
      const horizontalSpread = Math.min(Math.max(objectWidth * 0.28, 32), 54);
      const revealRise = 18;
      const iconSize = 44;
      const message = interaction.bubbleMessage ?? "";

      const genericActions: Array<{
        kind: SceneActionIconKind;
        actionId: string;
        targetOffsetX: number;
      }> = [];

      if (interaction.hasInfo) {
        genericActions.push({
          kind: "info",
          actionId: `${objectId}-generic-info`,
          targetOffsetX: interaction.collectible ? -horizontalSpread : 0,
        });
      }

      if (interaction.collectible) {
        genericActions.push({
          kind: "collect",
          actionId: `${objectId}-generic-collect`,
          targetOffsetX: interaction.hasInfo || interaction.hasDrawer ? horizontalSpread : 0,
        });
      }

      for (const action of genericActions) {
        const icon = this.createActionIcon(
          objectId,
          objectId,
          action.kind,
          `${action.actionId}-icon`,
          message,
          action.actionId,
          undefined,
          false,
          0,
          -verticalLift + revealRise,
          action.targetOffsetX,
          -verticalLift,
          iconSize,
          iconSize,
        );

        icon.sprite.on("pointertap", () => this.handleActionMenuIconClick(icon));
        icon.sprite.on("pointerover", () => this.handleActionMenuIconHover(icon, true));
        icon.sprite.on("pointerout", () => this.handleActionMenuIconHover(icon, false));
        icons.push(icon);
      }
    }

    return icons;
  }

  private createAnimatedEnvironmentSprite(
    config: SceneSpriteConfig,
    clip: AnimationClip,
  ) {
    const texture = clip.frames[0]?.texture ?? (Assets.get(config.assetId) as Texture);
    const sprite = new Sprite(texture);

    sprite.label = config.id;
    sprite.anchor.set(config.anchorX, config.anchorY);
    sprite.position.set(config.x, config.y);
    sprite.width = config.width;
    sprite.height = config.height;
    if (config.scaleX !== undefined || config.scaleY !== undefined) {
      sprite.scale.set(config.scaleX ?? 1, config.scaleY ?? 1);
    }
    sprite.alpha = config.alpha ?? 1;
    sprite.zIndex = config.zIndex ?? 0;
    if (config.blendMode) {
      sprite.blendMode = config.blendMode;
    }

    const animator = new SpriteAnimator(sprite);
    animator.setSize(config.width, config.height);
    animator.play(clip);
    this.environmentAnimators.push(animator);

    return sprite;
  }

  private createSceneTwoCharacterSprite(config: SceneSpriteConfig) {
    const defaultConfig =
      sceneTwoEnvironmentSprites.find((sprite) => sprite.id === config.id) ??
      sceneThreeEnvironmentSprites.find((sprite) => sprite.id === config.id) ??
      sceneFourEnvironmentSprites.find((sprite) => sprite.id === config.id);

    if (defaultConfig) {
      if (!Number.isFinite(config.width) || config.width < 48 || config.width > 260) {
        config.width = defaultConfig.width;
      }

      if (!Number.isFinite(config.height) || config.height < 120 || config.height > 420) {
        config.height = defaultConfig.height;
      }

      if (!Number.isFinite(config.x) || config.x < -200 || config.x > VIRTUAL_WIDTH + 200) {
        config.x = defaultConfig.x;
      }

      if (!Number.isFinite(config.y) || config.y < 700 || config.y > VIRTUAL_HEIGHT + 200) {
        config.y = defaultConfig.y;
      }
    }

    const idleClip = createSceneTwoCharacterClip();
    const walkClip = createSceneTwoCharacterWalkClip();
    const texture = walkClip.frames[0]?.texture ?? idleClip.frames[0]?.texture;
    const sprite = new Sprite(texture);
    const idleHeight = config.height;
    const idleWidth = config.width;
    const walkWidth = Math.round(idleWidth * 1.31);
    const walkHeight = Math.round(idleHeight * 1.05);

    const skipEntryWalk = config.runtimeType === "character";

    sprite.label = config.id;
    sprite.anchor.set(config.anchorX, config.anchorY);
    sprite.position.set(skipEntryWalk ? config.x : config.x - 520, config.y);
    sprite.width = skipEntryWalk ? idleWidth : walkWidth;
    sprite.height = skipEntryWalk ? idleHeight : walkHeight;
    if (config.scaleX !== undefined || config.scaleY !== undefined) {
      sprite.scale.set(config.scaleX ?? 1, config.scaleY ?? 1);
    }
    sprite.alpha = config.alpha ?? 1;
    sprite.zIndex = config.zIndex ?? 0;
    if (config.blendMode) {
      sprite.blendMode = config.blendMode;
    }

    const animator = new SpriteAnimator(sprite);
    if (skipEntryWalk) {
      animator.setSize(idleWidth, idleHeight);
      animator.play(idleClip);
    } else {
      animator.setSize(walkWidth, walkHeight);
      animator.play(walkClip);
    }
    this.environmentAnimators.push(animator);
    this.sceneWalkInCharacterRuntime = {
      sprite,
      animator,
      idleClip,
      walkClip,
      idleWidth,
      walkWidth,
      walkHeight,
      height: idleHeight,
      idleX: config.x,
      entryStartX: config.x - 520,
      walkSpeed: 0.11,
      hasEntered: skipEntryWalk,
      skipEntryWalk,
      targetX: null,
      inputDirection: 0,
    };

    return sprite;
  }

  private readonly handleTick = () => {
    if (!this.app) {
      return;
    }

    const deltaMs = this.app.ticker.deltaMS;

    for (const animator of this.environmentAnimators) {
      animator.update(deltaMs);
    }

    for (const entity of this.actorEntities) {
      entity.update(deltaMs);
    }

    for (const effectSystem of this.effectSystems) {
      effectSystem.update(deltaMs);
    }

    if (this.lightingEnabled) {
      for (const runtime of this.customLightsById.values()) {
        runtime.elapsedMs += deltaMs;
        const pulse = (Math.sin(runtime.elapsedMs * 0.00115) + 1) * 0.5;
        const scalePulse = Math.sin(runtime.elapsedMs * 0.00082 + 0.8) * 0.03;
        const entry = this.layoutEditableSpritesById.get(runtime.sprite.label);
        const baseAlpha =
          ((entry?.config.alpha ?? 0.22) * (entry?.config.light?.intensity ?? 1));

        runtime.sprite.alpha = Math.max(0, Math.min(1, baseAlpha + pulse * 0.03));
        runtime.sprite.width = runtime.baseWidth * (1 + scalePulse);
        runtime.sprite.height = runtime.baseHeight * (1 + scalePulse * 0.76);
        runtime.particleSystem?.update(deltaMs);
      }
    }

    this.updateSceneTwoCharacter(deltaMs);
    this.syncActorCharacterShadow();
    this.syncSceneWalkCharacterRainSplashes();

    this.updateActionMenuIcons(deltaMs);
    this.syncBubbleToTarget("character");
    this.syncBubbleToTarget("cat");
    this.updateBubble("character", deltaMs);
    this.updateBubble("cat", deltaMs);
  };

  private updateSceneTwoCharacter(deltaMs: number) {
    const runtime = this.sceneWalkInCharacterRuntime;

    if (!runtime) {
      return;
    }

    if (!runtime.hasEntered) {
      const nextX = Math.min(runtime.idleX, runtime.sprite.position.x + deltaMs * runtime.walkSpeed);
      runtime.sprite.position.x = nextX;

      if (nextX >= runtime.idleX) {
        runtime.sprite.position.x = runtime.idleX;
        runtime.animator.setSize(runtime.idleWidth, runtime.height);
        runtime.animator.play(runtime.idleClip);
        runtime.hasEntered = true;
      }

      this.syncWalkInCharacterShadow();
      this.syncSceneWalkCharacterRainSplashes();

      return;
    }

    if (runtime.inputDirection !== 0) {
      const speed = deltaMs * runtime.walkSpeed;
      const nextX = Math.max(
        WALKABLE_GROUND_MIN_X,
        Math.min(WALKABLE_GROUND_MAX_X, runtime.sprite.position.x + runtime.inputDirection * speed),
      );

      runtime.targetX = null;
      runtime.animator.setSize(runtime.walkWidth, runtime.walkHeight);
      runtime.animator.play(runtime.walkClip);
      runtime.sprite.scale.x =
        runtime.inputDirection > 0 ? Math.abs(runtime.sprite.scale.x) : -Math.abs(runtime.sprite.scale.x);
      runtime.sprite.position.x = nextX;
      this.syncWalkInCharacterShadow();
      this.syncSceneWalkCharacterRainSplashes();
      return;
    }

    if (runtime.targetX === null) {
      return;
    }

    const distance = runtime.targetX - runtime.sprite.position.x;

    if (Math.abs(distance) <= 4) {
      runtime.sprite.position.x = runtime.targetX;
      runtime.targetX = null;
      runtime.animator.setSize(runtime.idleWidth, runtime.height);
      runtime.animator.play(runtime.idleClip);
      runtime.sprite.scale.x = Math.abs(runtime.sprite.scale.x);
      this.syncWalkInCharacterShadow();
      this.syncSceneWalkCharacterRainSplashes();
      return;
    }

    const direction = distance > 0 ? 1 : -1;
    const speed = deltaMs * runtime.walkSpeed;
    const nextX =
      direction > 0
        ? Math.min(runtime.targetX, runtime.sprite.position.x + speed)
        : Math.max(runtime.targetX, runtime.sprite.position.x - speed);

    runtime.animator.setSize(runtime.walkWidth, runtime.walkHeight);
    runtime.animator.play(runtime.walkClip);
    runtime.sprite.scale.x = direction > 0 ? Math.abs(runtime.sprite.scale.x) : -Math.abs(runtime.sprite.scale.x);
    runtime.sprite.position.x = nextX;
    this.syncWalkInCharacterShadow();
    this.syncSceneWalkCharacterRainSplashes();
  }

  private syncWalkInCharacterShadow() {
    if (!this.walkInCharacterShadowSystem || !this.sceneWalkInCharacterRuntime) {
      return;
    }

    const sprite = this.sceneWalkInCharacterRuntime.sprite;
    this.walkInCharacterShadowSystem.setTarget(
      sprite.position.x,
      sprite.position.y,
      Math.abs(sprite.width),
    );
  }

  private syncActorCharacterShadow() {
    if (!this.actorCharacterShadowSystem || !this.characterEntity) {
      return;
    }

    const sprite = this.characterEntity.sprite;
    this.actorCharacterShadowSystem.setTarget(
      sprite.position.x,
      sprite.position.y,
      Math.abs(sprite.width),
    );
  }

  private syncSceneWalkCharacterRainSplashes() {
    if (!this.rainSystem) {
      return;
    }

    const dynamicZones: RainCollisionZone[] = [];

    for (const [spriteId, entry] of this.layoutEditableSpritesById.entries()) {
      const rainSplashSegments =
        entry.config.rainSplashSegments?.length
          ? entry.config.rainSplashSegments
          : entry.config.rainSplash
            ? [entry.config.rainSplash]
            : [];

      if (rainSplashSegments.length === 0) {
        continue;
      }

      const sprite = entry.sprite;
      const width = Math.abs(sprite.width);
      const height = Math.abs(sprite.height);
      const left = sprite.position.x - width * entry.config.anchorX;
      const top = sprite.position.y - height * entry.config.anchorY;

      rainSplashSegments.forEach((rainSplash, index) => {
        if (!rainSplash?.enabled) {
          return;
        }

        const widthScale = Math.max(rainSplash.widthRatio ?? 1, 0);
        const baseSplashMinX = left + width * (rainSplash.splashLeft ?? 0.25);
        const baseSplashMaxX = left + width * (rainSplash.splashRight ?? 0.75);
        const baseSplashCenterX = (baseSplashMinX + baseSplashMaxX) * 0.5;
        const baseSplashHalfWidth = Math.max((baseSplashMaxX - baseSplashMinX) * 0.5, 0);
        const scaledSplashHalfWidth = baseSplashHalfWidth * widthScale;

        dynamicZones.push({
          id: `${spriteId}-rain-splash-${index}`,
          minX: left + width * (rainSplash.zoneLeft ?? 0.2),
          maxX: left + width * (rainSplash.zoneRight ?? 0.8),
          minY: top + height * (rainSplash.zoneTop ?? 0.1),
          maxY: top + height * (rainSplash.zoneBottom ?? 0.3),
          splashMinX: baseSplashCenterX - scaledSplashHalfWidth,
          splashMaxX: baseSplashCenterX + scaledSplashHalfWidth,
          splashY: top + height * (rainSplash.splashY ?? 0.12),
          splashLayer: rainSplash.splashLayer,
          randomSpread: rainSplash.randomSpread,
          minWidth:
            rainSplash.minWidthRatio !== undefined
              ? width * rainSplash.minWidthRatio
              : rainSplash.minWidth,
          maxWidth:
            rainSplash.maxWidthRatio !== undefined
              ? width * rainSplash.maxWidthRatio
              : rainSplash.maxWidth,
          minDurationMs: rainSplash.minDurationMs,
          maxDurationMs: rainSplash.maxDurationMs,
        });
      });
    }

    this.rainSystem.setDynamicCollisionZones(dynamicZones);
  }

  private readonly handleSceneGroundClick = (event: FederatedPointerEvent) => {
    if (this.isLayoutModeEnabled) {
      return;
    }

    const runtime = this.sceneWalkInCharacterRuntime;

    if (!runtime || !runtime.hasEntered || !this.scaledSceneRoot) {
      return;
    }

    const localPoint = this.scaledSceneRoot.toLocal(event.global);

    if (localPoint.y < WALKABLE_GROUND_MIN_Y || localPoint.y > WALKABLE_GROUND_MAX_Y) {
      return;
    }

    runtime.targetX = Math.max(WALKABLE_GROUND_MIN_X, Math.min(WALKABLE_GROUND_MAX_X, localPoint.x));
    this.hideActionMenuIcons();
    this.hideBubble("character");
    this.hideBubble("cat");
    event.stopPropagation();
  };

  setWalkInputDirection(direction: -1 | 0 | 1) {
    const runtime = this.sceneWalkInCharacterRuntime;

    if (!runtime || !runtime.hasEntered) {
      return;
    }

    runtime.inputDirection = direction;

    if (direction === 0 && runtime.targetX === null) {
      runtime.animator.setSize(runtime.idleWidth, runtime.height);
      runtime.animator.play(runtime.idleClip);
      runtime.sprite.scale.x = Math.abs(runtime.sprite.scale.x);
      this.syncWalkInCharacterShadow();
      this.syncSceneWalkCharacterRainSplashes();
    }
  }

  private readonly handleCharacterClick = () => {
    const overrideMessage = this.options.getInteractionOverrideMessage?.("character");

    if (overrideMessage) {
      this.activeCharacterBubbleOverrideMessage = overrideMessage;
      this.hideActionMenuIcons();
      this.showBubble("character");
      return;
    }

    this.activeCharacterBubbleOverrideMessage = null;
    this.hideActionMenuIcons();
    this.activeCharacterBubbleMessageIndex = this.characterBubbleMessageIndex;
    this.showBubble("character");

    if (characterBubbleMessages.length === 0) {
      return;
    }

    this.characterBubbleMessageIndex =
      (this.characterBubbleMessageIndex + 1) % characterBubbleMessages.length;

    this.options.onCharacterClick?.();
  };

  private readonly handleCatClick = () => {
    const overrideMessage = this.options.getInteractionOverrideMessage?.("cat");

    if (overrideMessage) {
      this.activeCharacterBubbleOverrideMessage = overrideMessage;
      this.hideActionMenuIcons();
      this.showBubble("character");
      return;
    }

    this.hideActionMenuIcons();
    this.showBubble("cat");
  };

  private readonly handleSignClick = () => {
    if (this.isLayoutModeEnabled) {
      this.setSelectedLayoutSprite("sign");
      return;
    }

    const overrideMessage = this.options.getInteractionOverrideMessage?.("sign");

    if (overrideMessage) {
      this.activeCharacterBubbleOverrideMessage = overrideMessage;
      this.hideActionMenuIcons();
      this.showBubble("character");
      return;
    }

    this.activeCharacterBubbleOverrideMessage = SIGN_HINT_MESSAGE;
    this.hideActionMenuIcons();
    this.showBubble("character");
  };

  private handleObjectActionMenuClick(objectId: string, event?: FederatedPointerEvent) {
    if (this.isLayoutModeEnabled) {
      this.setSelectedLayoutSprite(objectId);
      return;
    }

    if (!this.isSpriteClickableForGameplay(objectId)) {
      return;
    }

    const overrideMessage = this.options.getInteractionOverrideMessage?.(objectId);

    if (overrideMessage) {
      this.activeCharacterBubbleOverrideMessage = overrideMessage;
      this.hideActionMenuIcons();
      this.showBubble("character");
      return;
    }

    const menu = this.actionMenuConfigByObjectId.get(objectId);
    const message = interactiveObjectMessages.get(objectId) ?? null;
    const defaultActionId = this.options.getDefaultObjectActionId?.(objectId);
    const enabledIcons = this.getEnabledActionMenuIcons(objectId);
    const interaction = this.getResolvedInteractionConfig(objectId);

    if (defaultActionId) {
      this.hideActionMenuIcons();
      this.options.onActionMenuAction?.(objectId, defaultActionId);
      return;
    }

    if (interaction.hasDrawer && !interaction.hasInfo) {
      this.hideActionMenuIcons();
      this.options.onActionMenuAction?.(objectId, `${objectId}-generic-info`);
      return;
    }

    if (enabledIcons.length === 0) {
      if (interaction.bubbleMessage || message) {
        this.activeCharacterBubbleOverrideMessage = interaction.bubbleMessage ?? message;
        this.hideActionMenuIcons();
        this.showBubble("character");
      }

      return;
    }

    this.activeCharacterBubbleOverrideMessage =
      interaction.bubbleMessage ?? menu?.onInteractMessage ?? message;
    this.updateActionMenuAnchor(objectId, event);
    this.showActionMenuIcons(objectId);
    this.showBubble("character");
  }

  private updateActionMenuAnchor(objectId: string, event?: FederatedPointerEvent) {
    if (!event || !this.layers) {
      this.actionMenuAnchor = null;
      return;
    }

    const localPoint = this.layers.effectsLayer.toLocal(event.global);
    this.actionMenuAnchor = {
      menuId: objectId,
      x: localPoint.x,
      y: localPoint.y,
    };
  }

  private handleActionMenuIconClick(icon: ActionMenuIconRuntime) {
    const layoutInteraction = this.layoutEditableSpritesById.get(icon.objectId)?.config.interaction;
    const shouldPreferLayoutInfo =
      icon.kind === "info" &&
      Boolean(
        layoutInteraction?.infoModal ||
          layoutInteraction?.hasInfo,
      );

    if (shouldPreferLayoutInfo) {
      this.options.onActionMenuAction?.(icon.objectId, `${icon.objectId}-generic-info`);
      this.hideActionMenuIcons();

      return;
    }

    if (icon.actionId.endsWith("-generic-info") || icon.actionId.endsWith("-generic-collect")) {
      this.options.onActionMenuAction?.(icon.objectId, icon.actionId);
      this.hideActionMenuIcons();

      return;
    }

    this.options.onActionMenuAction?.(icon.objectId, icon.actionId);
    this.hideActionMenuIcons();

    if (icon.consumeObjectOnUse) {
      this.consumeSceneObject(icon.objectId);
    }

    if (icon.message) {
      this.activeCharacterBubbleOverrideMessage = icon.message;
      this.showBubble("character");
    }
  }

  private handleActionMenuIconHover(icon: ActionMenuIconRuntime, isHovering: boolean) {
    if (!icon.sprite.visible) {
      return;
    }

    const { targetY: baseTargetY } = this.getActionMenuIconPositions(icon);
    const targetScale =
      (this.actionMenuIconsState === "revealing" ? icon.sprite.scale.x : 1) *
      (isHovering ? ACTION_MENU_ICON_HOVER_SCALE : 1);
    const baseScale = this.actionMenuIconsState === "revealing" ? icon.sprite.scale.x : 1;
    const scaleDelta = targetScale - baseScale;
    const hoverTargetY = baseTargetY + (icon.height * scaleDelta) / 2;

    gsap.to(icon.sprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });

    gsap.to(icon.sprite.position, {
      y: isHovering ? hoverTargetY : baseTargetY,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });
  }

  private handleInteractiveHoverChange(isHovering: boolean) {
    if (this.isLayoutModeEnabled) {
      this.options.onInteractiveHoverChange?.(false);
      return;
    }

    this.options.onInteractiveHoverChange?.(isHovering);
  }

  private handleLayoutPointerDown(spriteId: string, event: FederatedPointerEvent) {
    if (!this.isLayoutModeEnabled) {
      return;
    }

    const entry = this.layoutEditableSpritesById.get(spriteId);
    const parent = entry?.sprite.parent;

    if (!entry || !parent) {
      return;
    }

    const localPoint = parent.toLocal(event.global);

    this.selectedLayoutSpriteId = spriteId;
    this.activeLayoutDrag = {
      spriteId,
      parent,
      offsetX: entry.sprite.position.x - localPoint.x,
      offsetY: entry.sprite.position.y - localPoint.y,
    };

    this.refreshLayoutEditableSpriteInteractions();
    this.emitLayoutStateChange();
    event.stopPropagation();
  }

  private readonly handleLayoutPointerMove = (event: FederatedPointerEvent) => {
    if (!this.isLayoutModeEnabled || !this.activeLayoutDrag) {
      return;
    }

    const entry = this.layoutEditableSpritesById.get(this.activeLayoutDrag.spriteId);

    if (!entry) {
      return;
    }

    const localPoint = this.activeLayoutDrag.parent.toLocal(event.global);
    entry.sprite.position.set(
      Math.round(localPoint.x + this.activeLayoutDrag.offsetX),
      Math.round(localPoint.y + this.activeLayoutDrag.offsetY),
    );
    this.emitLayoutStateChange();
  };

  private readonly handleLayoutPointerUp = () => {
    if (!this.activeLayoutDrag) {
      return;
    }

    this.activeLayoutDrag = null;
    this.refreshLayoutEditableSpriteInteractions();
    this.emitLayoutStateChange();
  };

  private consumeSceneObject(objectId: string) {
    const sprite = this.environmentSpritesById.get(objectId);

    if (!sprite) {
      return;
    }

    sprite.visible = false;
    sprite.eventMode = "none";
  }

  public consumeLayoutSprite(objectId: string) {
    const entry = this.layoutEditableSpritesById.get(objectId);

    if (!entry) {
      return;
    }

    this.collectedLayoutSpriteIds.add(objectId);
    entry.sprite.visible = false;
    entry.sprite.eventMode = "none";
  }

  private showActionMenuIcons(menuId: string) {
    this.actionMenuIconsState = "revealing";
    this.actionMenuIconsElapsedMs = 0;
    const enabledIconIds = new Set(this.getEnabledActionMenuIcons(menuId).map((icon) => icon.actionId));

    for (const icon of this.actionMenuIcons) {
      const isActive = icon.menuId === menuId && enabledIconIds.has(icon.actionId);
      const { originX, originY } = this.getActionMenuIconPositions(icon);
      icon.sprite.visible = isActive;
      icon.sprite.alpha = 0;
      icon.sprite.scale.set(0.6);
      icon.sprite.position.set(originX, originY);
    }
  }

  private hideActionMenuIcons() {
    this.actionMenuIconsState = "hidden";
    this.actionMenuIconsElapsedMs = 0;
    this.actionMenuAnchor = null;

    for (const icon of this.actionMenuIcons) {
      const { originX, originY } = this.getActionMenuIconPositions(icon);
      icon.sprite.visible = false;
      icon.sprite.alpha = 0;
      icon.sprite.scale.set(0.6);
      icon.sprite.position.set(originX, originY);
    }
  }

  private updateActionMenuIcons(deltaMs: number) {
    if (this.actionMenuIconsState !== "revealing") {
      return;
    }

    this.actionMenuIconsElapsedMs += deltaMs;
    const progress = Math.min(this.actionMenuIconsElapsedMs / ACTION_MENU_ICONS_REVEAL_MS, 1);
    const easedProgress = 1 - (1 - progress) * (1 - progress);

    for (const icon of this.actionMenuIcons) {
      if (!icon.sprite.visible) {
        continue;
      }

      const { originX, originY, targetX, targetY } = this.getActionMenuIconPositions(icon);
      icon.sprite.alpha = easedProgress;
      icon.sprite.scale.set(0.6 + 0.4 * easedProgress);
      icon.sprite.position.set(
        originX + (targetX - originX) * easedProgress,
        originY + (targetY - originY) * easedProgress,
      );
    }

    if (progress >= 1) {
      this.actionMenuIconsState = "visible";
    }
  }

  private getActionMenuIconPositions(icon: ActionMenuIconRuntime) {
    if (this.actionMenuAnchor && this.actionMenuAnchor.menuId === icon.menuId) {
      return {
        originX: this.actionMenuAnchor.x + icon.originOffsetX,
        originY: this.actionMenuAnchor.y + icon.originOffsetY,
        targetX: this.actionMenuAnchor.x + icon.targetOffsetX,
        targetY: this.actionMenuAnchor.y + icon.targetOffsetY,
      };
    }

    const objectSprite = this.environmentSpritesById.get(icon.objectId);
    const baseX = objectSprite?.position.x ?? 0;
    const baseY = objectSprite?.position.y ?? 0;

    return {
      originX: baseX + icon.originOffsetX,
      originY: baseY + icon.originOffsetY,
      targetX: baseX + icon.targetOffsetX,
      targetY: baseY + icon.targetOffsetY,
    };
  }

  private createBubbleSprite(
    label: string,
    assetId: "bubble" | "bubbleMouse",
    x: number,
    y: number,
    width: number,
    height: number,
    withText: boolean,
  ) {
    const texture = Assets.get(assetId) as Texture;
    const bubble = new Sprite(texture);

    bubble.label = label;
    bubble.anchor.set(0.5, 1);
    bubble.position.set(x, y);
    bubble.width = width;
    bubble.height = height;
    bubble.alpha = 0;
    bubble.visible = false;

    let text: Text | null = null;

    if (withText) {
      text = new Text({
        text: "",
        style: new TextStyle({
          fill: "#3a2415",
          fontFamily: "Pixelify Sans",
          fontSize: 16,
          fontWeight: "600",
          lineHeight: 18,
          wordWrap: true,
          wordWrapWidth: 215,
        }),
      });
      text.label = `${label}-text`;
      text.anchor.set(0.5, 0.5);
      text.position.set(x, y - 50);
      text.alpha = 0;
      text.visible = false;
    }

    return { sprite: bubble, text };
  }

  private syncBubbleToTarget(target: BubbleTarget) {
    const bubble = this.getBubbleRuntime(target);
    const targetSprite = bubble.followSprite;

    if (!bubble.sprite || !targetSprite) {
      return;
    }

    const targetX = targetSprite.position.x + bubble.offsetX;
    const targetY = targetSprite.position.y - Math.abs(targetSprite.height) + bubble.offsetY;

    bubble.baseX = targetX;
    bubble.baseY = targetY;

    if (bubble.state === "hidden") {
      bubble.sprite.position.set(targetX, targetY);

      if (bubble.text) {
        bubble.text.position.set(
          targetX,
          targetY - bubble.baseHeight * CHARACTER_BUBBLE_TEXT_Y_RATIO,
        );
      }

      return;
    }

    bubble.sprite.position.set(targetX, targetY);

    if (bubble.text) {
      bubble.text.position.set(
        targetX,
        targetY - bubble.sprite.height * CHARACTER_BUBBLE_TEXT_Y_RATIO,
      );
    }
  }

  private readonly showBubble = (target: BubbleTarget) => {
    const bubble = this.getBubbleRuntime(target);
    const bubbleSprite = bubble.sprite;

    if (!bubbleSprite) {
      return;
    }

    if (target === "character") {
      this.hideBubble("cat");
    } else {
      this.hideBubble("character");
    }

    bubbleSprite.visible = true;
    bubbleSprite.alpha = 0;
    bubble.state = "fadingIn";
    bubble.visibleElapsedMs = 0;
    bubble.typingElapsedMs = 0;
    bubble.displayedTextLength = 0;

    if (bubble.text) {
      const fullText =
        target === "character"
          ? this.activeCharacterBubbleOverrideMessage ??
            characterBubbleMessages[this.activeCharacterBubbleMessageIndex] ??
            DEFAULT_CHARACTER_BUBBLE_MESSAGE
          : "";

      if (target === "character" && fullText) {
        this.configureCharacterBubbleLayout(fullText);
      }

      bubble.text.text = "";
      bubble.text.alpha = 0;
      bubble.text.visible = true;
    }
  };

  private hideBubble(target: BubbleTarget) {
    const bubble = this.getBubbleRuntime(target);
    const bubbleSprite = bubble.sprite;

    if (!bubbleSprite) {
      return;
    }

    bubbleSprite.alpha = 0;
    bubbleSprite.visible = false;
    bubble.state = "hidden";
    bubble.visibleElapsedMs = 0;
    bubble.typingElapsedMs = 0;
    bubble.displayedTextLength = 0;

    if (bubble.text) {
      bubble.text.text = "";
      bubble.text.alpha = 0;
      bubble.text.visible = false;
    }

    bubbleSprite.position.set(bubble.baseX, bubble.baseY);
    bubbleSprite.width = bubble.baseWidth;
    bubbleSprite.height = bubble.baseHeight;

    if (bubble.text) {
      bubble.text.position.set(
        bubble.baseX,
        bubble.baseY - bubble.baseHeight * CHARACTER_BUBBLE_TEXT_Y_RATIO,
      );
    }
  }

  private updateBubble(target: BubbleTarget, deltaMs: number) {
    const bubble = this.getBubbleRuntime(target);
    const bubbleSprite = bubble.sprite;

    if (!bubbleSprite) {
      return;
    }

    if (bubble.state === "fadingIn") {
      bubbleSprite.alpha = Math.min(bubbleSprite.alpha + deltaMs / BUBBLE_FADE_IN_MS, 1);
      if (bubble.text) {
        bubble.text.alpha = bubbleSprite.alpha;
      }

      if (bubbleSprite.alpha >= 1) {
        bubble.state = "visible";
        bubble.visibleElapsedMs = 0;
      }
      return;
    }

    if (bubble.state === "visible") {
      bubble.visibleElapsedMs += deltaMs;
      this.updateCharacterBubbleTyping(target, deltaMs);

      if (bubble.visibleElapsedMs >= BUBBLE_VISIBLE_MS) {
        bubble.state = "fadingOut";
      }
      return;
    }

    if (bubble.state !== "fadingOut") {
      return;
    }

    bubbleSprite.alpha = Math.max(bubbleSprite.alpha - deltaMs / BUBBLE_FADE_OUT_MS, 0);
    if (bubble.text) {
      bubble.text.alpha = bubbleSprite.alpha;
    }

    if (bubbleSprite.alpha <= 0) {
      this.hideBubble(target);
    }
  }

  private getBubbleRuntime(target: BubbleTarget) {
    return target === "character" ? this.characterBubble : this.catBubble;
  }

  private updateCharacterBubbleTyping(target: BubbleTarget, deltaMs: number) {
    if (target !== "character") {
      return;
    }

    const bubble = this.characterBubble;
    const currentText =
      this.activeCharacterBubbleOverrideMessage ??
      characterBubbleMessages[this.activeCharacterBubbleMessageIndex] ??
      DEFAULT_CHARACTER_BUBBLE_MESSAGE;

    if (!bubble.text || bubble.displayedTextLength >= currentText.length) {
      return;
    }

    bubble.typingElapsedMs += deltaMs;
    const nextLength = Math.min(
      currentText.length,
      Math.floor(bubble.typingElapsedMs / CHARACTER_TYPING_STEP_MS),
    );

    if (nextLength === bubble.displayedTextLength) {
      return;
    }

    bubble.displayedTextLength = nextLength;
    bubble.text.text = currentText.slice(0, nextLength);
  }

  private configureCharacterBubbleLayout(fullText: string) {
    const bubble = this.characterBubble;

    if (!bubble.sprite || !bubble.text) {
      return;
    }

    const style = bubble.text.style;
    let wrapWidth = CHARACTER_BUBBLE_MIN_WIDTH - CHARACTER_BUBBLE_HORIZONTAL_PADDING;

    style.wordWrapWidth = wrapWidth;
    bubble.text.text = fullText;

    while (
      bubble.text.height > CHARACTER_BUBBLE_MIN_HEIGHT - CHARACTER_BUBBLE_VERTICAL_PADDING &&
      wrapWidth < CHARACTER_BUBBLE_MAX_WIDTH - CHARACTER_BUBBLE_HORIZONTAL_PADDING
    ) {
      wrapWidth = Math.min(
        wrapWidth + 20,
        CHARACTER_BUBBLE_MAX_WIDTH - CHARACTER_BUBBLE_HORIZONTAL_PADDING,
      );
      style.wordWrapWidth = wrapWidth;
      bubble.text.text = fullText;
    }

    const bubbleWidth = Math.max(
      CHARACTER_BUBBLE_MIN_WIDTH,
      Math.min(
        CHARACTER_BUBBLE_MAX_WIDTH,
        Math.ceil(bubble.text.width + CHARACTER_BUBBLE_HORIZONTAL_PADDING),
      ),
    );
    const bubbleHeight = Math.max(
      CHARACTER_BUBBLE_MIN_HEIGHT,
      Math.min(
        CHARACTER_BUBBLE_MAX_HEIGHT,
        Math.ceil(
          bubble.text.height +
            CHARACTER_BUBBLE_VERTICAL_PADDING +
            CHARACTER_BUBBLE_TAIL_ALLOWANCE,
        ),
      ),
    );

    bubble.sprite.position.set(bubble.baseX, bubble.baseY);
    bubble.sprite.width = bubbleWidth;
    bubble.sprite.height = bubbleHeight;
    bubble.text.position.set(
      bubble.baseX,
      bubble.baseY - bubbleHeight * CHARACTER_BUBBLE_TEXT_Y_RATIO,
    );
    bubble.text.text = "";
  }
}
