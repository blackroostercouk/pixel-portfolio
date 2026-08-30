"use client";

import { useState, type ChangeEvent } from "react";
import { INFO_MODAL_STAGE_ORDER } from "@/lib/game/builder-constants";
import type {
  SceneInfoModalConfig,
  SceneInfoModalStageConfig,
  SceneInfoModalStageId,
  SceneSpriteInteractionConfig,
  LayoutSpriteSnapshot,
} from "@/lib/game/types";

const CUSTOM_INFO_IMAGE_VALUE = "__custom_upload__";
const NONE_INFO_IMAGE_VALUE = "__none__";
const NONE_COLLECTIBLE_VALUE = "__none__";
type EditorTab = "content" | "itemUse";

type Props = {
  isOpen: boolean;
  interaction: SceneSpriteInteractionConfig | null | undefined;
  selectedSpriteId: string | null;
  allLayoutSprites?: LayoutSpriteSnapshot[];
  selectedInfoEditorStage: SceneInfoModalStageId;
  selectedInfoEditorStageConfig: Partial<SceneInfoModalStageConfig>;
  layoutInfoImageOptions: string[];
  isUploadingInfoImage: boolean;
  isUploadingCollectibleImage: boolean;
  onClose: () => void;
  onStageChange: (stageId: SceneInfoModalStageId) => void;
  onStageUpdate: (stageId: SceneInfoModalStageId, patch: Partial<SceneInfoModalConfig[SceneInfoModalStageId]>) => void;
  onInteractionUpdate: (patch: Partial<SceneSpriteInteractionConfig>) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onCollectibleImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function InfoEditor({
  isOpen,
  interaction,
  selectedSpriteId,
  allLayoutSprites = [],
  selectedInfoEditorStage,
  selectedInfoEditorStageConfig,
  layoutInfoImageOptions,
  isUploadingInfoImage,
  isUploadingCollectibleImage,
  onClose,
  onStageChange,
  onStageUpdate,
  onInteractionUpdate,
  onImageUpload,
  onCollectibleImageUpload,
}: Props) {
  const [activeTab, setActiveTab] = useState<EditorTab>("content");

  if (!isOpen || !interaction?.clickable || !interaction?.hasInfo) return null;

  const hasCollectible = Boolean(interaction?.infoModal?.final?.collectibleSrc);
  const targetOptions = allLayoutSprites.filter((s) => s.id !== selectedSpriteId);

  return (
    <div className="layout-info-editor-backdrop" onClick={onClose}>
      <div className="layout-info-editor font-pixel" onClick={(e) => e.stopPropagation()}>
        <div className="layout-info-editor__header">
          <p className="layout-info-editor__eyebrow">Info Modal Content</p>
          <button type="button" className="layout-info-editor__close" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Top-level tabs: Content | Item Use */}
        <div className="layout-info-editor__tabs">
          <button
            type="button"
            className={`layout-info-editor__tab${activeTab === "content" ? " is-active" : ""}`}
            onClick={() => setActiveTab("content")}
          >
            Content
          </button>
          {hasCollectible ? (
            <button
              type="button"
              className={`layout-info-editor__tab${activeTab === "itemUse" ? " is-active" : ""}`}
              onClick={() => setActiveTab("itemUse")}
            >
              Item Use
            </button>
          ) : null}
        </div>

        {/* ── Item Use tab ── */}
        {activeTab === "itemUse" ? (
          <div>
            <p className="layout-panel__hint" style={{ marginBottom: 8 }}>
              Final stage&apos;de collect edilen item seçiliyken hangi objeye tıklanınca ne olsun?
            </p>

            <label className="layout-panel__field">
              <span className="layout-panel__label">Target Object</span>
              <select
                className="layout-panel__select"
                value={interaction?.collectTargetObjectId ?? NONE_COLLECTIBLE_VALUE}
                onChange={(e) =>
                  onInteractionUpdate({
                    collectTargetObjectId: e.target.value === NONE_COLLECTIBLE_VALUE ? undefined : e.target.value,
                  })
                }
              >
                <option value={NONE_COLLECTIBLE_VALUE}>None</option>
                {targetOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.interaction?.infoTitle ?? s.id}
                  </option>
                ))}
              </select>
            </label>

            {interaction?.collectTargetObjectId ? (
              <>
                <label className="layout-panel__field">
                  <span className="layout-panel__label">Action</span>
                  <select
                    className="layout-panel__select"
                    value={interaction?.collectTargetAction ?? "openModal"}
                    onChange={(e) =>
                      onInteractionUpdate({
                        collectTargetAction: e.target.value as "openModal" | "giveCollectible",
                      })
                    }
                  >
                    <option value="openModal">Open modal on target</option>
                    <option value="giveCollectible">Give a new item</option>
                  </select>
                </label>

                <label className="layout-panel__field">
                  <input
                    type="checkbox"
                    checked={interaction?.collectConsumeOnUse ?? false}
                    onChange={(e) =>
                      onInteractionUpdate({ collectConsumeOnUse: e.target.checked || undefined })
                    }
                  />
                  <span className="layout-panel__label">Remove from inventory after use</span>
                </label>

                {(interaction?.collectTargetAction ?? "openModal") === "giveCollectible" ? (
                  <>
                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Reward Image</span>
                      <select
                        className="layout-panel__select"
                        value={interaction?.collectTargetCollectibleSrc ?? NONE_COLLECTIBLE_VALUE}
                        onChange={(e) =>
                          onInteractionUpdate({
                            collectTargetCollectibleSrc:
                              e.target.value === NONE_COLLECTIBLE_VALUE ? undefined : e.target.value,
                          })
                        }
                      >
                        <option value={NONE_COLLECTIBLE_VALUE}>Select image...</option>
                        {layoutInfoImageOptions.map((src) => (
                          <option key={src} value={src}>
                            {src.split("/").pop()}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="layout-panel__field">
                      <span className="layout-panel__label">Reward Label</span>
                      <input
                        className="layout-panel__input"
                        type="text"
                        value={interaction?.collectTargetCollectibleLabel ?? ""}
                        placeholder="e.g. Golden Key"
                        onChange={(e) =>
                          onInteractionUpdate({
                            collectTargetCollectibleLabel: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {/* ── Content tab ── */}
        {activeTab === "content" ? (
          <div>
            {/* Stage tabs: Normal | Updated | Final */}
            <div className="layout-info-editor__tabs">
              {INFO_MODAL_STAGE_ORDER.map((stageId) => (
                <button
                  key={stageId}
                  type="button"
                  className={`layout-info-editor__tab${selectedInfoEditorStage === stageId ? " is-active" : ""}`}
                  onClick={() => onStageChange(stageId)}
                >
                  {stageId.charAt(0).toUpperCase() + stageId.slice(1)}
                </button>
              ))}
            </div>

            <label className="layout-panel__field">
              <span className="layout-panel__label">Title</span>
              <input
                className="layout-panel__input"
                type="text"
                value={selectedInfoEditorStageConfig.title ?? ""}
                onChange={(e) =>
                  onStageUpdate(selectedInfoEditorStage, { title: e.target.value || undefined })
                }
                placeholder="Modal title"
              />
            </label>

            <label className="layout-panel__field">
              <span className="layout-panel__label">Text</span>
              <textarea
                className="layout-panel__textarea"
                rows={6}
                value={selectedInfoEditorStageConfig.text ?? ""}
                onChange={(e) =>
                  onStageUpdate(selectedInfoEditorStage, { text: e.target.value || undefined })
                }
                placeholder="Modal description text"
              />
            </label>

            <label className="layout-panel__field">
              <span className="layout-panel__label">Image</span>
              <select
                className="layout-panel__select"
                value={
                  selectedInfoEditorStageConfig.imageSrc
                    ? layoutInfoImageOptions.includes(selectedInfoEditorStageConfig.imageSrc)
                      ? selectedInfoEditorStageConfig.imageSrc
                      : CUSTOM_INFO_IMAGE_VALUE
                    : NONE_INFO_IMAGE_VALUE
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === NONE_INFO_IMAGE_VALUE) {
                    onStageUpdate(selectedInfoEditorStage, { imageSrc: undefined });
                  } else if (v !== CUSTOM_INFO_IMAGE_VALUE) {
                    onStageUpdate(selectedInfoEditorStage, { imageSrc: v });
                  }
                }}
              >
                <option value={NONE_INFO_IMAGE_VALUE}>No image</option>
                {layoutInfoImageOptions.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
                {selectedInfoEditorStageConfig.imageSrc &&
                  !layoutInfoImageOptions.includes(selectedInfoEditorStageConfig.imageSrc) ? (
                  <option value={CUSTOM_INFO_IMAGE_VALUE}>{selectedInfoEditorStageConfig.imageSrc}</option>
                ) : null}
                <option value={CUSTOM_INFO_IMAGE_VALUE}>Upload new image...</option>
              </select>
            </label>

            {selectedInfoEditorStage === "normal" ? (
              <label className="layout-panel__field">
                <span className="layout-panel__label">Second Image</span>
                <select
                  className="layout-panel__select"
                  value={
                    selectedInfoEditorStageConfig.secondImageSrc
                      ? layoutInfoImageOptions.includes(selectedInfoEditorStageConfig.secondImageSrc)
                        ? selectedInfoEditorStageConfig.secondImageSrc
                        : CUSTOM_INFO_IMAGE_VALUE
                      : NONE_INFO_IMAGE_VALUE
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === NONE_INFO_IMAGE_VALUE) {
                      onStageUpdate("normal", { secondImageSrc: undefined });
                    } else if (v !== CUSTOM_INFO_IMAGE_VALUE) {
                      onStageUpdate("normal", { secondImageSrc: v });
                    }
                  }}
                >
                  <option value={NONE_INFO_IMAGE_VALUE}>No second image</option>
                  {layoutInfoImageOptions.map((src) => (
                    <option key={`second-${src}`} value={src}>{src}</option>
                  ))}
                  <option value={CUSTOM_INFO_IMAGE_VALUE}>Upload new image...</option>
                </select>
              </label>
            ) : null}

            <label className="layout-panel__field">
              <span className="layout-panel__label">Upload Image</span>
              <input
                className="layout-panel__input"
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={onImageUpload}
              />
              <span className="layout-info-editor__hint">
                {isUploadingInfoImage
                  ? "Uploading and converting to webp..."
                  : "Choose any image file. It will be copied into the project and converted to webp automatically."}
              </span>
            </label>

            <label className="layout-panel__toggle">
              <input
                type="checkbox"
                checked={selectedInfoEditorStageConfig.inputEnabled ?? false}
                onChange={(e) =>
                  onStageUpdate(selectedInfoEditorStage, { inputEnabled: e.target.checked || undefined })
                }
              />
              <span>User Input</span>
            </label>

            {selectedInfoEditorStageConfig.inputEnabled ? (
              <>
                <label className="layout-panel__field">
                  <span className="layout-panel__label">Input Placeholder</span>
                  <input
                    className="layout-panel__input"
                    type="text"
                    value={selectedInfoEditorStageConfig.inputPlaceholder ?? ""}
                    onChange={(e) =>
                      onStageUpdate(selectedInfoEditorStage, { inputPlaceholder: e.target.value || undefined })
                    }
                    placeholder="Type the answer..."
                  />
                </label>

                <label className="layout-panel__field">
                  <span className="layout-panel__label">Correct Answer</span>
                  <input
                    className="layout-panel__input"
                    type="text"
                    value={selectedInfoEditorStageConfig.correctAnswer ?? ""}
                    onChange={(e) =>
                      onStageUpdate(selectedInfoEditorStage, { correctAnswer: e.target.value || undefined })
                    }
                    placeholder="Expected answer"
                  />
                </label>
              </>
            ) : null}

            {selectedInfoEditorStage === "final" ? (
              <>
                <div className="layout-info-editor__divider" />
                <p className="layout-info-editor__section-label">Collectible Item</p>

                <label className="layout-panel__field">
                  <span className="layout-panel__label">Collectible Image</span>
                  <select
                    className="layout-panel__select"
                    value={selectedInfoEditorStageConfig.collectibleSrc ?? NONE_COLLECTIBLE_VALUE}
                    onChange={(e) => {
                      const v = e.target.value;
                      onStageUpdate("final", { collectibleSrc: v === NONE_COLLECTIBLE_VALUE ? undefined : v });
                    }}
                  >
                    <option value={NONE_COLLECTIBLE_VALUE}>No collectible</option>
                    {layoutInfoImageOptions.map((src) => (
                      <option key={`collectible-${src}`} value={src}>{src}</option>
                    ))}
                    {selectedInfoEditorStageConfig.collectibleSrc &&
                      !layoutInfoImageOptions.includes(selectedInfoEditorStageConfig.collectibleSrc) ? (
                      <option value={selectedInfoEditorStageConfig.collectibleSrc}>
                        {selectedInfoEditorStageConfig.collectibleSrc}
                      </option>
                    ) : null}
                  </select>
                </label>

                <label className="layout-panel__field">
                  <span className="layout-panel__label">Upload Collectible</span>
                  <input
                    className="layout-panel__input"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={onCollectibleImageUpload}
                  />
                  <span className="layout-info-editor__hint">
                    {isUploadingCollectibleImage ? "Uploading..." : "Upload the collectible icon image."}
                  </span>
                </label>

                <label className="layout-panel__field">
                  <span className="layout-panel__label">Collectible Label</span>
                  <input
                    className="layout-panel__input"
                    type="text"
                    value={selectedInfoEditorStageConfig.collectibleLabel ?? ""}
                    onChange={(e) =>
                      onStageUpdate("final", { collectibleLabel: e.target.value || undefined })
                    }
                    placeholder="Item name"
                  />
                </label>

                <label className="layout-panel__field">
                  <span className="layout-panel__label">Finish Image</span>
                  <select
                    className="layout-panel__select"
                    value={selectedInfoEditorStageConfig.collectibleFinishImageSrc ?? NONE_COLLECTIBLE_VALUE}
                    onChange={(e) => {
                      const v = e.target.value;
                      onStageUpdate("final", {
                        collectibleFinishImageSrc: v === NONE_COLLECTIBLE_VALUE ? undefined : v,
                      });
                    }}
                  >
                    <option value={NONE_COLLECTIBLE_VALUE}>No finish image</option>
                    {layoutInfoImageOptions.map((src) => (
                      <option key={`finish-${src}`} value={src}>{src}</option>
                    ))}
                    {selectedInfoEditorStageConfig.collectibleFinishImageSrc &&
                      !layoutInfoImageOptions.includes(selectedInfoEditorStageConfig.collectibleFinishImageSrc) ? (
                      <option value={selectedInfoEditorStageConfig.collectibleFinishImageSrc}>
                        {selectedInfoEditorStageConfig.collectibleFinishImageSrc}
                      </option>
                    ) : null}
                  </select>
                  <span className="layout-info-editor__hint">
                    Collect edildikten sonra gösterilecek görsel
                  </span>
                </label>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
