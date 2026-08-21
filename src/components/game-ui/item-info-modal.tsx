"use client";

import { useEffect, useRef, useState } from "react";
import type { GameInventoryItemDefinition } from "@/lib/game/core/game-schema";
import {
  animateItemInfoModalIn,
  animateItemInfoModalOut,
} from "@/lib/game/ui/inventory-animations";

type ItemInfoModalProps = {
  isOpen: boolean;
  item: GameInventoryItemDefinition | null;
  onClose: () => void;
};

export function ItemInfoModal({
  isOpen,
  item,
  onClose,
}: ItemInfoModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [showAlternatePreview, setShowAlternatePreview] = useState(false);

  useEffect(() => {
    setShowAlternatePreview(false);
  }, [item?.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const modal = modalRef.current;

    if (!modal || !isMounted) {
      return;
    }

    if (isOpen) {
      const tween = animateItemInfoModalIn(modal);
      return () => {
        tween.kill();
      };
    }

    const tween = animateItemInfoModalOut(modal, () => {
      setIsMounted(false);
    });

    return () => {
      tween.kill();
    };
  }, [isMounted, isOpen]);

  if (!isMounted || !item) {
    return null;
  }

  const hasAlternatePreview = Boolean(item.alternatePreviewSrc);

  return (
    <div className="item-info-modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="item-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-info-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="item-info-modal__close"
          aria-label="Close item details"
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
          className={`item-info-modal__preview${hasAlternatePreview ? " is-interactive" : ""}`}
          onClick={() => {
            if (!hasAlternatePreview) {
              return;
            }

            setShowAlternatePreview((current) => !current);
          }}
          aria-label={
            hasAlternatePreview
              ? `Toggle ${item.label} preview`
              : `${item.label} preview`
          }
        >
          <img
            className={`item-info-modal__preview-image${
              showAlternatePreview ? " is-hidden" : " is-visible"
            }`}
            src={item.previewSrc}
            alt={item.label}
          />
          {hasAlternatePreview ? (
            <img
              className={`item-info-modal__preview-image item-info-modal__preview-image--alternate${
                showAlternatePreview ? " is-visible" : " is-hidden"
              }`}
              src={item.alternatePreviewSrc}
              alt={`${item.label} alternate view`}
            />
          ) : null}
        </button>

        <div className="item-info-modal__content">
          <h2 id="item-info-modal-title" className="item-info-modal__title font-pixel">
            {item.title}
          </h2>
          <p className="item-info-modal__description">{item.description}</p>
        </div>
      </div>
    </div>
  );
}
