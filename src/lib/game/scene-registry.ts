import type { SceneId } from "./core/game-state";
import {
  rainSceneBuilderConfig,
  rainSceneOneConfig,
  rainSceneFourConfig,
  rainSceneThreeConfig,
  rainSceneTwoConfig,
} from "./effects/rain-scene-configs";

export type SceneDefinition = {
  id: SceneId;
  label: string;
  backgroundAssetId: "background" | "backgroundScene2" | "backgroundScene3" | "backgroundScene4";
  enableEnvironmentSprites: boolean;
  enableActorSprites: boolean;
  enableEffectSprites: boolean;
  enablePuddleShimmer: boolean;
  enableLampEffects: boolean;
  rainConfig: typeof rainSceneOneConfig;
  loadingBackdropSrc: string;
};

export const sceneRegistry: Record<SceneId, SceneDefinition> = {
  "scene-1": {
    id: "scene-1",
    label: "Scene 1",
    backgroundAssetId: "background",
    enableEnvironmentSprites: true,
    enableActorSprites: true,
    enableEffectSprites: true,
    enablePuddleShimmer: true,
    enableLampEffects: true,
    rainConfig: rainSceneOneConfig,
    loadingBackdropSrc: "/assets/scene/background_moon.webp",
  },
  "scene-2": {
    id: "scene-2",
    label: "Scene 2",
    backgroundAssetId: "backgroundScene2",
    enableEnvironmentSprites: true,
    enableActorSprites: false,
    enableEffectSprites: false,
    enablePuddleShimmer: true,
    enableLampEffects: false,
    rainConfig: rainSceneTwoConfig,
    loadingBackdropSrc: "/assets/scene/scene_second.webp",
  },
  "scene-3": {
    id: "scene-3",
    label: "Scene 3",
    backgroundAssetId: "backgroundScene3",
    enableEnvironmentSprites: true,
    enableActorSprites: false,
    enableEffectSprites: false,
    enablePuddleShimmer: true,
    enableLampEffects: false,
    rainConfig: rainSceneThreeConfig,
    loadingBackdropSrc: "/assets/scene/shopify/shopify_bg.webp",
  },
  "scene-4": {
    id: "scene-4",
    label: "Scene 4",
    backgroundAssetId: "background",
    enableEnvironmentSprites: true,
    enableActorSprites: false,
    enableEffectSprites: false,
    enablePuddleShimmer: true,
    enableLampEffects: false,
    rainConfig: rainSceneFourConfig,
    loadingBackdropSrc: "/assets/scene/background_moon.webp",
  },
  "scene-builder": {
    id: "scene-builder",
    label: "Scene Builder",
    backgroundAssetId: "background",
    enableEnvironmentSprites: true,
    enableActorSprites: false,
    enableEffectSprites: false,
    enablePuddleShimmer: false,
    enableLampEffects: false,
    rainConfig: rainSceneBuilderConfig,
    loadingBackdropSrc: "/assets/scene/background_moon.webp",
  },
};
