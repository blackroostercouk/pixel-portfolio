"use client";

import { useRef, useState } from "react";
import {
  getNextInfoModalStage,
  hasStageContent,
  normalizeAnswer,
  resolveInfoModalStage,
} from "@/lib/game/layout-utils";
import type {
  SceneInfoModalConfig,
  SceneInfoModalStageId,
  SceneSpriteInteractionConfig,
} from "@/lib/game/types";
import type { DynamicInventoryItem } from "@/lib/game/core/game-state";

export type ActiveLayoutInfoModal = {
  spriteId: string;
  interaction: NonNullable<SceneSpriteInteractionConfig>;
};

type UseInfoModalOptions = {
  onCollect: (item: DynamicInventoryItem) => void;
};

export function useInfoModal({ onCollect }: UseInfoModalOptions) {
  const [activeLayoutInfoModal, setActiveLayoutInfoModal] =
    useState<ActiveLayoutInfoModal | null>(null);
  const [activeLayoutInfoModalStage, setActiveLayoutInfoModalStage] =
    useState<SceneInfoModalStageId>("normal");
  const [activeLayoutInfoModalFlipped, setActiveLayoutInfoModalFlipped] = useState(false);
  const [activeLayoutInfoInputValue, setActiveLayoutInfoInputValue] = useState("");
  const [resolvedLayoutInfoModalStages, setResolvedLayoutInfoModalStages] = useState<
    Partial<Record<string, SceneInfoModalStageId>>
  >({});
  const resolvedLayoutInfoModalStagesRef = useRef<Partial<Record<string, SceneInfoModalStageId>>>({});
  resolvedLayoutInfoModalStagesRef.current = resolvedLayoutInfoModalStages;
  const [collectedSpriteIds, setCollectedSpriteIds] = useState<Set<string>>(new Set());

  const activeLayoutInfoModalConfig =
    (activeLayoutInfoModal?.interaction.infoModal as SceneInfoModalConfig | undefined) ??
    undefined;
  const resolvedActiveLayoutInfo = resolveInfoModalStage(
    activeLayoutInfoModalConfig,
    activeLayoutInfoModalStage,
  );
  const activeLayoutInfoStageId = resolvedActiveLayoutInfo.stageId;
  const activeLayoutInfoStage = resolvedActiveLayoutInfo.stage;
  const activeLayoutInfoUsesWindow = Boolean(
    activeLayoutInfoStage?.windowMode || activeLayoutInfoStage?.bodyText,
  );
  const activeLayoutInfoPortraitSrc =
    activeLayoutInfoStage?.portraitSrc ?? "/assets/scene/karakter.webp";
  const activeLayoutInfoHasAlternateImage =
    activeLayoutInfoStageId === "normal" && Boolean(activeLayoutInfoStage?.secondImageSrc);
  const activeLayoutInfoHasFinalStage =
    activeLayoutInfoStageId === "updated" && hasStageContent(activeLayoutInfoModalConfig?.final);
  const activeLayoutInfoHasCollectible =
    activeLayoutInfoStageId === "final" && Boolean(activeLayoutInfoStage?.collectibleSrc);
  const activeLayoutInfoIsCollected =
    activeLayoutInfoStageId === "final" &&
    Boolean(activeLayoutInfoModal && collectedSpriteIds.has(activeLayoutInfoModal.spriteId));

  const openLayoutInfoModal = (spriteId: string, interaction: NonNullable<SceneSpriteInteractionConfig>) => {
    const preferredStage = resolvedLayoutInfoModalStagesRef.current[spriteId] ?? "normal";
    setActiveLayoutInfoModal({ spriteId, interaction });
    setActiveLayoutInfoModalStage(preferredStage);
    setActiveLayoutInfoModalFlipped(false);
    setActiveLayoutInfoInputValue("");
  };

  const closeActiveLayoutInfoModal = () => {
    setActiveLayoutInfoModal(null);
    setActiveLayoutInfoModalFlipped(false);
    setActiveLayoutInfoInputValue("");
  };

  const submitActiveLayoutInfoInput = () => {
    if (!activeLayoutInfoModal || !activeLayoutInfoStage?.correctAnswer) return;

    if (
      normalizeAnswer(activeLayoutInfoInputValue) !==
      normalizeAnswer(activeLayoutInfoStage.correctAnswer)
    ) {
      return;
    }

    const nextStageId = getNextInfoModalStage(activeLayoutInfoModalConfig, activeLayoutInfoStageId);

    setResolvedLayoutInfoModalStages((current) => ({
      ...current,
      [activeLayoutInfoModal.spriteId]: nextStageId,
    }));
    setActiveLayoutInfoModalStage(nextStageId);
    setActiveLayoutInfoModalFlipped(false);
    setActiveLayoutInfoInputValue("");
  };

  const handleActiveLayoutInfoPreviewClick = () => {
    if (activeLayoutInfoStageId === "normal" && activeLayoutInfoHasAlternateImage) {
      setActiveLayoutInfoModalFlipped((current) => !current);
      return;
    }

    if (activeLayoutInfoStageId === "updated" && activeLayoutInfoHasFinalStage) {
      if (!activeLayoutInfoModal) return;

      setResolvedLayoutInfoModalStages((current) => ({
        ...current,
        [activeLayoutInfoModal.spriteId]: "final",
      }));
      setActiveLayoutInfoModalStage("final");
      setActiveLayoutInfoModalFlipped(false);
      return;
    }

    if (activeLayoutInfoStageId === "final" && activeLayoutInfoHasCollectible && !activeLayoutInfoIsCollected) {
      if (!activeLayoutInfoModal || !activeLayoutInfoStage?.collectibleSrc) return;
      onCollect({
        id: `modal-collect-${activeLayoutInfoModal.spriteId}`,
        label: activeLayoutInfoStage.collectibleLabel ?? "Item",
        iconSrc: activeLayoutInfoStage.collectibleSrc,
      });
      setCollectedSpriteIds((prev) => new Set(prev).add(activeLayoutInfoModal.spriteId));
    }
  };

  return {
    activeLayoutInfoModal,
    setActiveLayoutInfoModal,
    activeLayoutInfoModalStage,
    setActiveLayoutInfoModalStage,
    activeLayoutInfoModalFlipped,
    setActiveLayoutInfoModalFlipped,
    activeLayoutInfoInputValue,
    setActiveLayoutInfoInputValue,
    resolvedLayoutInfoModalStagesRef,
    activeLayoutInfoModalConfig,
    activeLayoutInfoStageId,
    activeLayoutInfoStage,
    activeLayoutInfoUsesWindow,
    activeLayoutInfoPortraitSrc,
    activeLayoutInfoHasAlternateImage,
    activeLayoutInfoHasFinalStage,
    activeLayoutInfoHasCollectible,
    activeLayoutInfoIsCollected,
    openLayoutInfoModal,
    closeActiveLayoutInfoModal,
    submitActiveLayoutInfoInput,
    handleActiveLayoutInfoPreviewClick,
  };
}
