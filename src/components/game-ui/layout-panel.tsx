"use client";

import { type ReactNode, type ChangeEvent, useState } from "react";

function ClickAnimateFramesEditor({
  frames,
  frameMs,
  onFramesChange,
  onFrameMsChange,
}: {
  frames: string[];
  frameMs: number;
  onFramesChange: (frames: string[]) => void;
  onFrameMsChange: (ms: number) => void;
}) {
  const [manualUrl, setManualUrl] = useState("");
  const [pattern, setPattern] = useState("");
  const [patternCount, setPatternCount] = useState(36);
  const [patternStart, setPatternStart] = useState(0);

  const addManual = () => {
    const url = manualUrl.trim();
    if (!url) return;
    onFramesChange([...frames, url]);
    setManualUrl("");
  };

  const addPattern = () => {
    if (!pattern.trim()) return;
    const generated = Array.from({ length: patternCount }, (_, i) => {
      const n = patternStart + i;
      return pattern.replace("{n}", n.toString().padStart(3, "0"));
    });
    onFramesChange([...frames, ...generated]);
    setPattern("");
  };

  return (
    <div style={{ marginTop: 8 }}>
      <span className="layout-panel__label">Click Animation Frames</span>
      <p className="layout-panel__hint">Tıklanınca sırayla oynatılacak resimler.</p>

      {frames.map((src, i) => (
        <div key={i} className="layout-panel__field" style={{ gap: 4, alignItems: "center" }}>
          <span className="layout-panel__hint" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {i + 1}. {src.split("/").pop()}
          </span>
          <button
            type="button"
            className="layout-panel__action"
            style={{ padding: "2px 8px", flexShrink: 0 }}
            onClick={() => onFramesChange(frames.filter((_, idx) => idx !== i))}
          >✕</button>
        </div>
      ))}

      <p className="layout-panel__hint" style={{ marginTop: 6 }}>Tek URL ekle:</p>
      <div className="layout-panel__field" style={{ gap: 4 }}>
        <input
          className="layout-panel__input"
          type="text"
          value={manualUrl}
          placeholder="/assets/scene/statue/frame_000.webp"
          onChange={(e) => setManualUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
        />
        <button type="button" className="layout-panel__action" style={{ flexShrink: 0 }} onClick={addManual}>+</button>
      </div>

      <p className="layout-panel__hint" style={{ marginTop: 6 }}>Pattern ile toplu ekle:</p>
      <p className="layout-panel__hint">{"{n}"} → 000, 001, 002...</p>
      <input
        className="layout-panel__input"
        type="text"
        value={pattern}
        placeholder="/assets/scene/statue/frame_{n}.webp"
        onChange={(e) => setPattern(e.target.value)}
        style={{ marginBottom: 4 }}
      />
      <div className="layout-panel__field" style={{ gap: 4 }}>
        <label className="layout-panel__field" style={{ flex: 1 }}>
          <span className="layout-panel__label">Start</span>
          <input className="layout-panel__input" type="number" min={0} value={patternStart}
            onChange={(e) => setPatternStart(Number(e.target.value))} />
        </label>
        <label className="layout-panel__field" style={{ flex: 1 }}>
          <span className="layout-panel__label">Count</span>
          <input className="layout-panel__input" type="number" min={1} value={patternCount}
            onChange={(e) => setPatternCount(Number(e.target.value))} />
        </label>
        <button type="button" className="layout-panel__action" style={{ alignSelf: "flex-end", flexShrink: 0 }} onClick={addPattern}>Add</button>
      </div>

      {frames.length > 0 && (
        <>
          <label className="layout-panel__field" style={{ marginTop: 4 }}>
            <span className="layout-panel__label">Frame Duration (ms)</span>
            <input
              className="layout-panel__input"
              type="number"
              min={16}
              max={2000}
              step={10}
              value={frameMs}
              onChange={(e) => onFrameMsChange(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            className="layout-panel__action"
            style={{ marginTop: 4, width: "100%" }}
            onClick={() => onFramesChange([])}
          >Clear All Frames</button>
        </>
      )}
    </div>
  );
}
import { Copy, Save, Reload, Home, ZoomIn, ZoomOut, FlipHorizontal2, ArrowUpWideNarrow, ArrowDownWideNarrow, ArrowUp, ArrowDown, Trash } from "pixelarticons/react";
import { BUILDER_ANIMATED_PRESET_OPTIONS, LIGHT_PARTICLE_PRESETS, BUILDER_SCENE_SELECT_PREFIX } from "@/lib/game/builder-constants";
import { createDefaultRainSplashConfig } from "@/lib/game/layout-utils";
import type { PixelSceneController } from "@/lib/game/pixel-scene-controller";
import type {
  LayoutSpriteSnapshot,
  SceneSpriteInteractionConfig,
  SceneSpriteParticleConfig,
  SceneSpriteLightConfig,
  SceneSpriteProjectionShadowConfig,
  SceneSpriteVisualConfig,
  SceneSpriteRainSplashSegmentConfig,
  SceneThreeSmokeControls,
  SceneSpriteRuntimeSmokeConfig,
} from "@/lib/game/types";
import type { BuilderSceneDefinition, LayoutSaveState, BackgroundLayerDef } from "@/lib/game/hooks/use-scene-layout-editor";
import type { CollectibleItemDefinition, InteractionSlot } from "@/lib/game/types";
import type { BuilderAssetType, BuilderAnimatedPreset } from "@/lib/game/builder-constants";

// ─── Section accordion ────────────────────────────────────────────────────────

function LayoutPanelSection({
  title,
  defaultOpen = false,
  aside,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  aside?: string;
  children: ReactNode;
}) {
  return (
    <details className="layout-panel__section" open={defaultOpen}>
      <summary className="layout-panel__section-summary">
        <span className="layout-panel__section-title">{title}</span>
        {aside ? <span className="layout-panel__section-aside">{aside}</span> : null}
      </summary>
      <div className="layout-panel__section-body">{children}</div>
    </details>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type LayoutPanelProps = {
  controllerRef: React.RefObject<PixelSceneController | null>;

  // Scene controls
  isLightingEnabled: boolean;
  isRainEnabled: boolean;
  isStarsEnabled: boolean;
  onLightingChange: (v: boolean) => void;
  onRainChange: (v: boolean) => void;
  onStarsChange: (v: boolean) => void;
  currentSceneId: string;

  // Save state
  layoutSaveState: LayoutSaveState;
  onCopyJson: () => void;
  onSave: () => void;
  onReset: () => void;

  // Default scene
  defaultSceneOptionValue: string | null;
  onSetDefaultScene: (optionValue: string) => void;

  // Scene select
  selectedSceneOptionValue: string;
  onSceneSelectChange: (value: string) => void;

  // Selected sprite
  selectedLayoutSpriteId: string | null;
  setSelectedLayoutSpriteId: (id: string | null) => void;
  visibleLayoutSprites: LayoutSpriteSnapshot[];
  selectedLayoutSpriteLive: LayoutSpriteSnapshot | null;
  selectedLayoutSpriteInteraction: SceneSpriteInteractionConfig | null;
  selectedLayoutSpriteLiveInteraction: SceneSpriteInteractionConfig | undefined;
  selectedLayoutSpriteVisuals: SceneSpriteVisualConfig | undefined;
  selectedLayoutSpriteLight: SceneSpriteLightConfig | undefined;
  selectedLayoutSpriteAlpha: number | undefined;
  selectedLayoutSpriteParticles: SceneSpriteParticleConfig | undefined;
  selectedLayoutSpriteShadow: SceneSpriteProjectionShadowConfig | undefined;
  selectedLayoutSpriteRuntimeType: string | undefined;
  isSmokeSelected: boolean;
  isLightSelected: boolean;

  // Smoke
  sceneThreeSmokeControls: SceneThreeSmokeControls | null;
  onSmokeUpdate: <K extends keyof SceneThreeSmokeControls>(key: K, value: SceneThreeSmokeControls[K]) => void;

  // Rain splash
  effectiveRainSplashSegments: SceneSpriteRainSplashSegmentConfig[];
  selectedRainSplashSegmentIndex: number;
  setSelectedRainSplashSegmentIndex: (i: number) => void;
  activeRainSplashSegment: SceneSpriteRainSplashSegmentConfig | undefined;
  activeRainSplashWidthPercent: number;
  activeRainSplashMinWidthPercent: number;
  activeRainSplashMaxWidthPercent: number;
  onUpdateRainSplashSegments: (
    updater: (segs: SceneSpriteRainSplashSegmentConfig[]) => SceneSpriteRainSplashSegmentConfig[],
    current: SceneSpriteRainSplashSegmentConfig[],
  ) => void;

  // Builder scenes
  builderScenes: BuilderSceneDefinition[];
  activeBuilderSceneId: string;
  setActiveBuilderSceneId: (id: string) => void;
  activeBuilderScene: BuilderSceneDefinition | undefined;
  newBuilderSceneName: string;
  setNewBuilderSceneName: (v: string) => void;
  onSaveBuilderScene: () => void;
  onCreateEmptyBuilderScene: () => void;
  onUpdateActiveBuilderScene: (patch: Partial<BuilderSceneDefinition>) => void;

  // Builder assets
  builderAssetOptions: { backgrounds: string[]; items: string[] };
  isUploadingBuilderAsset: boolean;
  selectedBuilderItemSrc: string;
  setSelectedBuilderItemSrc: (v: string) => void;
  filteredBuilderItemOptions: string[];
  builderItemSearchQuery: string;
  setBuilderItemSearchQuery: (v: string) => void;
  selectedBuilderAssetType: BuilderAssetType;
  setSelectedBuilderAssetType: (v: BuilderAssetType) => void;
  selectedBuilderAnimatedPreset: BuilderAnimatedPreset;
  setSelectedBuilderAnimatedPreset: (v: BuilderAnimatedPreset) => void;
  onBuilderAssetUpload: (event: ChangeEvent<HTMLInputElement>, kind: "background" | "item") => void;
  onAddItemToScene: () => void;
  onAddLight: () => void;
  onAddSmoke: () => void;

  collectibleItems: CollectibleItemDefinition[];

  // Editors
  onOpenInfoEditor: () => void;
  onOpenDrawerEditor: () => void;
  onOpenCollectEditor: () => void;
  onOpenItemsRegistry: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LayoutPanel({
  controllerRef,
  isLightingEnabled,
  isRainEnabled,
  isStarsEnabled,
  onLightingChange,
  onRainChange,
  onStarsChange,
  currentSceneId,
  layoutSaveState,
  onCopyJson,
  defaultSceneOptionValue,
  onSetDefaultScene,
  selectedSceneOptionValue,
  onSceneSelectChange,
  onSave,
  onReset,
  selectedLayoutSpriteId,
  setSelectedLayoutSpriteId,
  visibleLayoutSprites,
  selectedLayoutSpriteLive,
  selectedLayoutSpriteInteraction,
  selectedLayoutSpriteLiveInteraction,
  selectedLayoutSpriteVisuals,
  selectedLayoutSpriteLight,
  selectedLayoutSpriteAlpha,
  selectedLayoutSpriteParticles,
  selectedLayoutSpriteShadow,
  isSmokeSelected,
  isLightSelected,
  sceneThreeSmokeControls,
  onSmokeUpdate,
  effectiveRainSplashSegments,
  selectedRainSplashSegmentIndex,
  setSelectedRainSplashSegmentIndex,
  activeRainSplashSegment,
  activeRainSplashWidthPercent,
  activeRainSplashMinWidthPercent,
  activeRainSplashMaxWidthPercent,
  onUpdateRainSplashSegments,
  builderScenes,
  activeBuilderSceneId,
  setActiveBuilderSceneId,
  activeBuilderScene,
  newBuilderSceneName,
  setNewBuilderSceneName,
  onSaveBuilderScene,
  onCreateEmptyBuilderScene,
  onUpdateActiveBuilderScene,
  builderAssetOptions,
  isUploadingBuilderAsset,
  selectedBuilderItemSrc,
  setSelectedBuilderItemSrc,
  filteredBuilderItemOptions,
  builderItemSearchQuery,
  setBuilderItemSearchQuery,
  selectedBuilderAssetType,
  setSelectedBuilderAssetType,
  selectedBuilderAnimatedPreset,
  setSelectedBuilderAnimatedPreset,
  onBuilderAssetUpload,
  onAddItemToScene,
  onAddLight,
  onAddSmoke,
  collectibleItems,
  onOpenInfoEditor,
  onOpenDrawerEditor,
  onOpenCollectEditor,
  onOpenItemsRegistry,
}: LayoutPanelProps) {
  const isBuilderScene = currentSceneId === "scene-builder";

  return (
    <aside className="layout-panel font-pixel" aria-label="Scene layout tools">
      {/* Header */}
      <div className="layout-panel__header">
        <p className="layout-panel__eyebrow">Layout Mode</p>
        <div className="layout-panel__actions">
          <button type="button" className="layout-panel__icon-btn" onClick={onCopyJson} title="Copy JSON" aria-label="Copy JSON">
            <Copy aria-hidden="true" />
          </button>
          <button type="button" className="layout-panel__icon-btn" onClick={onSave} title="Save" aria-label="Save">
            <Save aria-hidden="true" />
          </button>
          {!isBuilderScene ? (
            <button type="button" className="layout-panel__icon-btn" onClick={onReset} title="Reset" aria-label="Reset">
              <Reload aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className={`layout-panel__icon-btn${defaultSceneOptionValue === selectedSceneOptionValue ? " layout-panel__icon-btn--active" : ""}`}
            onClick={() => onSetDefaultScene(selectedSceneOptionValue)}
            title={defaultSceneOptionValue === selectedSceneOptionValue ? "Default scene" : "Set as default scene"}
            aria-label={defaultSceneOptionValue === selectedSceneOptionValue ? "Default scene" : "Set as default scene"}
          >
            <Home aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scene select */}
      <div className="layout-panel__scene-select">
        <label className="layout-panel__label" htmlFor="lp-scene-select">Scene</label>
        <select
          id="lp-scene-select"
          className="layout-panel__select"
          value={selectedSceneOptionValue}
          onChange={(e) => onSceneSelectChange(e.target.value)}
        >
          {builderScenes.map((scene) => (
            <option key={scene.id} value={`${BUILDER_SCENE_SELECT_PREFIX}${scene.id}`}>
              {scene.label}
            </option>
          ))}
        </select>
      </div>

      <p className="layout-panel__hint">
        Drag sprites in the scene. Open only the section you need to keep the panel tidy.
      </p>

      {/* Global toggles */}
      <LayoutPanelSection title="Global" defaultOpen>
        <div className="layout-panel__toggle-group">
          <label className="layout-panel__toggle">
            <input
              type="checkbox"
              checked={isLightingEnabled}
              onChange={(e) => onLightingChange(e.target.checked)}
            />
            <span>Light</span>
          </label>
          <label className="layout-panel__toggle">
            <input
              type="checkbox"
              checked={isRainEnabled}
              onChange={(e) => onRainChange(e.target.checked)}
            />
            <span>Rain</span>
          </label>
          <label className="layout-panel__toggle">
            <input
              type="checkbox"
              checked={isStarsEnabled}
              onChange={(e) => onStarsChange(e.target.checked)}
            />
            <span>Stars</span>
          </label>
        </div>
      </LayoutPanelSection>

      {isRainEnabled ? (
        <LayoutPanelSection title="Rain Depth">
          {(["Far", "Mid", "Near"] as const).map((label, layerIndex) => (
            <div key={label} className="layout-panel__field">
              <span className="layout-panel__label">{label} Layer</span>
              <div className="layout-panel__row">
                <label className="layout-panel__inline-label">Blur</label>
                <input
                  type="range"
                  className="layout-panel__range"
                  min={0}
                  max={8}
                  step={0.5}
                  defaultValue={layerIndex === 0 ? 2 : 0}
                  onChange={(e) =>
                    controllerRef.current?.updateRainLayerConfig(layerIndex, {
                      blur: Number(e.target.value),
                    })
                  }
                />
                <label className="layout-panel__inline-label">Alpha</label>
                <input
                  type="range"
                  className="layout-panel__range"
                  min={0}
                  max={1}
                  step={0.02}
                  defaultValue={layerIndex === 0 ? 0.12 : layerIndex === 1 ? 0.22 : 0.38}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    controllerRef.current?.updateRainLayerConfig(layerIndex, {
                      minAlpha: v * 0.7,
                      maxAlpha: v,
                    });
                  }}
                />
                <label className="layout-panel__inline-label">Speed</label>
                <input
                  type="range"
                  className="layout-panel__range"
                  min={200}
                  max={2000}
                  step={20}
                  defaultValue={layerIndex === 0 ? 860 : layerIndex === 1 ? 1100 : 1400}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    controllerRef.current?.updateRainLayerConfig(layerIndex, {
                      minSpeedY: v * 0.8,
                      maxSpeedY: v,
                    });
                  }}
                />
                <label className="layout-panel__inline-label">Length</label>
                <input
                  type="range"
                  className="layout-panel__range"
                  min={4}
                  max={120}
                  step={2}
                  defaultValue={layerIndex === 0 ? 22 : layerIndex === 1 ? 36 : 58}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    controllerRef.current?.updateRainLayerConfig(layerIndex, {
                      minLength: v * 0.7,
                      maxLength: v,
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </LayoutPanelSection>
      ) : null}

      {/* Builder scene management */}
      {isBuilderScene ? (
        <LayoutPanelSection title="Scene Builder" defaultOpen>
          <label className="layout-panel__field">
            <span className="layout-panel__label">Active Scene</span>
            <select
              className="layout-panel__select"
              value={activeBuilderSceneId}
              onChange={(e) => {
                setActiveBuilderSceneId(e.target.value);
                setSelectedLayoutSpriteId(null);
              }}
            >
              {builderScenes.map((scene) => (
                <option key={scene.id} value={scene.id}>{scene.label}</option>
              ))}
            </select>
          </label>

          <label className="layout-panel__field">
            <span className="layout-panel__label">New Scene Name</span>
            <input
              className="layout-panel__input layout-panel__input--text"
              type="text"
              value={newBuilderSceneName}
              onChange={(e) => setNewBuilderSceneName(e.target.value)}
              placeholder="Scene label"
            />
          </label>

          <div className="layout-panel__actions">
            <button type="button" className="layout-panel__action" onClick={onSaveBuilderScene}>
              {layoutSaveState === "saving" ? "Saving..." : "Save Scene"}
            </button>
            <button type="button" className="layout-panel__action" onClick={onCreateEmptyBuilderScene}>
              New Empty
            </button>
            <button type="button" className="layout-panel__action" onClick={onOpenItemsRegistry}>
              Items Registry
            </button>
          </div>
        </LayoutPanelSection>
      ) : null}

      {/* Background layer picker (builder only) */}
      {isBuilderScene ? (
        <LayoutPanelSection title="Background">
          {/* ── Single backgroundSrc ── */}
          {activeBuilderScene?.backgroundSrc && (
            <div className="layout-panel__field" style={{ gap: 4, alignItems: "center" }}>
              <span className="layout-panel__label" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                BG: {activeBuilderScene.backgroundSrc.split("/").pop()}
              </span>
              <button
                type="button"
                className="layout-panel__icon-btn layout-panel__icon-btn--danger"
                onClick={() => onUpdateActiveBuilderScene({ backgroundSrc: null })}
                title="Remove background"
              >✕</button>
            </div>
          )}

          {/* ── Background layers ── */}
          {(activeBuilderScene?.backgroundLayers ?? []).map((layer, i) => {
            const layers = activeBuilderScene?.backgroundLayers ?? [];
            const updateLayer = (patch: Partial<BackgroundLayerDef>) => {
              const next = layers.map((l, idx) => idx === i ? { ...l, ...patch } : l);
              onUpdateActiveBuilderScene({ backgroundLayers: next });
            };
            const removeLayer = () => {
              const next = layers.filter((_, idx) => idx !== i);
              onUpdateActiveBuilderScene({ backgroundLayers: next });
            };
            const moveUp = () => {
              if (i === 0) return;
              const next = [...layers];
              [next[i - 1], next[i]] = [next[i], next[i - 1]];
              onUpdateActiveBuilderScene({ backgroundLayers: next });
            };
            const moveDown = () => {
              if (i === layers.length - 1) return;
              const next = [...layers];
              [next[i], next[i + 1]] = [next[i + 1], next[i]];
              onUpdateActiveBuilderScene({ backgroundLayers: next });
            };
            return (
              <div key={i} className="layout-panel__field" style={{ gap: 4, flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="layout-panel__label" style={{ flex: 1 }}>Layer {i + 1}</span>
                  <button type="button" className="layout-panel__icon-btn" onClick={moveUp} disabled={i === 0} title="Move up">↑</button>
                  <button type="button" className="layout-panel__icon-btn" onClick={moveDown} disabled={i === layers.length - 1} title="Move down">↓</button>
                  <button type="button" className="layout-panel__icon-btn layout-panel__icon-btn--danger" onClick={removeLayer} title="Remove layer">✕</button>
                </div>
                <select
                  className="layout-panel__select"
                  value={layer.src}
                  onChange={(e) => updateLayer({ src: e.target.value })}
                >
                  <option value="">— choose —</option>
                  {builderAssetOptions.backgrounds.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            );
          })}

          {(activeBuilderScene?.backgroundLayers?.length ?? 0) < 3 && (
            <button
              type="button"
              className="layout-panel__action"
              onClick={() => {
                const current = activeBuilderScene?.backgroundLayers ?? [];
                onUpdateActiveBuilderScene({ backgroundLayers: [...current, { src: "" }] });
              }}
            >
              + Add Layer
            </button>
          )}

          {(() => {
            const bgSrc = activeBuilderScene?.backgroundSrc ?? "";
            const isVideoBg = /\.(mp4|webm)(\?|$)/i.test(bgSrc) ||
              (activeBuilderScene?.backgroundLayers ?? []).some(l => /\.(mp4|webm)(\?|$)/i.test(l.src));
            return isVideoBg ? (
              <label className="layout-panel__field">
                <span className="layout-panel__label">
                  Speed {((activeBuilderScene?.backgroundPlaybackRate ?? 1) * 100).toFixed(0)}%
                </span>
                <input
                  className="layout-panel__input"
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={Math.round((activeBuilderScene?.backgroundPlaybackRate ?? 1) * 100)}
                  onChange={(e) => onUpdateActiveBuilderScene({ backgroundPlaybackRate: Number(e.target.value) / 100 })}
                />
              </label>
            ) : null;
          })()}

          {(activeBuilderScene?.backgroundSrc || (activeBuilderScene?.backgroundLayers?.length ?? 0) > 0) && (
            <>
              <label className="layout-panel__field">
                <span className="layout-panel__label">
                  Brightness {((activeBuilderScene?.backgroundBrightness ?? 0) * 100).toFixed(0)}%
                </span>
                <input
                  className="layout-panel__input"
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={Math.round((activeBuilderScene?.backgroundBrightness ?? 0) * 100)}
                  onChange={(e) => onUpdateActiveBuilderScene({ backgroundBrightness: Number(e.target.value) / 100 })}
                />
              </label>
              <label className="layout-panel__field">
                <span className="layout-panel__label">
                  Contrast {((activeBuilderScene?.backgroundContrast ?? 0) * 100).toFixed(0)}%
                </span>
                <input
                  className="layout-panel__input"
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={Math.round((activeBuilderScene?.backgroundContrast ?? 0) * 100)}
                  onChange={(e) => onUpdateActiveBuilderScene({ backgroundContrast: Number(e.target.value) / 100 })}
                />
              </label>
            </>
          )}

          <label className="layout-panel__field">
            <span className="layout-panel__label">Upload Background</span>
            <input
              className="layout-panel__input"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.mp4,.webm"
              onChange={(e) => onBuilderAssetUpload(e, "background")}
            />
          </label>
        </LayoutPanelSection>
      ) : null}

      {/* Add item */}
      <LayoutPanelSection title={isBuilderScene ? "Add Item" : "Runtime Add Item"} defaultOpen>
        <label className="layout-panel__field">
          <span className="layout-panel__label">Asset Type</span>
          <select
            className="layout-panel__select"
            value={selectedBuilderAssetType}
            onChange={(e) => setSelectedBuilderAssetType(e.target.value as BuilderAssetType)}
          >
            <option value="prop">Prop</option>
            <option value="animated">Animated Preset</option>
          </select>
        </label>

        <label className="layout-panel__field">
          <span className="layout-panel__label">Choose Item</span>
          {selectedBuilderAssetType === "animated" ? (
            <select
              className="layout-panel__select"
              value={selectedBuilderAnimatedPreset}
              onChange={(e) =>
                setSelectedBuilderAnimatedPreset(e.target.value as BuilderAnimatedPreset)
              }
            >
              {BUILDER_ANIMATED_PRESET_OPTIONS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          ) : (
            <div className="layout-asset-picker">
              <input
                className="layout-panel__input layout-panel__input--text"
                type="search"
                value={builderItemSearchQuery}
                onChange={(e) => setBuilderItemSearchQuery(e.target.value)}
                placeholder="Search assets..."
              />
              <div className="layout-asset-picker__grid">
                {filteredBuilderItemOptions.length > 0 ? (
                  filteredBuilderItemOptions.map((src) => {
                    const label = src.split("/").pop() ?? src;
                    return (
                      <button
                        key={src}
                        type="button"
                        className={`layout-asset-picker__item${selectedBuilderItemSrc === src ? " is-selected" : ""}`}
                        onClick={() => setSelectedBuilderItemSrc(src)}
                        title={label}
                      >
                        <img className="layout-asset-picker__thumb" src={src} alt={label} />
                        <span className="layout-asset-picker__name">{label}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="layout-asset-picker__empty">No assets match your search.</div>
                )}
              </div>
            </div>
          )}
        </label>

        <label className="layout-panel__field">
          <span className="layout-panel__label">Upload Item</span>
          <input
            className="layout-panel__input"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            disabled={selectedBuilderAssetType === "animated"}
            onChange={(e) => onBuilderAssetUpload(e, "item")}
          />
          <span className="layout-info-editor__hint">
            {selectedBuilderAssetType === "animated"
              ? "Animated preset mode uses the built-in runtime sprites like Main Character and Cat."
              : isUploadingBuilderAsset
              ? "Uploading and converting to webp..."
              : "Upload a prop, then add it to the scene and position it with drag + layout controls."}
          </span>
        </label>

        <div className="layout-panel__actions">
          <button
            type="button"
            className="layout-panel__action"
            onClick={onAddItemToScene}
            disabled={selectedBuilderAssetType === "animated" ? false : !selectedBuilderItemSrc}
          >
            Add Item To Scene
          </button>
          <button type="button" className="layout-panel__action" onClick={onAddLight}>
            Add Light
          </button>
          <button type="button" className="layout-panel__action" onClick={onAddSmoke}>
            Add Smoke
          </button>
        </div>
      </LayoutPanelSection>

      {/* Selected asset */}
      <LayoutPanelSection
        title="Selected Asset"
        defaultOpen
        aside={selectedLayoutSpriteId ?? "None"}
      >
        <label className="layout-panel__field">
          <span className="layout-panel__label">Selected Asset</span>
          <select
            className="layout-panel__select"
            value={selectedLayoutSpriteId ?? ""}
            onChange={(e) => setSelectedLayoutSpriteId(e.target.value || null)}
          >
            <option value="">Choose sprite</option>
            {visibleLayoutSprites.map((sprite) => (
              <option key={sprite.id} value={sprite.id}>{sprite.id}</option>
            ))}
          </select>
        </label>

        {selectedLayoutSpriteLive ? (
          <>
            <div className="layout-panel__stats">
              <span>X {selectedLayoutSpriteLive.x}</span>
              <span>Y {selectedLayoutSpriteLive.y}</span>
              <span>W {selectedLayoutSpriteLive.width}</span>
              <span>H {selectedLayoutSpriteLive.height}</span>
              <span>Z {selectedLayoutSpriteLive.zIndex ?? 0}</span>
            </div>

            {!isSmokeSelected ? (
              <>
                <LayoutPanelSection title="Object">
                  <label className="layout-panel__field">
                    <span className="layout-panel__label">Layer</span>
                    <select
                      className="layout-panel__select"
                      value={selectedLayoutSpriteLive.layer ?? "environmentLayer"}
                      onChange={(e) =>
                        controllerRef.current?.setSelectedLayoutSpriteLayer(
                          e.target.value as "backgroundLayer" | "environmentLayer" | "actorLayer" | "effectsLayer",
                        )
                      }
                    >
                      <option value="environmentLayer">Environment</option>
                      <option value="actorLayer">Actor</option>
                      <option value="effectsLayer">Effects</option>
                      <option value="backgroundLayer">Background</option>
                    </select>
                  </label>
                  <label className="layout-panel__toggle">
                    <input
                      type="checkbox"
                      checked={selectedLayoutSpriteLive.initiallyHidden ?? false}
                      onChange={(e) =>
                        controllerRef.current?.setSelectedLayoutSpriteInitiallyHidden(e.target.checked)
                      }
                    />
                    <span>Initially Hidden (reveal slot)</span>
                  </label>
                </LayoutPanelSection>

                <LayoutPanelSection title="Interaction">
                  <div className="layout-panel__toggle-group">
                    {(["clickable", "hasInfo", "hasDrawer", "collectible"] as const).map((key) => (
                      <label key={key} className="layout-panel__toggle">
                        <input
                          type="checkbox"
                          checked={selectedLayoutSpriteInteraction?.[key] ?? false}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              [key]: e.target.checked,
                            })
                          }
                        />
                        <span>
                          {key === "clickable" ? "Clickable" : key === "hasInfo" ? "Has Info" : key === "hasDrawer" ? "Has Drawer" : "Collectible"}
                        </span>
                      </label>
                    ))}
                  </div>

                  <label className="layout-panel__field">
                    <span className="layout-panel__label">Bubble Message</span>
                    <textarea
                      className="layout-panel__textarea"
                      rows={4}
                      value={selectedLayoutSpriteLiveInteraction?.bubbleMessage ?? ""}
                      disabled={!selectedLayoutSpriteInteraction?.clickable}
                      onChange={(e) =>
                        controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                          bubbleMessage: e.target.value || undefined,
                        })
                      }
                      placeholder="Custom character bubble text when this object is clicked"
                    />
                  </label>

                  {selectedLayoutSpriteInteraction?.clickable && selectedLayoutSpriteInteraction?.hasInfo ? (
                    <div className="layout-panel__actions">
                      <button type="button" className="layout-panel__action" onClick={onOpenInfoEditor}>
                        Edit Info Modal
                      </button>
                    </div>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable ? (
                    <>
                      <label className="layout-panel__field" style={{ marginTop: 4 }}>
                        <span className="layout-panel__label">Spotify URL</span>
                        <input
                          className="layout-panel__input"
                          type="text"
                          placeholder="https://open.spotify.com/track/…"
                          value={selectedLayoutSpriteInteraction?.spotifyUrl ?? ""}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              spotifyUrl: e.target.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">YouTube URL</span>
                        <input
                          className="layout-panel__input"
                          type="text"
                          placeholder="https://youtube.com/watch?v=…"
                          value={selectedLayoutSpriteInteraction?.youtubeUrl ?? ""}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              youtubeUrl: e.target.value || undefined,
                            })
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable && selectedLayoutSpriteInteraction?.hasDrawer ? (
                    <div className="layout-panel__actions">
                      <button type="button" className="layout-panel__action" onClick={onOpenDrawerEditor}>
                        Edit Drawer
                      </button>
                    </div>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable && selectedLayoutSpriteInteraction?.collectible ? (
                    <>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Gives Item</span>
                        <select
                          className="layout-panel__input"
                          value={selectedLayoutSpriteInteraction?.givesCollectibleItemId ?? "__none__"}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              givesCollectibleItemId: e.target.value === "__none__" ? undefined : e.target.value,
                            })
                          }
                        >
                          <option value="__none__">Select item from registry…</option>
                          {collectibleItems.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </label>
                      <div className="layout-panel__actions">
                        <button type="button" className="layout-panel__action" onClick={onOpenCollectEditor}>
                          Edit Collect Item (legacy)
                        </button>
                      </div>
                    </>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable ? (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid var(--color-border,#333)", margin: "8px 0" }} />
                      <label className="layout-panel__toggle">
                        <input
                          type="checkbox"
                          checked={selectedLayoutSpriteInteraction?.hasGame ?? false}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({ hasGame: e.target.checked || undefined })
                          }
                        />
                        <span>Has Game</span>
                      </label>

                      {selectedLayoutSpriteInteraction?.hasGame ? (
                        <>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Game</span>
                            <select
                              className="layout-panel__input"
                              value={selectedLayoutSpriteInteraction?.gameId ?? "sliding-puzzle"}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ gameId: e.target.value })
                              }
                            >
                              <option value="sliding-puzzle">Sliding Puzzle</option>
                            </select>
                          </label>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">On Win</span>
                            <select
                              className="layout-panel__input"
                              value={selectedLayoutSpriteInteraction?.onGameWinAction ?? "giveItem"}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                  onGameWinAction: e.target.value as "giveItem" | "openModal",
                                })
                              }
                            >
                              <option value="giveItem">Give Item</option>
                              <option value="openModal">Open Modal</option>
                            </select>
                          </label>
                          {(selectedLayoutSpriteInteraction?.onGameWinAction ?? "giveItem") === "giveItem" && collectibleItems.length > 0 ? (
                            <label className="layout-panel__field">
                              <span className="layout-panel__label">Give Item</span>
                              <select
                                className="layout-panel__input"
                                value={selectedLayoutSpriteInteraction?.onGameWinItemId ?? "__none__"}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                    onGameWinItemId: e.target.value === "__none__" ? undefined : e.target.value,
                                  })
                                }
                              >
                                <option value="__none__">Select item…</option>
                                {collectibleItems.map((item) => (
                                  <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </>
                      ) : null}

                      <hr style={{ border: "none", borderTop: "1px solid var(--color-border,#333)", margin: "8px 0" }} />
                      <label className="layout-panel__toggle">
                        <input
                          type="checkbox"
                          checked={selectedLayoutSpriteInteraction?.hasYesNo ?? false}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({ hasYesNo: e.target.checked || undefined })
                          }
                        />
                        <span>Has Yes/No</span>
                      </label>

                      {selectedLayoutSpriteInteraction?.hasYesNo ? (
                        <>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Question</span>
                            <textarea
                              className="layout-panel__input"
                              rows={2}
                              value={selectedLayoutSpriteInteraction?.yesNoQuestion ?? ""}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ yesNoQuestion: e.target.value || undefined })
                              }
                              placeholder="e.g. Want to work together?"
                            />
                          </label>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">YES Action</span>
                            <select
                              className="layout-panel__input"
                              value={selectedLayoutSpriteInteraction?.yesNoYesAction ?? "contact-form"}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                  yesNoYesAction: e.target.value as "contact-form" | "go-to-scene",
                                  yesNoYesScene: e.target.value === "contact-form" ? undefined : selectedLayoutSpriteInteraction?.yesNoYesScene,
                                })
                              }
                            >
                              <option value="contact-form">Open Contact Form</option>
                              <option value="go-to-scene">Go to Scene</option>
                            </select>
                          </label>
                          {(selectedLayoutSpriteInteraction?.yesNoYesAction ?? "contact-form") === "go-to-scene" ? (
                            <label className="layout-panel__field">
                              <span className="layout-panel__label">Scene</span>
                              <select
                                className="layout-panel__input"
                                value={selectedLayoutSpriteInteraction?.yesNoYesScene ?? "__none__"}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                    yesNoYesScene: e.target.value === "__none__" ? undefined : e.target.value,
                                  })
                                }
                              >
                                <option value="__none__">Select scene…</option>
                                {builderScenes.map((scene) => (
                                  <option key={scene.id} value={scene.id}>{scene.label}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">NO Message</span>
                            <textarea
                              className="layout-panel__input"
                              rows={2}
                              value={selectedLayoutSpriteInteraction?.yesNoNoMessage ?? ""}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ yesNoNoMessage: e.target.value || undefined })
                              }
                              placeholder="e.g. Maybe next time!"
                            />
                          </label>
                        </>
                      ) : null}
                    </>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable && !selectedLayoutSpriteInteraction?.collectible && collectibleItems.length > 0 ? (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid var(--color-border,#333)", margin: "8px 0" }} />
                      <span className="layout-panel__label">Item Interaction</span>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Accepted Item</span>
                        <select
                          className="layout-panel__input"
                          value={selectedLayoutSpriteInteraction?.acceptedCollectibleItemId ?? "__none__"}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              acceptedCollectibleItemId: e.target.value === "__none__" ? undefined : e.target.value,
                            })
                          }
                        >
                          <option value="__none__">None</option>
                          {collectibleItems.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </label>

                      {selectedLayoutSpriteInteraction?.acceptedCollectibleItemId ? (
                        <>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Action</span>
                            <select
                              className="layout-panel__input"
                              value={selectedLayoutSpriteInteraction?.onAcceptAction ?? "openModal"}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                  onAcceptAction: e.target.value as "openModal" | "giveCollectible",
                                })
                              }
                            >
                              <option value="openModal">Open modal</option>
                              <option value="giveCollectible">Give new item</option>
                            </select>
                          </label>

                          {(selectedLayoutSpriteInteraction?.onAcceptAction ?? "openModal") === "giveCollectible" ? (
                            <label className="layout-panel__field">
                              <span className="layout-panel__label">Give Item</span>
                              <select
                                className="layout-panel__input"
                                value={selectedLayoutSpriteInteraction?.onAcceptGivesItemId ?? "__none__"}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                    onAcceptGivesItemId: e.target.value === "__none__" ? undefined : e.target.value,
                                  })
                                }
                              >
                                <option value="__none__">Select item…</option>
                                {collectibleItems.map((item) => (
                                  <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : null}

                  {selectedLayoutSpriteInteraction?.clickable && !selectedLayoutSpriteInteraction?.collectible ? (
                    <>
                      <hr style={{ border: "none", borderTop: "1px solid var(--color-border,#333)", margin: "8px 0" }} />
                      <span className="layout-panel__label">Multi-Slot Puzzle</span>

                      {(selectedLayoutSpriteInteraction?.slots ?? []).map((slot: InteractionSlot, idx: number) => (
                        <div key={slot.id} style={{ border: "1px solid var(--color-border,#333)", borderRadius: 4, padding: "6px 8px", marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span className="layout-panel__label">Slot {idx + 1}</span>
                            <button
                              type="button"
                              className="layout-panel__icon-btn layout-panel__icon-btn--danger"
                              onClick={() => {
                                const next = (selectedLayoutSpriteInteraction?.slots ?? []).filter((_: InteractionSlot, i: number) => i !== idx);
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                              }}
                            >
                              ✕
                            </button>
                          </div>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Accepts Item</span>
                            <select
                              className="layout-panel__input"
                              value={slot.acceptsItemId ?? "__none__"}
                              onChange={(e) => {
                                const next = (selectedLayoutSpriteInteraction?.slots ?? []).map((s: InteractionSlot, i: number) =>
                                  i === idx ? { ...s, acceptsItemId: e.target.value } : s
                                );
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                              }}
                            >
                              <option value="__none__">Select item…</option>
                              {collectibleItems.map((item) => (
                                <option key={item.id} value={item.id}>{item.label}</option>
                              ))}
                            </select>
                          </label>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">On Fill</span>
                            <select
                              className="layout-panel__input"
                              value={slot.onFill ?? "reveal"}
                              onChange={(e) => {
                                const next = (selectedLayoutSpriteInteraction?.slots ?? []).map((s: InteractionSlot, i: number) =>
                                  i === idx ? { ...s, onFill: e.target.value as "reveal" | "change" } : s
                                );
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                              }}
                            >
                              <option value="reveal">Reveal (alpha 0→1)</option>
                              <option value="change">Change texture</option>
                            </select>
                          </label>
                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Target Sprite</span>
                            <select
                              className="layout-panel__input"
                              value={slot.targetSpriteId ?? "__none__"}
                              onChange={(e) => {
                                const next = (selectedLayoutSpriteInteraction?.slots ?? []).map((s: InteractionSlot, i: number) =>
                                  i === idx ? { ...s, targetSpriteId: e.target.value === "__none__" ? undefined : e.target.value } : s
                                );
                                controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                              }}
                            >
                              <option value="__none__">Select sprite…</option>
                              {visibleLayoutSprites.map((sp) => (
                                <option key={sp.id} value={sp.id}>{sp.id}</option>
                              ))}
                            </select>
                          </label>
                          {(slot.onFill ?? "reveal") === "change" ? (
                            <label className="layout-panel__field">
                              <span className="layout-panel__label">Changes To (src)</span>
                              <input
                                className="layout-panel__input"
                                type="text"
                                placeholder="/assets/scene/…webp"
                                value={slot.changesToSrc ?? ""}
                                onChange={(e) => {
                                  const next = (selectedLayoutSpriteInteraction?.slots ?? []).map((s: InteractionSlot, i: number) =>
                                    i === idx ? { ...s, changesToSrc: e.target.value || undefined } : s
                                  );
                                  controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                                }}
                              />
                            </label>
                          ) : null}
                        </div>
                      ))}

                      <button
                        type="button"
                        className="layout-panel__action"
                        onClick={() => {
                          const newSlot: InteractionSlot = { id: `slot-${Date.now()}`, acceptsItemId: "" };
                          const next = [...(selectedLayoutSpriteInteraction?.slots ?? []), newSlot];
                          controllerRef.current?.updateSelectedLayoutSpriteInteraction({ slots: next });
                        }}
                      >
                        + Add Slot
                      </button>

                      {(selectedLayoutSpriteInteraction?.slots ?? []).length > 0 && collectibleItems.length > 0 ? (
                        <label className="layout-panel__field" style={{ marginTop: 6 }}>
                          <span className="layout-panel__label">All Slots Reward Item</span>
                          <select
                            className="layout-panel__input"
                            value={selectedLayoutSpriteInteraction?.slotsRewardItemId ?? "__none__"}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                                slotsRewardItemId: e.target.value === "__none__" ? undefined : e.target.value,
                              })
                            }
                          >
                            <option value="__none__">None</option>
                            {collectibleItems.map((item) => (
                              <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </>
                  ) : null}

                </LayoutPanelSection>

                {!isLightSelected ? (
                  <LayoutPanelSection title="Visual" defaultOpen>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">
                        Brightness {((selectedLayoutSpriteVisuals?.brightness ?? 0) * 100).toFixed(0)}%
                      </span>
                      <input
                        className="layout-panel__input"
                        type="range"
                        min={-100}
                        max={100}
                        step={1}
                        value={Math.round((selectedLayoutSpriteVisuals?.brightness ?? 0) * 100)}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteVisuals({
                            brightness: Number(e.target.value) / 100,
                          })
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">
                        Contrast {((selectedLayoutSpriteVisuals?.contrast ?? 0) * 100).toFixed(0)}%
                      </span>
                      <input
                        className="layout-panel__input"
                        type="range"
                        min={-100}
                        max={100}
                        step={1}
                        value={Math.round((selectedLayoutSpriteVisuals?.contrast ?? 0) * 100)}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteVisuals({
                            contrast: Number(e.target.value) / 100,
                          })
                        }
                      />
                    </label>
                    <label className="layout-panel__toggle">
                      <input
                        type="checkbox"
                        checked={selectedLayoutSpriteVisuals?.waterRipple ?? false}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteVisuals({
                            waterRipple: e.target.checked || undefined,
                          })
                        }
                      />
                      <span>Water Ripple</span>
                    </label>
                  </LayoutPanelSection>
                ) : null}

                {!isLightSelected ? (
                  <LayoutPanelSection
                    title="Shadow"
                    defaultOpen={selectedLayoutSpriteShadow?.enabled ?? false}
                  >
                    <div className="layout-panel__toggle-group">
                      <label className="layout-panel__toggle">
                        <input
                          type="checkbox"
                          checked={selectedLayoutSpriteShadow?.enabled ?? false}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteShadow({
                              enabled: e.target.checked,
                            })
                          }
                        />
                        <span>Enable Shadow</span>
                      </label>
                    </div>
                    {selectedLayoutSpriteShadow?.enabled ? (
                      <>
                        <div className="layout-panel__toggle-group">
                          <label className="layout-panel__toggle">
                            <input
                              type="checkbox"
                              checked={selectedLayoutSpriteShadow?.flipY ?? false}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                  flipY: e.target.checked,
                                })
                              }
                            />
                            <span>Mirror Shadow</span>
                          </label>
                        </div>
                        <label className="layout-panel__field">
                          <span className="layout-panel__label">
                            Angle {(selectedLayoutSpriteShadow?.angle ?? 0).toFixed(2)}
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={-200}
                            max={200}
                            step={1}
                            value={Math.round((selectedLayoutSpriteShadow?.angle ?? 0) * 100)}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                angle: Number(e.target.value) / 100,
                              })
                            }
                          />
                        </label>
                        <label className="layout-panel__field">
                          <span className="layout-panel__label">
                            Length {Math.round((selectedLayoutSpriteShadow?.length ?? 0.3) * 100)}%
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={5}
                            max={150}
                            step={1}
                            value={Math.round((selectedLayoutSpriteShadow?.length ?? 0.3) * 100)}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                length: Number(e.target.value) / 100,
                              })
                            }
                          />
                        </label>
                        <label className="layout-panel__field">
                          <span className="layout-panel__label">
                            Opacity {Math.round((selectedLayoutSpriteShadow?.alpha ?? 0.35) * 100)}%
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round((selectedLayoutSpriteShadow?.alpha ?? 0.35) * 100)}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                alpha: Number(e.target.value) / 100,
                              })
                            }
                          />
                        </label>
                        <label className="layout-panel__field">
                          <span className="layout-panel__label">
                            Offset X {selectedLayoutSpriteShadow?.offsetX ?? 0}
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={-300}
                            max={300}
                            step={1}
                            value={selectedLayoutSpriteShadow?.offsetX ?? 0}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                offsetX: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label className="layout-panel__field">
                          <span className="layout-panel__label">
                            Offset Y {selectedLayoutSpriteShadow?.offsetY ?? 0}
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={-300}
                            max={300}
                            step={1}
                            value={selectedLayoutSpriteShadow?.offsetY ?? 0}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteShadow({
                                offsetY: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                      </>
                    ) : null}
                  </LayoutPanelSection>
                ) : null}

                {(["statue", "wind-turbine", "working-desk", "vinyl-turning", "two-character-fight", "small-breath-and-bre", "character-slightly-t", "animate-only-subtle", "dont-change-the-ima", "the-hands-emerge-fro", "character-idle"] as const).includes(selectedLayoutSpriteLive?.runtimeType as never) ? (
                  <LayoutPanelSection title="Animation" defaultOpen>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Animation Control</span>
                      <input
                        type="checkbox"
                        checked={selectedLayoutSpriteLive?.animControlEnabled ?? false}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteAnimControlEnabled(e.target.checked)
                        }
                      />
                    </label>
                    {collectibleItems.length > 0 && (
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Item Trigger</span>
                        <select
                          className="layout-panel__select"
                          value={selectedLayoutSpriteLive?.interaction?.animTriggerItemId ?? ""}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              animTriggerItemId: e.target.value || undefined,
                            })
                          }
                        >
                          <option value="">— none —</option>
                          {collectibleItems.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">
                        Speed {(selectedLayoutSpriteLive?.animSpeed ?? 0.3).toFixed(2)}
                      </span>
                      <input
                        className="layout-panel__input"
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={Math.round((selectedLayoutSpriteLive?.animSpeed ?? 0.3) * 100)}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteAnimSpeed(
                            Number(e.target.value) / 100
                          )
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Rest Frame (0–35)</span>
                      <input
                        className="layout-panel__input"
                        type="number"
                        min={0}
                        max={35}
                        step={1}
                        value={selectedLayoutSpriteLive?.animStopFrame ?? 0}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteAnimStopFrame(
                            Number(e.target.value)
                          )
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Click Frame (0–35)</span>
                      <input
                        className="layout-panel__input"
                        type="number"
                        min={0}
                        max={35}
                        step={1}
                        value={selectedLayoutSpriteLive?.animClickFrame ?? 35}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteAnimClickFrame(
                            Number(e.target.value)
                          )
                        }
                      />
                    </label>
                  </LayoutPanelSection>
                ) : null}

                {isLightSelected ? (
                  <LayoutPanelSection title="Light Settings" defaultOpen>
                    <div className="layout-panel__field-row">
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Width</span>
                        <input
                          className="layout-panel__input"
                          type="number"
                          min={8}
                          max={2000}
                          step={4}
                          value={selectedLayoutSpriteLive?.width ?? 200}
                          onChange={(e) =>
                            controllerRef.current?.setSizeSelectedLayoutSprite(
                              Number(e.target.value),
                              selectedLayoutSpriteLive?.height ?? 200
                            )
                          }
                        />
                      </label>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Height</span>
                        <input
                          className="layout-panel__input"
                          type="number"
                          min={8}
                          max={2000}
                          step={4}
                          value={selectedLayoutSpriteLive?.height ?? 200}
                          onChange={(e) =>
                            controllerRef.current?.setSizeSelectedLayoutSprite(
                              selectedLayoutSpriteLive?.width ?? 200,
                              Number(e.target.value)
                            )
                          }
                        />
                      </label>
                    </div>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Color</span>
                      <input
                        className="layout-panel__input"
                        type="color"
                        value={selectedLayoutSpriteLight?.color ?? "#e47c3e"}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteLight({ color: e.target.value })
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">
                        Intensity {((selectedLayoutSpriteLight?.intensity ?? 1) * 100).toFixed(0)}%
                      </span>
                      <input
                        className="layout-panel__input"
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={Math.round((selectedLayoutSpriteLight?.intensity ?? 1) * 100)}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteLight({
                            intensity: Number(e.target.value) / 100,
                          })
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">
                        Opacity {((selectedLayoutSpriteAlpha ?? 0.22) * 100).toFixed(0)}%
                      </span>
                      <input
                        className="layout-panel__input"
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round((selectedLayoutSpriteAlpha ?? 0.22) * 100)}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteAlpha(Number(e.target.value) / 100)
                        }
                      />
                    </label>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Blend Mode</span>
                      <select
                        className="layout-panel__select"
                        value={selectedLayoutSpriteLight?.blendMode ?? "screen"}
                        onChange={(e) =>
                          controllerRef.current?.updateSelectedLayoutSpriteLight({
                            blendMode: e.target.value as "normal" | "screen" | "add" | "lighten",
                          })
                        }
                      >
                        <option value="screen">Screen</option>
                        <option value="add">Add</option>
                        <option value="lighten">Lighten</option>
                        <option value="normal">Normal</option>
                      </select>
                    </label>

                    <LayoutPanelSection
                      title="Particles"
                      defaultOpen={selectedLayoutSpriteParticles?.enabled ?? false}
                    >
                      <div className="layout-panel__toggle-group">
                        <label className="layout-panel__toggle">
                          <input
                            type="checkbox"
                            checked={selectedLayoutSpriteParticles?.enabled ?? false}
                            onChange={(e) =>
                              controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                enabled: e.target.checked,
                              })
                            }
                          />
                          <span>Enable Particles</span>
                        </label>
                      </div>

                      {selectedLayoutSpriteParticles?.enabled ? (
                        <>
                          <div className="layout-panel__actions">
                            {Object.entries(LIGHT_PARTICLE_PRESETS).map(([id, preset]) => (
                              <button
                                key={id}
                                type="button"
                                className="layout-panel__action"
                                onClick={() =>
                                  controllerRef.current?.updateSelectedLayoutSpriteParticles(preset.config)
                                }
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {(
                            [
                              ["Particle Color", "color", "color"],
                            ] as const
                          ).map(([label, type, field]) => (
                            <label key={field} className="layout-panel__field">
                              <span className="layout-panel__label">{label}</span>
                              <input
                                className="layout-panel__input"
                                type={type}
                                value={(selectedLayoutSpriteParticles as Record<string, string>)[field] ?? "#f7deb0"}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                    [field]: e.target.value,
                                  })
                                }
                              />
                            </label>
                          ))}

                          <label className="layout-panel__field">
                            <span className="layout-panel__label">Particle Blend Mode</span>
                            <select
                              className="layout-panel__select"
                              value={selectedLayoutSpriteParticles?.blendMode ?? "screen"}
                              onChange={(e) =>
                                controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                  blendMode: e.target.value as "normal" | "screen" | "add" | "lighten",
                                })
                              }
                            >
                              <option value="screen">Screen</option>
                              <option value="add">Add</option>
                              <option value="lighten">Lighten</option>
                              <option value="normal">Normal</option>
                            </select>
                          </label>

                          {(
                            [
                              ["Count", "count", 1, 20, 1, 5],
                              ["Size", "size", 1, 14, 1, 4],
                            ] as const
                          ).map(([label, field, min, max, step, def]) => (
                            <label key={field} className="layout-panel__field">
                              <span className="layout-panel__label">
                                {label} {Math.round((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def)}
                                {field === "size" ? "px" : ""}
                              </span>
                              <input
                                className="layout-panel__input"
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={Math.round((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def)}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                    [field]: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                          ))}

                          {(
                            [
                              ["Opacity", "opacity", 1, 100, 1, 0.18, 100],
                              ["Speed", "speed", 20, 240, 1, 1, 100],
                              ["Drift", "drift", 20, 240, 1, 1, 100],
                            ] as const
                          ).map(([label, field, min, max, step, def, divisor]) => (
                            <label key={field} className="layout-panel__field">
                              <span className="layout-panel__label">
                                {label} {Math.round((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def) * (divisor === 100 && def < 1 ? 100 : 1)}%
                              </span>
                              <input
                                className="layout-panel__input"
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={Math.round(((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def) * divisor)}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                    [field]: Number(e.target.value) / divisor,
                                  })
                                }
                              />
                            </label>
                          ))}

                          {(
                            [
                              ["Area Width", "areaWidth", 12, 220, 1, 56, "px"],
                              ["Area Height", "areaHeight", 12, 260, 1, 88, "px"],
                            ] as const
                          ).map(([label, field, min, max, step, def, unit]) => (
                            <label key={field} className="layout-panel__field">
                              <span className="layout-panel__label">
                                {label} {Math.round((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def)}{unit}
                              </span>
                              <input
                                className="layout-panel__input"
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={Math.round((selectedLayoutSpriteParticles as Record<string, number>)[field] ?? def)}
                                onChange={(e) =>
                                  controllerRef.current?.updateSelectedLayoutSpriteParticles({
                                    [field]: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                          ))}
                        </>
                      ) : null}
                    </LayoutPanelSection>

                    <div className="layout-panel__actions">
                      <button
                        type="button"
                        className="layout-panel__action"
                        onClick={() => {
                          controllerRef.current?.deleteSelectedLayoutSprite();
                          setSelectedLayoutSpriteId(null);
                        }}
                      >
                        Remove Light
                      </button>
                    </div>
                  </LayoutPanelSection>
                ) : null}

                {/* Runtime Smoke Settings */}
                {selectedLayoutSpriteLive?.runtimeType === "smoke" ? (
                  <LayoutPanelSection title="Smoke Settings" defaultOpen>
                    {(
                      [
                        ["Scale", "scale", 0.2, 3, 0.01],
                        ["Density", "density", 0.1, 3, 0.01],
                        ["Drift", "drift", 0.1, 3, 0.01],
                        ["Rise", "rise", 0.1, 3, 0.01],
                        ["Speed", "speed", 0.1, 3, 0.01],
                      ] as [string, keyof SceneSpriteRuntimeSmokeConfig, number, number, number][]
                    ).map(([label, field, min, max, step]) => (
                      <label key={field} className="layout-panel__field">
                        <span className="layout-panel__label">
                          {label} {((selectedLayoutSpriteLive?.smokeControls?.[field] ?? (field === "scale" ? 1 : field === "density" ? 1.42 : field === "drift" ? 0.74 : 1)) as number).toFixed(2)}
                        </span>
                        <input
                          className="layout-panel__input"
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={(selectedLayoutSpriteLive?.smokeControls?.[field] ?? (field === "scale" ? 1 : field === "density" ? 1.42 : field === "drift" ? 0.74 : 1)) as number}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteSmokeControls({
                              [field]: Number(e.target.value),
                            } as Partial<SceneSpriteRuntimeSmokeConfig>)
                          }
                        />
                      </label>
                    ))}
                    <div className="layout-panel__actions">
                      <button
                        type="button"
                        className="layout-panel__action"
                        onClick={() => {
                          controllerRef.current?.deleteSelectedLayoutSprite();
                          setSelectedLayoutSpriteId(null);
                        }}
                      >
                        Remove Smoke
                      </button>
                    </div>
                  </LayoutPanelSection>
                ) : null}

                {/* Rain splash */}
                <LayoutPanelSection title="Rain Splash">
                  <div className="layout-panel__toggle-group">
                    <label className="layout-panel__toggle">
                      <input
                        type="checkbox"
                        checked={effectiveRainSplashSegments.some((s) => s.enabled)}
                        onChange={(e) =>
                          controllerRef.current?.setSelectedLayoutSpriteRainSplashSegments(
                            e.target.checked ? [createDefaultRainSplashConfig()] : [],
                          )
                        }
                      />
                      <span>Rain Splash</span>
                    </label>
                  </div>

                  {effectiveRainSplashSegments.length > 0 && activeRainSplashSegment ? (
                    <>
                      <div className="layout-panel__actions">
                        <button
                          type="button"
                          className="layout-panel__action"
                          onClick={() => {
                            onUpdateRainSplashSegments(
                              (segs) => [...segs, createDefaultRainSplashConfig()],
                              effectiveRainSplashSegments,
                            );
                            setSelectedRainSplashSegmentIndex(effectiveRainSplashSegments.length);
                          }}
                        >
                          Add Segment
                        </button>
                        <button
                          type="button"
                          className="layout-panel__action"
                          onClick={() =>
                            onUpdateRainSplashSegments(
                              (segs) => segs.filter((_, i) => i !== selectedRainSplashSegmentIndex),
                              effectiveRainSplashSegments,
                            )
                          }
                          disabled={effectiveRainSplashSegments.length <= 1}
                        >
                          Delete Segment
                        </button>
                      </div>

                      {effectiveRainSplashSegments.length > 1 ? (
                        <div className="layout-panel__actions">
                          {effectiveRainSplashSegments.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`layout-panel__action${i === selectedRainSplashSegmentIndex ? " is-active" : ""}`}
                              onClick={() => setSelectedRainSplashSegmentIndex(i)}
                            >
                              Seg {i + 1}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {(
                        [
                          ["Zone Left", "zoneLeft", 0, 1, 0.01],
                          ["Zone Right", "zoneRight", 0, 1, 0.01],
                          ["Zone Top", "zoneTop", 0, 1, 0.01],
                          ["Zone Bottom", "zoneBottom", 0, 1, 0.01],
                          ["Splash Left", "splashLeft", 0, 1, 0.01],
                          ["Splash Right", "splashRight", 0, 1, 0.01],
                          ["Splash Y", "splashY", 0, 1, 0.01],
                          ["Splash X Offset", "splashXOffset", -500, 500, 1],
                        ] as const
                      ).map(([label, field, min, max, step]) => (
                        <label key={field} className="layout-panel__field">
                          <span className="layout-panel__label">
                            {label} {((activeRainSplashSegment as Record<string, number>)[field] ?? 0).toFixed(2)}
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={(activeRainSplashSegment as Record<string, number>)[field] ?? 0}
                            onChange={(e) =>
                              onUpdateRainSplashSegments(
                                (segs) =>
                                  segs.map((seg, i) =>
                                    i === selectedRainSplashSegmentIndex
                                      ? { ...seg, [field]: Number(e.target.value) }
                                      : seg,
                                  ),
                                effectiveRainSplashSegments,
                              )
                            }
                          />
                        </label>
                      ))}

                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Width {activeRainSplashWidthPercent}%</span>
                        <input
                          className="layout-panel__input"
                          type="range"
                          min={1}
                          max={100}
                          step={1}
                          value={activeRainSplashWidthPercent}
                          onChange={(e) =>
                            onUpdateRainSplashSegments(
                              (segs) =>
                                segs.map((seg, i) =>
                                  i === selectedRainSplashSegmentIndex
                                    ? { ...seg, widthRatio: Number(e.target.value) / 100 }
                                    : seg,
                                ),
                              effectiveRainSplashSegments,
                            )
                          }
                        />
                      </label>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Min Width {activeRainSplashMinWidthPercent}%</span>
                        <input
                          className="layout-panel__input"
                          type="range"
                          min={1}
                          max={100}
                          step={1}
                          value={activeRainSplashMinWidthPercent}
                          onChange={(e) =>
                            onUpdateRainSplashSegments(
                              (segs) =>
                                segs.map((seg, i) =>
                                  i === selectedRainSplashSegmentIndex
                                    ? { ...seg, minWidthRatio: Number(e.target.value) / 100 }
                                    : seg,
                                ),
                              effectiveRainSplashSegments,
                            )
                          }
                        />
                      </label>
                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Max Width {activeRainSplashMaxWidthPercent}%</span>
                        <input
                          className="layout-panel__input"
                          type="range"
                          min={1}
                          max={100}
                          step={1}
                          value={activeRainSplashMaxWidthPercent}
                          onChange={(e) =>
                            onUpdateRainSplashSegments(
                              (segs) =>
                                segs.map((seg, i) =>
                                  i === selectedRainSplashSegmentIndex
                                    ? { ...seg, maxWidthRatio: Number(e.target.value) / 100 }
                                    : seg,
                                ),
                              effectiveRainSplashSegments,
                            )
                          }
                        />
                      </label>

                      {(
                        [
                          ["Min Duration", "minDurationMs", 60, 600, 10, 180, "ms"],
                          ["Max Duration", "maxDurationMs", 60, 800, 10, 320, "ms"],
                        ] as const
                      ).map(([label, field, min, max, step, def, unit]) => (
                        <label key={field} className="layout-panel__field">
                          <span className="layout-panel__label">
                            {label} {Math.round((activeRainSplashSegment as Record<string, number>)[field] ?? def)}{unit}
                          </span>
                          <input
                            className="layout-panel__input"
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={Math.round((activeRainSplashSegment as Record<string, number>)[field] ?? def)}
                            onChange={(e) =>
                              onUpdateRainSplashSegments(
                                (segs) =>
                                  segs.map((seg, i) =>
                                    i === selectedRainSplashSegmentIndex
                                      ? { ...seg, [field]: Number(e.target.value) }
                                      : seg,
                                  ),
                                effectiveRainSplashSegments,
                              )
                            }
                          />
                        </label>
                      ))}
                    </>
                  ) : null}
                </LayoutPanelSection>

                {/* Transform */}
                <LayoutPanelSection title="Transform">
                  <div className="layout-panel__icon-row">
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Scale down"
                      aria-label="Scale down"
                      onClick={() => controllerRef.current?.scaleSelectedLayoutSprite(0.9)}
                    >
                      <ZoomOut aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Scale up"
                      aria-label="Scale up"
                      onClick={() => controllerRef.current?.scaleSelectedLayoutSprite(1.1)}
                    >
                      <ZoomIn aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Flip horizontal"
                      aria-label="Flip horizontal"
                      onClick={() => controllerRef.current?.flipSelectedLayoutSpriteHorizontally()}
                    >
                      <FlipHorizontal2 aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Z-index -1"
                      aria-label="Z-index down"
                      onClick={() => controllerRef.current?.offsetSelectedLayoutSpriteZIndex(-1)}
                    >
                      <ArrowDownWideNarrow aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Z-index +1"
                      aria-label="Z-index up"
                      onClick={() => controllerRef.current?.offsetSelectedLayoutSpriteZIndex(1)}
                    >
                      <ArrowUpWideNarrow aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Send to back"
                      aria-label="Send to back"
                      onClick={() => controllerRef.current?.sendSelectedLayoutSpriteToBack()}
                    >
                      <ArrowDown aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn"
                      title="Bring to front"
                      aria-label="Bring to front"
                      onClick={() => controllerRef.current?.bringSelectedLayoutSpriteToFront()}
                    >
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="layout-panel__icon-btn layout-panel__icon-btn--danger"
                      title="Delete"
                      aria-label="Delete"
                      onClick={() => {
                        controllerRef.current?.deleteSelectedLayoutSprite();
                        setSelectedLayoutSpriteId(null);
                      }}
                    >
                      <Trash aria-hidden="true" />
                    </button>
                  </div>
                </LayoutPanelSection>
              </>
            ) : null}

            {/* Smoke controls */}
            {isSmokeSelected && sceneThreeSmokeControls ? (
              <LayoutPanelSection title="Smoke Controls" defaultOpen>
                {(
                  [
                    ["Smoke X", "x", 1100, 1700, 1],
                    ["Smoke Y", "y", 240, 620, 1],
                  ] as const
                ).map(([label, field, min, max, step]) => (
                  <label key={field} className="layout-panel__field">
                    <span className="layout-panel__label">{label}</span>
                    <input
                      className="layout-panel__input"
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={sceneThreeSmokeControls[field]}
                      onChange={(e) => onSmokeUpdate(field, Number(e.target.value))}
                    />
                  </label>
                ))}

                {(
                  [
                    ["Smoke Scale", "scale", 0.4, 2, 0.01],
                    ["Density", "density", 0.2, 2, 0.01],
                    ["Drift", "drift", 0.2, 2, 0.01],
                    ["Rise", "rise", 0.2, 2, 0.01],
                    ["Speed", "speed", 0.2, 2, 0.01],
                  ] as const
                ).map(([label, field, min, max, step]) => (
                  <label key={field} className="layout-panel__field">
                    <span className="layout-panel__label">{label}</span>
                    <input
                      className="layout-panel__input"
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={sceneThreeSmokeControls[field]}
                      onChange={(e) => onSmokeUpdate(field, Number(e.target.value))}
                    />
                  </label>
                ))}
              </LayoutPanelSection>
            ) : null}
          </>
        ) : null}
      </LayoutPanelSection>
    </aside>
  );
}
