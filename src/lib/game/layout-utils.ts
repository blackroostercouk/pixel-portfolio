import {
  effectSprites,
  environmentSprites,
  sceneFourEnvironmentSprites,
  sceneThreeEnvironmentSprites,
  sceneTwoEnvironmentSprites,
} from "@/lib/game/scene-data";
import type {
  LayoutSpriteSnapshot,
  SceneInfoModalConfig,
  SceneInfoModalStageConfig,
  SceneInfoModalStageId,
  SceneSpriteRainSplashConfig,
} from "@/lib/game/types";
import type { SceneId } from "@/lib/game/core/game-state";

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

export function hasStageContent(stage?: SceneInfoModalStageConfig) {
  if (!stage) return false;
  return Boolean(
    stage.title ||
      stage.text ||
      stage.imageSrc ||
      stage.secondImageSrc ||
      stage.inputEnabled ||
      stage.inputPlaceholder ||
      stage.correctAnswer,
  );
}

const INFO_MODAL_STAGE_ORDER: SceneInfoModalStageId[] = ["normal", "updated", "final"];

export function resolveInfoModalStage(
  config: SceneInfoModalConfig | undefined,
  preferredStage: SceneInfoModalStageId,
) {
  if (!config) {
    return { stageId: preferredStage, stage: undefined as SceneInfoModalStageConfig | undefined };
  }

  const preferred = config[preferredStage];
  if (hasStageContent(preferred)) {
    return { stageId: preferredStage, stage: preferred };
  }

  for (const stageId of INFO_MODAL_STAGE_ORDER) {
    const stage = config[stageId];
    if (hasStageContent(stage)) {
      return { stageId, stage };
    }
  }

  return { stageId: preferredStage, stage: preferred };
}

export function getNextInfoModalStage(
  config: SceneInfoModalConfig | undefined,
  currentStageId: SceneInfoModalStageId,
) {
  const currentIndex = INFO_MODAL_STAGE_ORDER.indexOf(currentStageId);

  for (let i = currentIndex + 1; i < INFO_MODAL_STAGE_ORDER.length; i++) {
    const nextStageId = INFO_MODAL_STAGE_ORDER[i];
    const nextStage = config?.[nextStageId];
    if (hasStageContent(nextStage)) return nextStageId;
  }

  return currentStageId;
}

export function createDefaultRainSplashConfig(): SceneSpriteRainSplashConfig {
  return {
    enabled: true,
    zoneLeft: 0,
    zoneRight: 1,
    zoneTop: 0.08,
    zoneBottom: 0.28,
    splashLeft: 0,
    splashRight: 1,
    splashY: 0.12,
    splashLayer: "scene",
    randomSpread: 0,
    widthRatio: 1,
    minWidthRatio: 0.1,
    maxWidthRatio: 0.22,
    minDurationMs: 180,
    maxDurationMs: 320,
  };
}

type SpriteConfig =
  | (typeof environmentSprites)[number]
  | (typeof effectSprites)[number];

export function createLayoutSnapshotFromConfig(sprite: SpriteConfig): LayoutSpriteSnapshot {
  return {
    id: sprite.id,
    assetId: sprite.assetId,
    src: sprite.src,
    runtimeType: sprite.runtimeType,
    x: sprite.x,
    y: sprite.y,
    width: sprite.width,
    height: sprite.height,
    anchorX: sprite.anchorX,
    anchorY: sprite.anchorY,
    scaleX: sprite.scaleX,
    scaleY: sprite.scaleY,
    rotation: sprite.rotation,
    alpha: sprite.alpha,
    blendMode: sprite.blendMode,
    ignoreSceneScale: sprite.ignoreSceneScale,
    layer: sprite.layer,
    zIndex: sprite.zIndex ?? 0,
    interaction: sprite.interaction,
    rainSplash: sprite.rainSplash,
    rainSplashSegments: sprite.rainSplashSegments,
    visuals: sprite.visuals,
    light: sprite.light,
    particles: sprite.particles,
  };
}

export function getBaseSceneLayoutSprites(sceneId: SceneId): LayoutSpriteSnapshot[] {
  if (sceneId === "scene-1") {
    return [...environmentSprites, ...effectSprites].map(createLayoutSnapshotFromConfig);
  }
  if (sceneId === "scene-2") {
    return sceneTwoEnvironmentSprites.map(createLayoutSnapshotFromConfig);
  }
  if (sceneId === "scene-3") {
    return sceneThreeEnvironmentSprites.map(createLayoutSnapshotFromConfig);
  }
  if (sceneId === "scene-4") {
    return sceneFourEnvironmentSprites.map(createLayoutSnapshotFromConfig);
  }
  return [];
}

export function loadImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.onerror = () => resolve({ width: 1, height: 1 });
    image.src = src;
  });
}

export function clampAudioVolume(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function pickRotatingMessage(
  messages: string[],
  rotationKey: string,
  rotations: { current: Record<string, number> },
) {
  const nextIndex = rotations.current[rotationKey] ?? 0;
  rotations.current[rotationKey] = nextIndex + 1;
  return messages[nextIndex % messages.length] ?? null;
}
