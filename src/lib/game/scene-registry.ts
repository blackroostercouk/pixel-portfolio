import type { SceneId } from "./core/game-state";
import { rainSceneBuilderConfig } from "./effects/rain-scene-configs";

export type SceneDefinition = {
  id: SceneId;
  label: string;
  backgroundAssetId: "background";
  enableEnvironmentSprites: boolean;
  enableActorSprites: boolean;
  enableEffectSprites: boolean;
  enablePuddleShimmer: boolean;
  enableLampEffects: boolean;
  rainConfig: typeof rainSceneBuilderConfig;
  loadingBackdropSrc: string;
};

export const sceneRegistry: Record<SceneId, SceneDefinition> = {
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
