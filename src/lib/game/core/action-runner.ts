import {
  buildDialogueView,
  createInitialGameState,
  type GameState,
} from "./game-state";
import { evaluateConditions } from "./condition-evaluator";
import type {
  GameAction,
  GameContent,
  GameDialogueChoice,
  GameInteractableActionDefinition,
} from "./game-schema";

export function applyGameActions(
  state: GameState,
  content: GameContent,
  actions: GameAction[],
) {
  let nextState = state;

  for (const action of actions) {
    nextState = applySingleGameAction(nextState, content, action);
  }

  return nextState;
}

function applySingleGameAction(
  state: GameState,
  content: GameContent,
  action: GameAction,
) {
  switch (action.type) {
    case "setScene":
      return {
        ...state,
        currentSceneId: action.sceneId,
        activeDialogue: null,
        activeItemInfoId: null,
        selectedInventoryItemId: null,
      };
    case "addInventoryItem":
      if (state.inventoryItemIds.includes(action.itemId)) {
        return state;
      }

      return {
        ...state,
        inventoryItemIds: [...state.inventoryItemIds, action.itemId],
      };
    case "removeInventoryItem":
      return {
        ...state,
        inventoryItemIds: state.inventoryItemIds.filter((itemId) => itemId !== action.itemId),
        selectedInventoryItemId:
          state.selectedInventoryItemId === action.itemId
            ? null
            : state.selectedInventoryItemId,
      };
    case "setFlag":
      return {
        ...state,
        flags: {
          ...state.flags,
          [action.flag]: action.value,
        },
      };
    case "showDialogueText":
      return {
        ...state,
        activeDialogue: {
          dialogueId: "inline-dialogue",
          nodeId: "inline-text",
          text: action.text,
          choices: [],
        },
      };
    case "openItemInfo":
      return {
        ...state,
        activeItemInfoId: action.itemId,
        activeDialogue: null,
      };
    case "closeItemInfo":
      return {
        ...state,
        activeItemInfoId: null,
      };
    case "openInventory":
      return {
        ...state,
        isInventoryOpen: true,
      };
    case "closeInventory":
      return {
        ...state,
        isInventoryOpen: false,
      };
    case "hideSceneObject":
      if (state.hiddenSceneObjectIds.includes(action.objectId)) {
        return state;
      }

      return {
        ...state,
        hiddenSceneObjectIds: [...state.hiddenSceneObjectIds, action.objectId],
      };
    case "showSceneObject":
      return {
        ...state,
        hiddenSceneObjectIds: state.hiddenSceneObjectIds.filter(
          (objectId) => objectId !== action.objectId,
        ),
      };
    default:
      return state;
  }
}

export function getAvailableInteractableActions(
  state: GameState,
  content: GameContent,
  interactableId: string,
) {
  const interactable = content.interactables.find((entry) => entry.id === interactableId);

  if (!interactable || !evaluateConditions(state, interactable.conditions)) {
    return [];
  }

  return interactable.actions.filter((action) =>
    evaluateConditions(state, action.conditions),
  );
}

export function getInteractableById(content: GameContent, interactableId: string) {
  return content.interactables.find((entry) => entry.id === interactableId) ?? null;
}

export function runInteractableAction(
  state: GameState,
  content: GameContent,
  interactableId: string,
  actionId: string,
) {
  const action = getAvailableInteractableActions(state, content, interactableId).find(
    (entry) => entry.id === actionId,
  );

  if (!action) {
    return state;
  }

  return applyGameActions(state, content, action.actions);
}

export function openDialogue(
  state: GameState,
  content: GameContent,
  dialogueId: string,
) {
  const dialogue = content.dialogues.find((entry) => entry.id === dialogueId);

  if (!dialogue) {
    return state;
  }

  return {
    ...state,
    activeDialogue: buildDialogueView(dialogue, dialogue.entryNodeId),
  };
}

export function chooseDialogueOption(
  state: GameState,
  content: GameContent,
  choice: GameDialogueChoice,
) {
  let nextState = state;

  if (choice.actions && choice.actions.length > 0) {
    nextState = applyGameActions(nextState, content, choice.actions);
  }

  if (!state.activeDialogue || !choice.nextNodeId) {
    return nextState;
  }

  const dialogue = content.dialogues.find(
    (entry) => entry.id === state.activeDialogue?.dialogueId,
  );

  if (!dialogue) {
    return nextState;
  }

  return {
    ...nextState,
    activeDialogue: buildDialogueView(dialogue, choice.nextNodeId),
  };
}

export function createEmptyGameState() {
  return createInitialGameState();
}
