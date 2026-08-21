"use client";

import { useState, type ChangeEvent } from "react";
import type { SceneSpriteInteractionConfig, LayoutSpriteSnapshot } from "@/lib/game/types";
import type { RefObject } from "react";
import type { PixelSceneController } from "@/lib/game/pixel-scene-controller";

const NONE_VALUE = "__none__";
type Tab = "item" | "usage";

type Props = {
  isOpen: boolean;
  interaction: SceneSpriteInteractionConfig | null | undefined;
  selectedSpriteId: string | null;
  allLayoutSprites: LayoutSpriteSnapshot[];
  layoutInfoImageOptions: string[];
  isUploadingCollectIcon: boolean;
  controllerRef: RefObject<PixelSceneController | null>;
  onClose: () => void;
  onCollectIconUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function CollectEditor({
  isOpen,
  interaction,
  selectedSpriteId,
  allLayoutSprites,
  layoutInfoImageOptions,
  isUploadingCollectIcon,
  controllerRef,
  onClose,
  onCollectIconUpload,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("item");

  if (!isOpen || !interaction?.clickable || !interaction?.collectible) return null;

  const targetOptions = allLayoutSprites.filter((s) => s.id !== selectedSpriteId);

  return (
    <div className="layout-info-editor-backdrop" onClick={onClose}>
      <div className="layout-info-editor font-pixel" onClick={(e) => e.stopPropagation()}>
        <div className="layout-info-editor__header">
          <h2 className="layout-info-editor__title">Collect Item</h2>
          <button type="button" className="layout-info-editor__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="layout-info-editor__tabs">
          <button
            type="button"
            className={`layout-info-editor__tab${activeTab === "item" ? " is-active" : ""}`}
            onClick={() => setActiveTab("item")}
          >
            Item
          </button>
          <button
            type="button"
            className={`layout-info-editor__tab${activeTab === "usage" ? " is-active" : ""}`}
            onClick={() => setActiveTab("usage")}
          >
            Usage
          </button>
        </div>

        <div className="layout-info-editor__body">
          {activeTab === "item" ? (
            <>
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
            </>
          ) : (
            <>
              <p className="layout-panel__hint">
                Select the object this item can be used on. When the item is selected and the player clicks that object, the object&apos;s normal interaction triggers.
              </p>

              <label className="layout-panel__field">
                <span className="layout-panel__label">Target Object</span>
                <select
                  className="layout-panel__input"
                  value={interaction?.collectTargetObjectId ?? NONE_VALUE}
                  onChange={(e) =>
                    controllerRef.current?.updateSelectedLayoutSpriteInteraction({
                      collectTargetObjectId: e.target.value === NONE_VALUE ? undefined : e.target.value,
                    })
                  }
                >
                  <option value={NONE_VALUE}>None</option>
                  {targetOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.interaction?.infoTitle ?? s.id}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
