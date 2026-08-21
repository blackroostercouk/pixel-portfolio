"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { getBaseSceneLayoutSprites, loadImageDimensions } from "@/lib/game/layout-utils";
import {
  type BuilderAnimatedPreset,
  type BuilderAssetType,
  BUILDER_ANIMATED_PRESET_OPTIONS as _unused,
} from "@/lib/game/builder-constants";
import type { PixelSceneController } from "@/lib/game/pixel-scene-controller";
import type { SceneThreeSmokeControls, LayoutSpriteSnapshot, SceneSpriteRainSplashSegmentConfig } from "@/lib/game/types";
import type { SceneId } from "@/lib/game/core/game-state";
import { createDefaultRainSplashConfig } from "@/lib/game/layout-utils";

export type BuilderSceneDefinition = {
  id: string;
  label: string;
  backgroundSrc: string | null;
  sprites: LayoutSpriteSnapshot[];
};

export type SceneOverrideDefinition = {
  backgroundSrc?: string | null;
  sprites?: LayoutSpriteSnapshot[];
};

export type LayoutSaveState = "idle" | "saving" | "saved" | "error";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _forTypeCheck = _unused;

export function useSceneLayoutEditor(
  currentSceneId: SceneId | "scene-builder",
  controllerRef: React.RefObject<PixelSceneController | null>,
) {
  // ─── Scene overrides ─────────────────────────────────────────────────
  const [sceneOverrides, setSceneOverrides] = useState<
    Partial<Record<SceneId, SceneOverrideDefinition>>
  >({});
  const sceneOverridesRef = useRef<Partial<Record<SceneId, SceneOverrideDefinition>>>({});
  sceneOverridesRef.current = sceneOverrides;
  const hasLoadedSceneOverridesRef = useRef(false);
  const lastPersistedSceneOverridesJsonRef = useRef("{}");
  const autoPersistSceneOverridesTimeoutRef = useRef<number | null>(null);

  // ─── Layout sprites ───────────────────────────────────────────────────
  const [layoutSprites, setLayoutSprites] = useState<LayoutSpriteSnapshot[]>([]);
  const [selectedLayoutSpriteId, setSelectedLayoutSpriteId] = useState<string | null>(null);
  const [sceneThreeSmokeControls, setSceneThreeSmokeControls] =
    useState<SceneThreeSmokeControls | null>(null);
  const latestLayoutSpritesRef = useRef<LayoutSpriteSnapshot[]>([]);
  const [selectedRainSplashSegmentIndex, setSelectedRainSplashSegmentIndex] = useState(0);

  // ─── Save state ───────────────────────────────────────────────────────
  const [layoutSaveState, setLayoutSaveState] = useState<LayoutSaveState>("idle");
  const [layoutSaveLabel, setLayoutSaveLabel] = useState("");
  const [sceneOverrideRenderVersion, setSceneOverrideRenderVersion] = useState(0);

  // ─── Builder scenes ───────────────────────────────────────────────────
  const [builderScenes, setBuilderScenes] = useState<BuilderSceneDefinition[]>([]);
  const [activeBuilderSceneId, setActiveBuilderSceneId] = useState("builder-scene-1");
  const [builderSceneRenderVersion, setBuilderSceneRenderVersion] = useState(0);
  const [newBuilderSceneName, setNewBuilderSceneName] = useState("");

  // ─── Builder assets ───────────────────────────────────────────────────
  const [builderAssetOptions, setBuilderAssetOptions] = useState<{
    backgrounds: string[];
    items: string[];
  }>({ backgrounds: [], items: [] });
  const [isUploadingBuilderAsset, setIsUploadingBuilderAsset] = useState(false);
  const [selectedBuilderItemSrc, setSelectedBuilderItemSrc] = useState("");
  const [builderItemSearchQuery, setBuilderItemSearchQuery] = useState("");
  const [selectedBuilderAssetType, setSelectedBuilderAssetType] =
    useState<BuilderAssetType>("prop");
  const [selectedBuilderAnimatedPreset, setSelectedBuilderAnimatedPreset] =
    useState<BuilderAnimatedPreset>("main-character");

  // ─── Derived values ───────────────────────────────────────────────────
  const activeSceneOverride = sceneOverrides[currentSceneId as SceneId];
  const activeBuilderScene =
    builderScenes.find((s) => s.id === activeBuilderSceneId) ?? builderScenes[0];

  const smokeLayoutSprite = sceneThreeSmokeControls
    ? {
        id: "scene3-smoke",
        assetId: "scene3Smoke" as const,
        x: Math.round(sceneThreeSmokeControls.x),
        y: Math.round(sceneThreeSmokeControls.y),
        width: Math.round(96 * sceneThreeSmokeControls.scale),
        height: Math.round(96 * sceneThreeSmokeControls.scale),
        anchorX: 0.5,
        anchorY: 1,
        layer: "effectsLayer" as const,
        zIndex: sceneThreeSmokeControls.zIndex,
      }
    : null;

  const layoutSpritesWithSmoke = smokeLayoutSprite
    ? [...layoutSprites.filter((s) => s.id !== "scene3-smoke"), smokeLayoutSprite]
    : layoutSprites;

  latestLayoutSpritesRef.current = layoutSpritesWithSmoke;

  const effectiveLayoutSprites =
    currentSceneId === "scene-builder"
      ? activeBuilderScene?.sprites ?? []
      : activeSceneOverride?.sprites ?? layoutSprites;

  const visibleLayoutSprites =
    currentSceneId === "scene-builder" ? effectiveLayoutSprites : layoutSpritesWithSmoke;

  const filteredBuilderItemOptions = builderAssetOptions.items.filter((src) => {
    const query = builderItemSearchQuery.trim().toLowerCase();
    return !query || src.toLowerCase().includes(query);
  });

  // ─── Load scene overrides ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/scene-overrides", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          overrides?: Partial<Record<SceneId, SceneOverrideDefinition>>;
        };
        if (data.overrides) {
          lastPersistedSceneOverridesJsonRef.current = JSON.stringify(data.overrides);
          setSceneOverrides(data.overrides);
          setSceneOverrideRenderVersion((v) => v + 1);
        }
      } catch {
        // ignore
      } finally {
        hasLoadedSceneOverridesRef.current = true;
      }
    };
    void load();
  }, []);

  // ─── Auto-persist scene overrides ────────────────────────────────────
  useEffect(() => {
    if (!hasLoadedSceneOverridesRef.current) return;

    if (autoPersistSceneOverridesTimeoutRef.current !== null) {
      window.clearTimeout(autoPersistSceneOverridesTimeoutRef.current);
    }

    const nextJson = JSON.stringify(sceneOverrides);
    if (nextJson === lastPersistedSceneOverridesJsonRef.current) return;

    autoPersistSceneOverridesTimeoutRef.current = window.setTimeout(() => {
      setLayoutSaveState("saving");
      setLayoutSaveLabel("Auto-saving...");
      void persistSceneOverrides(sceneOverridesRef.current)
        .then(() => {
          lastPersistedSceneOverridesJsonRef.current = JSON.stringify(sceneOverridesRef.current);
          markLayoutSaveSuccess();
        })
        .catch(() => markLayoutSaveError())
        .finally(() => {
          autoPersistSceneOverridesTimeoutRef.current = null;
        });
    }, 220);

    return () => {
      if (autoPersistSceneOverridesTimeoutRef.current !== null) {
        window.clearTimeout(autoPersistSceneOverridesTimeoutRef.current);
        autoPersistSceneOverridesTimeoutRef.current = null;
      }
    };
  }, [sceneOverrides]);

  // ─── Sync layout sprites when scene changes ───────────────────────────
  useEffect(() => {
    if (currentSceneId === "scene-builder") {
      setLayoutSprites([]);
      return;
    }
    const nextSprites = activeSceneOverride?.sprites ?? getBaseSceneLayoutSprites(currentSceneId as SceneId);
    setLayoutSprites(nextSprites);
    setSelectedLayoutSpriteId((current) =>
      current && nextSprites.some((s) => s.id === current) ? current : null,
    );
  }, [activeSceneOverride, currentSceneId]);

  // ─── Reset rain splash segment when sprite changes ────────────────────
  useEffect(() => {
    setSelectedRainSplashSegmentIndex(0);
  }, [selectedLayoutSpriteId]);

  // ─── Load builder scenes ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/builder-scenes");
        if (!res.ok) return;
        const data = (await res.json()) as { scenes?: BuilderSceneDefinition[] };
        const scenes = data.scenes ?? [];
        if (!cancelled && scenes.length > 0) {
          setBuilderScenes(scenes);
          setActiveBuilderSceneId((current) =>
            scenes.some((s) => s.id === current) ? current : scenes[0]!.id,
          );
          setBuilderSceneRenderVersion((v) => v + 1);
        }
      } catch { /* ignore */ }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // ─── Load builder asset options ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/scene-builder-assets");
        if (!res.ok) return;
        const data = (await res.json()) as { backgrounds?: string[]; items?: string[] };
        if (!cancelled) {
          setBuilderAssetOptions({
            backgrounds: data.backgrounds ?? [],
            items: data.items ?? [],
          });
        }
      } catch { /* ignore */ }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────
  const markLayoutSaveSuccess = () => {
    const savedAt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    setLayoutSaveState("saved");
    setLayoutSaveLabel(`Saved ${savedAt}`);
  };

  const markLayoutSaveError = () => {
    setLayoutSaveState("error");
    setLayoutSaveLabel("Save failed");
  };

  const persistSceneOverrides = async (
    overrides: Partial<Record<SceneId, SceneOverrideDefinition>>,
  ) => {
    const res = await fetch("/api/scene-overrides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides }),
    });
    if (!res.ok) throw new Error("Failed to persist scene overrides.");
  };

  const persistBuilderScenes = async (scenes: BuilderSceneDefinition[]) => {
    const res = await fetch("/api/builder-scenes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes }),
    });
    if (!res.ok) throw new Error("Failed to persist builder scenes.");
  };

  // ─── Scene override actions ───────────────────────────────────────────
  const saveCurrentSceneLayout = async () => {
    if (currentSceneId === "scene-builder") {
      await saveActiveBuilderScene();
      return;
    }

    setLayoutSaveState("saving");
    setLayoutSaveLabel("Saving...");

    const controllerSnapshot =
      controllerRef.current?.getLayoutSnapshot() ?? latestLayoutSpritesRef.current ?? layoutSprites;
    const selectedLive = controllerRef.current?.getSelectedLayoutSpriteSnapshot();
    const liveSprites = selectedLive
      ? controllerSnapshot.map((s) => (s.id === selectedLive.id ? selectedLive : s))
      : controllerSnapshot;

    const nextOverrides = {
      ...sceneOverridesRef.current,
      [currentSceneId]: {
        ...sceneOverridesRef.current[currentSceneId as SceneId],
        sprites: liveSprites,
      },
    };

    setSceneOverrides(nextOverrides);
    try {
      await persistSceneOverrides(nextOverrides);
      lastPersistedSceneOverridesJsonRef.current = JSON.stringify(nextOverrides);
      markLayoutSaveSuccess();
    } catch {
      markLayoutSaveError();
    }
  };

  const resetCurrentSceneLayout = async () => {
    if (currentSceneId === "scene-builder") return;

    const nextOverrides = { ...sceneOverrides };
    delete nextOverrides[currentSceneId as SceneId];

    setSceneOverrides(nextOverrides);
    setLayoutSprites(getBaseSceneLayoutSprites(currentSceneId as SceneId));
    setSelectedLayoutSpriteId(null);
    setSceneOverrideRenderVersion((v) => v + 1);
    await persistSceneOverrides(nextOverrides);
    lastPersistedSceneOverridesJsonRef.current = JSON.stringify(nextOverrides);
  };

  const handleCopyLayoutJson = async () => {
    const snapshot = controllerRef.current?.getLayoutSnapshot() ?? effectiveLayoutSprites;
    const snapshotWithSmoke = sceneThreeSmokeControls
      ? [
          ...snapshot.filter((s) => s.id !== "scene3-smoke"),
          {
            id: "scene3-smoke",
            assetId: "scene3Smoke" as const,
            x: Math.round(sceneThreeSmokeControls.x),
            y: Math.round(sceneThreeSmokeControls.y),
            width: Math.round(96 * sceneThreeSmokeControls.scale),
            height: Math.round(96 * sceneThreeSmokeControls.scale),
            anchorX: 0.5,
            anchorY: 1,
            layer: "effectsLayer" as const,
            zIndex: sceneThreeSmokeControls.zIndex,
            smokeControls: sceneThreeSmokeControls,
          },
        ]
      : snapshot;

    await navigator.clipboard.writeText(JSON.stringify(snapshotWithSmoke, null, 2));
  };

  // ─── Smoke controls ───────────────────────────────────────────────────
  const updateSmokeControl = <K extends keyof SceneThreeSmokeControls>(
    key: K,
    value: SceneThreeSmokeControls[K],
  ) => {
    controllerRef.current?.updateSceneThreeSmokeControls({
      [key]: value,
    } as Partial<SceneThreeSmokeControls>);
    setSceneThreeSmokeControls((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  // ─── Rain splash segments ─────────────────────────────────────────────
  const updateRainSplashSegments = (
    updater: (segments: SceneSpriteRainSplashSegmentConfig[]) => SceneSpriteRainSplashSegmentConfig[],
    currentSegments: SceneSpriteRainSplashSegmentConfig[],
  ) => {
    const base = currentSegments.length > 0 ? currentSegments : [createDefaultRainSplashConfig()];
    const next = updater([...base]);
    controllerRef.current?.setSelectedLayoutSpriteRainSplashSegments(next);
  };

  // ─── Builder scene actions ────────────────────────────────────────────
  const updateActiveBuilderScene = (patch: Partial<BuilderSceneDefinition>) => {
    setBuilderScenes((current) =>
      current.map((s) =>
        s.id === activeBuilderSceneId ? { ...s, ...patch } : s,
      ),
    );
  };

  const createEmptyBuilderScene = (onSetScene: (sceneId: string) => void) => {
    const nextLabel = newBuilderSceneName.trim() || `Builder Scene ${builderScenes.length + 1}`;
    const nextId = `builder-scene-${Date.now()}`;
    const nextScenes = [
      ...builderScenes,
      { id: nextId, label: nextLabel, backgroundSrc: null, sprites: [] },
    ];
    setBuilderScenes(nextScenes);
    setActiveBuilderSceneId(nextId);
    setNewBuilderSceneName("");
    setBuilderSceneRenderVersion((v) => v + 1);
    void persistBuilderScenes(nextScenes);
    onSetScene("scene-builder");
  };

  const saveActiveBuilderScene = async () => {
    if (!activeBuilderScene) return;

    setLayoutSaveState("saving");
    setLayoutSaveLabel("Saving...");

    const liveSprites =
      controllerRef.current?.getLayoutSnapshot() ?? activeBuilderScene.sprites;
    const nextLabel = newBuilderSceneName.trim();
    const nextScenes = builderScenes.map((s) =>
      s.id === activeBuilderScene.id
        ? { ...s, label: nextLabel || s.label, backgroundSrc: activeBuilderScene.backgroundSrc, sprites: liveSprites }
        : s,
    );
    setBuilderScenes(nextScenes);

    try {
      await persistBuilderScenes(nextScenes);
      markLayoutSaveSuccess();
    } catch {
      markLayoutSaveError();
      return;
    }

    if (nextLabel) setNewBuilderSceneName("");
  };

  // ─── Add items to scene ───────────────────────────────────────────────
  const addBuilderItemToScene = async () => {
    if (!activeBuilderScene) return;

    if (selectedBuilderAssetType === "animated") {
      const nextId = `scene-builder-${selectedBuilderAnimatedPreset}-${Date.now()}`;
      const animatedSprite = buildAnimatedPresetSprite(nextId, selectedBuilderAnimatedPreset);

      if (currentSceneId === "scene-builder") {
        setBuilderScenes((current) =>
          current.map((s) =>
            s.id === activeBuilderScene.id
              ? { ...s, sprites: [...s.sprites, animatedSprite] }
              : s,
          ),
        );
        setBuilderSceneRenderVersion((v) => v + 1);
      } else {
        await addSpriteToCurrentScene(animatedSprite);
      }

      setSelectedLayoutSpriteId(nextId);
      return;
    }

    if (!selectedBuilderItemSrc) return;

    const fileName = selectedBuilderItemSrc.split("/").pop() ?? "item";
    const baseName = fileName.replace(/\.[^.]+$/, "");
    const nextId = `${baseName}-${Date.now()}`;
    const { width: sw, height: sh } = await loadImageDimensions(selectedBuilderItemSrc);
    const maxDim = 240;
    const scale = maxDim / Math.max(sw, sh, 1);
    const nextSprite: LayoutSpriteSnapshot = {
      id: nextId,
      assetId: nextId,
      src: selectedBuilderItemSrc,
      x: 960,
      y: 920,
      width: Math.max(24, Math.round(sw * scale)),
      height: Math.max(24, Math.round(sh * scale)),
      anchorX: 0.5,
      anchorY: 1,
      layer: "environmentLayer",
      zIndex: 0,
    };

    if (currentSceneId === "scene-builder") {
      setBuilderScenes((current) =>
        current.map((s) =>
          s.id === activeBuilderScene.id
            ? { ...s, sprites: [...s.sprites, nextSprite] }
            : s,
        ),
      );
      setBuilderSceneRenderVersion((v) => v + 1);
    } else {
      await addSpriteToCurrentScene(nextSprite);
    }

    setSelectedLayoutSpriteId(nextId);
  };

  const addRuntimeLightToScene = async () => {
    const nextId = `light-${Date.now()}`;
    const nextLight: LayoutSpriteSnapshot = {
      id: nextId,
      assetId: nextId,
      runtimeType: "light",
      x: 960,
      y: 640,
      width: 280,
      height: 280,
      anchorX: 0.5,
      anchorY: 0.5,
      layer: "effectsLayer",
      zIndex: 6,
      alpha: 0.22,
      light: { color: "#e47c3e", intensity: 1, blendMode: "screen" },
    };

    if (currentSceneId === "scene-builder" && activeBuilderScene) {
      setBuilderScenes((current) =>
        current.map((s) =>
          s.id === activeBuilderScene.id
            ? { ...s, sprites: [...s.sprites, nextLight] }
            : s,
        ),
      );
      setBuilderSceneRenderVersion((v) => v + 1);
    } else {
      await addSpriteToCurrentScene(nextLight);
    }

    setSelectedLayoutSpriteId(nextId);
  };

  const addSpriteToCurrentScene = async (sprite: LayoutSpriteSnapshot) => {
    const existingSprites =
      sceneOverridesRef.current[currentSceneId as SceneId]?.sprites ?? effectiveLayoutSprites;
    const nextOverrides = {
      ...sceneOverridesRef.current,
      [currentSceneId]: {
        ...sceneOverridesRef.current[currentSceneId as SceneId],
        sprites: [...existingSprites, sprite],
      },
    };
    setLayoutSaveState("saving");
    setLayoutSaveLabel("Saving...");
    setSceneOverrides(nextOverrides);
    setSceneOverrideRenderVersion((v) => v + 1);
    try {
      await persistSceneOverrides(nextOverrides);
      lastPersistedSceneOverridesJsonRef.current = JSON.stringify(nextOverrides);
      markLayoutSaveSuccess();
    } catch {
      markLayoutSaveError();
    }
  };

  // ─── Builder asset upload ─────────────────────────────────────────────
  const handleBuilderAssetUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "background" | "item",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingBuilderAsset(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch("/api/scene-builder-assets", { method: "POST", body: formData });
      if (!res.ok) return;

      const data = (await res.json()) as { src?: string; kind?: "background" | "item" };
      if (!data.src || !data.kind) return;

      if (data.kind === "background") {
        setBuilderAssetOptions((current) => ({
          ...current,
          backgrounds: current.backgrounds.includes(data.src!)
            ? current.backgrounds
            : [...current.backgrounds, data.src!].sort(),
        }));
        updateActiveBuilderScene({ backgroundSrc: data.src });
      } else {
        setBuilderAssetOptions((current) => ({
          ...current,
          items: current.items.includes(data.src!)
            ? current.items
            : [...current.items, data.src!].sort(),
        }));
        setSelectedBuilderItemSrc(data.src);
      }
    } catch { /* ignore */ } finally {
      setIsUploadingBuilderAsset(false);
      event.target.value = "";
    }
  };

  // ─── Layout state change callback (called by controller) ─────────────
  const onLayoutStateChange = (
    layoutState: { sprites: LayoutSpriteSnapshot[]; selectedSpriteId: string | null },
  ) => {
    if (currentSceneId === "scene-builder") {
      setBuilderScenes((current) =>
        current.map((s) =>
          s.id === activeBuilderSceneId
            ? { ...s, sprites: layoutState.sprites }
            : s,
        ),
      );
    } else {
      setSceneOverrides((current) => ({
        ...current,
        [currentSceneId]: {
          ...current[currentSceneId as SceneId],
          sprites: layoutState.sprites,
        },
      }));
      setLayoutSprites(layoutState.sprites);
    }

    setSelectedLayoutSpriteId((current) =>
      current === "scene3-smoke" ? current : layoutState.selectedSpriteId,
    );
    setSceneThreeSmokeControls(controllerRef.current?.getSceneThreeSmokeControls() ?? null);
  };

  return {
    // State
    sceneOverrides,
    setSceneOverrides,
    sceneOverridesRef,
    sceneOverrideRenderVersion,
    layoutSprites,
    setLayoutSprites,
    selectedLayoutSpriteId,
    setSelectedLayoutSpriteId,
    latestLayoutSpritesRef,
    sceneThreeSmokeControls,
    setSceneThreeSmokeControls,
    selectedRainSplashSegmentIndex,
    setSelectedRainSplashSegmentIndex,
    layoutSaveState,
    layoutSaveLabel,
    builderScenes,
    setBuilderScenes,
    activeBuilderSceneId,
    setActiveBuilderSceneId,
    builderSceneRenderVersion,
    newBuilderSceneName,
    setNewBuilderSceneName,
    builderAssetOptions,
    isUploadingBuilderAsset,
    selectedBuilderItemSrc,
    setSelectedBuilderItemSrc,
    builderItemSearchQuery,
    setBuilderItemSearchQuery,
    selectedBuilderAssetType,
    setSelectedBuilderAssetType,
    selectedBuilderAnimatedPreset,
    setSelectedBuilderAnimatedPreset,

    // Derived
    activeBuilderScene,
    effectiveLayoutSprites,
    visibleLayoutSprites,
    layoutSpritesWithSmoke,
    filteredBuilderItemOptions,

    // Callbacks
    onLayoutStateChange,

    // Actions
    saveCurrentSceneLayout,
    resetCurrentSceneLayout,
    handleCopyLayoutJson,
    updateSmokeControl,
    updateRainSplashSegments,
    updateActiveBuilderScene,
    createEmptyBuilderScene,
    saveActiveBuilderScene,
    addBuilderItemToScene,
    addRuntimeLightToScene,
    handleBuilderAssetUpload,
    markLayoutSaveSuccess,
    markLayoutSaveError,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAnimatedPresetSprite(
  nextId: string,
  preset: BuilderAnimatedPreset,
): LayoutSpriteSnapshot {
  if (preset === "cat") {
    return {
      id: nextId, assetId: "cat", runtimeType: "cat",
      x: 960, y: 1005, width: 99, height: 68,
      anchorX: 0.5, anchorY: 1,
      layer: "actorLayer", zIndex: 2,
    };
  }
  if (preset === "character-idle") {
    return {
      id: nextId, assetId: "character", runtimeType: "character-idle",
      x: 960, y: 1071, width: 215, height: 354,
      anchorX: 0.5, anchorY: 1,
      layer: "actorLayer", zIndex: 2,
    };
  }
  if (preset === "wind-turbine") {
    return {
      id: nextId, assetId: "windTurbine", runtimeType: "wind-turbine",
      x: 960, y: 980, width: 306, height: 249,
      anchorX: 0.5, anchorY: 1,
      layer: "environmentLayer", zIndex: 2,
    };
  }
  return {
    id: nextId, assetId: "scene2Character", runtimeType: "character",
    x: 960, y: 1071, width: 136, height: 354,
    anchorX: 0.5, anchorY: 1,
    layer: "actorLayer", zIndex: 2,
  };
}
