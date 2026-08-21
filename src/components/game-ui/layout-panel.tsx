"use client";

import { type ReactNode, type ChangeEvent } from "react";
import { BUILDER_ANIMATED_PRESET_OPTIONS, LIGHT_PARTICLE_PRESETS } from "@/lib/game/builder-constants";
import { createDefaultRainSplashConfig } from "@/lib/game/layout-utils";
import type { PixelSceneController } from "@/lib/game/pixel-scene-controller";
import type {
  LayoutSpriteSnapshot,
  SceneSpriteInteractionConfig,
  SceneSpriteParticleConfig,
  SceneSpriteLightConfig,
  SceneSpriteVisualConfig,
  SceneSpriteRainSplashSegmentConfig,
  SceneThreeSmokeControls,
} from "@/lib/game/types";
import type { BuilderSceneDefinition, LayoutSaveState } from "@/lib/game/hooks/use-scene-layout-editor";
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
  onLightingChange: (v: boolean) => void;
  onRainChange: (v: boolean) => void;
  currentSceneId: string;

  // Save state
  layoutSaveLabel: string;
  layoutSaveState: LayoutSaveState;
  onCopyJson: () => void;
  onSave: () => void;
  onReset: () => void;

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

  // Editors
  onOpenInfoEditor: () => void;
  onOpenDrawerEditor: () => void;

  // Collectible item settings
  layoutInfoImageOptions: string[];
  isUploadingCollectIcon: boolean;
  onCollectIconUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LayoutPanel({
  controllerRef,
  isLightingEnabled,
  isRainEnabled,
  onLightingChange,
  onRainChange,
  currentSceneId,
  layoutSaveLabel,
  layoutSaveState,
  onCopyJson,
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
  onOpenInfoEditor,
  onOpenDrawerEditor,
  layoutInfoImageOptions,
  isUploadingCollectIcon,
  onCollectIconUpload,
}: LayoutPanelProps) {
  const isBuilderScene = currentSceneId === "scene-builder";

  return (
    <aside className="layout-panel font-pixel" aria-label="Scene layout tools">
      {/* Header */}
      <div className="layout-panel__header">
        <p className="layout-panel__eyebrow">Layout Mode</p>
        <div className="layout-panel__actions">
          {layoutSaveLabel ? (
            <span className={`layout-panel__status layout-panel__status--${layoutSaveState}`}>
              {layoutSaveLabel}
            </span>
          ) : null}
          <button type="button" className="layout-panel__copy" onClick={onCopyJson}>
            Copy JSON
          </button>
          <button type="button" className="layout-panel__copy" onClick={onSave}>
            Save
          </button>
          {!isBuilderScene ? (
            <button type="button" className="layout-panel__copy" onClick={onReset}>
              Reset
            </button>
          ) : null}
        </div>
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
          </div>
        </LayoutPanelSection>
      ) : null}

      {/* Background picker (builder only) */}
      {isBuilderScene ? (
        <LayoutPanelSection title="Background">
          <label className="layout-panel__field">
            <span className="layout-panel__label">Choose Background</span>
            <select
              className="layout-panel__select"
              value={activeBuilderScene?.backgroundSrc ?? ""}
              onChange={(e) => onUpdateActiveBuilderScene({ backgroundSrc: e.target.value || null })}
            >
              <option value="">No background</option>
              {builderAssetOptions.backgrounds.map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </label>

          <label className="layout-panel__field">
            <span className="layout-panel__label">Upload Background</span>
            <input
              className="layout-panel__input"
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
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
                        <span className="layout-panel__label">Collect Item Name</span>
                        <input
                          className="layout-panel__input"
                          type="text"
                          value={selectedLayoutSpriteLiveInteraction?.collectLabel ?? ""}
                          placeholder="e.g. Magic Key"
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              collectLabel: e.target.value || undefined,
                            })
                          }
                        />
                      </label>

                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Collect Item Icon</span>
                        <select
                          className="layout-panel__input"
                          value={selectedLayoutSpriteLiveInteraction?.collectIconSrc ?? ""}
                          onChange={(e) =>
                            controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                              collectIconSrc: e.target.value || undefined,
                            })
                          }
                        >
                          <option value="">Use sprite image</option>
                          {layoutInfoImageOptions.map((src) => (
                            <option key={src} value={src}>
                              {src.split("/").pop()}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="layout-panel__field">
                        <span className="layout-panel__label">Upload Icon Image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={onCollectIconUpload}
                          disabled={isUploadingCollectIcon}
                        />
                        {isUploadingCollectIcon ? (
                          <span className="layout-panel__hint">Uploading...</span>
                        ) : null}
                      </label>
                    </>
                  ) : null}
                </LayoutPanelSection>

                {!isLightSelected ? (
                  <LayoutPanelSection title="Visual">
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
                  </LayoutPanelSection>
                ) : null}

                {isLightSelected ? (
                  <LayoutPanelSection title="Light Settings" defaultOpen>
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
                  <div className="layout-panel__actions">
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.scaleSelectedLayoutSprite(0.9)}
                    >
                      Scale -
                    </button>
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.scaleSelectedLayoutSprite(1.1)}
                    >
                      Scale +
                    </button>
                  </div>
                  <div className="layout-panel__actions">
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.flipSelectedLayoutSpriteHorizontally()}
                    >
                      Flip X
                    </button>
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.offsetSelectedLayoutSpriteZIndex(-1)}
                    >
                      Z -
                    </button>
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.offsetSelectedLayoutSpriteZIndex(1)}
                    >
                      Z +
                    </button>
                  </div>
                  <div className="layout-panel__actions">
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.sendSelectedLayoutSpriteToBack()}
                    >
                      Send Back
                    </button>
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => controllerRef.current?.bringSelectedLayoutSpriteToFront()}
                    >
                      Bring Front
                    </button>
                    <button
                      type="button"
                      className="layout-panel__action"
                      onClick={() => {
                        controllerRef.current?.deleteSelectedLayoutSprite();
                        setSelectedLayoutSpriteId(null);
                      }}
                    >
                      Delete
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
