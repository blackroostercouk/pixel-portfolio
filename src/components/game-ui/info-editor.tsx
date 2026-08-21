"use client";

import { type ChangeEvent } from "react";
import { INFO_MODAL_STAGE_ORDER } from "@/lib/game/builder-constants";
import type {
  SceneInfoModalConfig,
  SceneInfoModalStageConfig,
  SceneInfoModalStageId,
  SceneSpriteInteractionConfig,
} from "@/lib/game/types";

const CUSTOM_INFO_IMAGE_VALUE = "__custom_upload__";
const NONE_INFO_IMAGE_VALUE = "__none__";

type Props = {
  isOpen: boolean;
  interaction: SceneSpriteInteractionConfig | null | undefined;
  selectedInfoEditorStage: SceneInfoModalStageId;
  selectedInfoEditorStageConfig: Partial<SceneInfoModalStageConfig>;
  layoutInfoImageOptions: string[];
  isUploadingInfoImage: boolean;
  onClose: () => void;
  onStageChange: (stageId: SceneInfoModalStageId) => void;
  onStageUpdate: (stageId: SceneInfoModalStageId, patch: Partial<SceneInfoModalConfig[SceneInfoModalStageId]>) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function InfoEditor({
  isOpen,
  interaction,
  selectedInfoEditorStage,
  selectedInfoEditorStageConfig,
  layoutInfoImageOptions,
  isUploadingInfoImage,
  onClose,
  onStageChange,
  onStageUpdate,
  onImageUpload,
}: Props) {
  if (!isOpen || !interaction?.clickable || !interaction?.hasInfo) return null;

  return (
    <div
      className="layout-info-editor-backdrop"
      onClick={onClose}
    >
      <div
        className="layout-info-editor font-pixel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="layout-info-editor__header">
          <p className="layout-info-editor__eyebrow">Info Modal Content</p>
          <button type="button" className="layout-info-editor__close" onClick={onClose}>
            Close
          </button>
        </div>

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
            onChange={(e) => onStageUpdate(selectedInfoEditorStage, { title: e.target.value || undefined })}
            placeholder="Modal title"
          />
        </label>

        <label className="layout-panel__field">
          <span className="layout-panel__label">Text</span>
          <textarea
            className="layout-panel__textarea"
            rows={6}
            value={selectedInfoEditorStageConfig.text ?? ""}
            onChange={(e) => onStageUpdate(selectedInfoEditorStage, { text: e.target.value || undefined })}
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
      </div>
    </div>
  );
}
