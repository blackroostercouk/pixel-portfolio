"use client";

import { type ChangeEvent } from "react";
import type { SceneSpriteInteractionConfig } from "@/lib/game/types";
import type { RefObject } from "react";
import type { PixelSceneController } from "@/lib/game/pixel-scene-controller";

const NONE_VALUE = "__none__";

type Props = {
  isOpen: boolean;
  interaction: SceneSpriteInteractionConfig | null | undefined;
  layoutInfoImageOptions: string[];
  isUploadingCollectIcon: boolean;
  controllerRef: RefObject<PixelSceneController | null>;
  onClose: () => void;
  onCollectIconUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function CollectEditor({
  isOpen,
  interaction,
  layoutInfoImageOptions,
  isUploadingCollectIcon,
  controllerRef,
  onClose,
  onCollectIconUpload,
}: Props) {
  if (!isOpen || !interaction?.clickable || !interaction?.collectible) return null;

  return (
    <div className="layout-info-editor-backdrop" onClick={onClose}>
      <div className="layout-info-editor font-pixel" onClick={(e) => e.stopPropagation()}>
        <div className="layout-info-editor__header">
          <h2 className="layout-info-editor__title">Collect Item</h2>
          <button type="button" className="layout-info-editor__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="layout-info-editor__body">
          <label className="layout-panel__field">
            <span className="layout-panel__label">Item Name</span>
            <input
              className="layout-panel__input"
              type="text"
              value={interaction?.collectLabel ?? ""}
              placeholder="e.g. Magic Key"
              onChange={(e) =>
                controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                  collectLabel: e.target.value || undefined,
                })
              }
            />
          </label>

          <label className="layout-panel__field">
            <span className="layout-panel__label">Item Icon</span>
            <select
              className="layout-panel__input"
              value={interaction?.collectIconSrc ?? NONE_VALUE}
              onChange={(e) =>
                controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                  collectIconSrc: e.target.value === NONE_VALUE ? undefined : e.target.value,
                })
              }
            >
              <option value={NONE_VALUE}>Use sprite image</option>
              {layoutInfoImageOptions.map((src) => (
                <option key={src} value={src}>
                  {src.split("/").pop()}
                </option>
              ))}
            </select>
          </label>

          {interaction?.collectIconSrc ? (
            <div className="layout-info-editor__preview">
              <img
                src={interaction.collectIconSrc}
                alt="collect icon preview"
                style={{ maxWidth: "80px", maxHeight: "80px", imageRendering: "pixelated" }}
              />
            </div>
          ) : null}

          <label className="layout-panel__field">
            <span className="layout-panel__label">Upload Icon</span>
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
        </div>
      </div>
    </div>
  );
}
