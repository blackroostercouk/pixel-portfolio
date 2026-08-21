"use client";

import type { SceneInfoModalStageConfig, SceneInfoModalStageId } from "@/lib/game/types";
import type { ActiveLayoutInfoModal } from "@/lib/game/hooks/use-info-modal";

type Props = {
  activeLayoutInfoModal: ActiveLayoutInfoModal | null;
  activeLayoutInfoStage: SceneInfoModalStageConfig | undefined;
  activeLayoutInfoStageId: SceneInfoModalStageId;
  activeLayoutInfoUsesWindow: boolean;
  activeLayoutInfoPortraitSrc: string;
  activeLayoutInfoHasAlternateImage: boolean;
  activeLayoutInfoHasFinalStage: boolean;
  activeLayoutInfoModalFlipped: boolean;
  activeLayoutInfoInputValue: string;
  onClose: () => void;
  onPreviewClick: () => void;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
};

export function LayoutInfoModal({
  activeLayoutInfoModal,
  activeLayoutInfoStage,
  activeLayoutInfoUsesWindow,
  activeLayoutInfoPortraitSrc,
  activeLayoutInfoHasAlternateImage,
  activeLayoutInfoHasFinalStage,
  activeLayoutInfoModalFlipped,
  activeLayoutInfoInputValue,
  onClose,
  onPreviewClick,
  onInputChange,
  onInputSubmit,
}: Props) {
  if (!activeLayoutInfoModal || !activeLayoutInfoStage) return null;
  if (!activeLayoutInfoModal.interaction.hasInfo) return null;

  return (
    <div className="item-info-modal-backdrop" onClick={onClose}>
      {activeLayoutInfoUsesWindow ? (
        <div
          className="info-window-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="layout-info-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="info-window-modal__close"
            aria-label="Close object details"
            onClick={onClose}
          />

          <img
            className="info-window-modal__frame"
            src="/assets/ui/info_window.png"
            alt=""
            aria-hidden="true"
          />

          <div className="info-window-modal__speech">
            {activeLayoutInfoStage.text ? (
              <p className="info-window-modal__speech-text">{activeLayoutInfoStage.text}</p>
            ) : null}
          </div>

          <div className="info-window-modal__portrait">
            <img
              className="info-window-modal__portrait-image"
              src={activeLayoutInfoPortraitSrc}
              alt={activeLayoutInfoStage.title ?? "Character portrait"}
            />
          </div>

          <div className="info-window-modal__body">
            {activeLayoutInfoStage.title ? (
              <h2
                id="layout-info-modal-title"
                className="info-window-modal__title font-pixel"
              >
                {activeLayoutInfoStage.title}
              </h2>
            ) : null}

            {activeLayoutInfoStage.bodyText ? (
              <div className="info-window-modal__scroll">
                <p className="info-window-modal__body-text">{activeLayoutInfoStage.bodyText}</p>
              </div>
            ) : null}

            {activeLayoutInfoStage.inputEnabled ? (
              <div className="layout-runtime-input info-window-modal__input">
                <input
                  className="layout-runtime-input__field"
                  type="text"
                  value={activeLayoutInfoInputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={activeLayoutInfoStage.inputPlaceholder ?? "Type your answer..."}
                />
                <button
                  type="button"
                  className="layout-runtime-input__submit font-pixel"
                  onClick={onInputSubmit}
                >
                  Submit
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className="item-info-modal item-info-modal--layout"
          role="dialog"
          aria-modal="true"
          aria-labelledby="layout-info-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="item-info-modal__close"
            aria-label="Close object details"
            onClick={onClose}
          />

          <img
            className="item-info-modal__frame"
            src="/assets/ui/modal_empty.webp"
            alt=""
            aria-hidden="true"
          />

          <button
            type="button"
            className={`item-info-modal__preview${
              activeLayoutInfoHasAlternateImage || activeLayoutInfoHasFinalStage
                ? " is-interactive"
                : ""
            }`}
            onClick={onPreviewClick}
            aria-label={
              activeLayoutInfoHasAlternateImage
                ? "Toggle alternate preview"
                : activeLayoutInfoHasFinalStage
                  ? "Reveal final preview"
                  : "Object preview"
            }
          >
            {activeLayoutInfoStage.imageSrc ? (
              <img
                className={`item-info-modal__preview-image${
                  activeLayoutInfoModalFlipped ? " is-hidden" : " is-visible"
                }`}
                src={activeLayoutInfoStage.imageSrc}
                alt={activeLayoutInfoStage.title ?? "Object preview"}
              />
            ) : null}

            {activeLayoutInfoStage.secondImageSrc ? (
              <img
                className={`item-info-modal__preview-image item-info-modal__preview-image--alternate${
                  activeLayoutInfoModalFlipped ? " is-visible" : " is-hidden"
                }`}
                src={activeLayoutInfoStage.secondImageSrc}
                alt={`${activeLayoutInfoStage.title ?? "Object"} alternate view`}
              />
            ) : null}
          </button>

          <div className="item-info-modal__content">
            <h2 id="layout-info-modal-title" className="item-info-modal__title font-pixel">
              {activeLayoutInfoStage.title ?? "Info"}
            </h2>

            {activeLayoutInfoStage.text ? (
              <p className="item-info-modal__description">{activeLayoutInfoStage.text}</p>
            ) : null}

            {activeLayoutInfoStage.inputEnabled ? (
              <div className="layout-runtime-input">
                <input
                  className="layout-runtime-input__field"
                  type="text"
                  value={activeLayoutInfoInputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={activeLayoutInfoStage.inputPlaceholder ?? "Type your answer..."}
                />
                <button
                  type="button"
                  className="layout-runtime-input__submit font-pixel"
                  onClick={onInputSubmit}
                >
                  Submit
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
