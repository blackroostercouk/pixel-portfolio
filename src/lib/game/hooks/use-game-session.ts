"use client";

import { useMemo, useState } from "react";
import { gameContent } from "../content/game-content";
import {
  applyGameActions,
  createEmptyGameState,
  getAvailableInteractableActions,
  getInteractableById,
  openDialogue,
  runInteractableAction,
} from "../core/action-runner";
import type { GameContent } from "../core/game-schema";
import type { SceneId } from "../core/game-state";

export function useGameSession(content: GameContent = gameContent) {
  const [state, setState] = useState(() => createEmptyGameState());

  return useMemo(
    () => ({
      content,
      state,
      inventoryItems: content.inventoryItems.filter((item) =>
        state.inventoryItemIds.includes(item.id),
      ),
      openInventory: () => {
        setState((current) =>
          applyGameActions(current, content, [{ type: "openInventory" }]),
        );
      },
      closeInventory: () => {
        setState((current) =>
          applyGameActions(current, content, [{ type: "closeInventory" }]),
        );
      },
      closeItemInfo: () => {
        setState((current) =>
          applyGameActions(current, content, [{ type: "closeItemInfo" }]),
        );
      },
      setSelectedInventoryItem: (itemId: string | null) => {
        setState((current) => ({
          ...current,
          selectedInventoryItemId: itemId,
        }));
      },
      setScene: (sceneId: SceneId) => {
        setState((current) =>
          applyGameActions(current, content, [{ type: "setScene", sceneId }]),
        );
      },
      getInteractable: (interactableId: string) =>
        getInteractableById(content, interactableId),
      getAvailableInteractableActions: (interactableId: string) =>
        getAvailableInteractableActions(state, content, interactableId),
      runInteractableAction: (interactableId: string, actionId: string) => {
        setState((current) => runInteractableAction(current, content, interactableId, actionId));
      },
      openDialogue: (dialogueId: string) => {
        setState((current) => openDialogue(current, content, dialogueId));
      },
      clearDialogue: () => {
        setState((current) => ({
          ...current,
          activeDialogue: null,
        }));
      },
    }),
    [content, state],
  );
}
