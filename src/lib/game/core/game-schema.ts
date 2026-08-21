export type GameFlagValue = boolean | number | string;
import type { SceneId } from "./game-state";

export type GameCondition =
  | {
      type: "hasItem";
      itemId: string;
    }
  | {
      type: "missingItem";
      itemId: string;
    }
  | {
      type: "flagEquals";
      flag: string;
      value: GameFlagValue;
    }
  | {
      type: "flagNotEquals";
      flag: string;
      value: GameFlagValue;
    };

export type GameDialogueChoice = {
  id: string;
  label: string;
  nextNodeId?: string;
  actions?: GameAction[];
  conditions?: GameCondition[];
};

export type GameDialogueNode = {
  id: string;
  text: string;
  conditions?: GameCondition[];
  choices?: GameDialogueChoice[];
};

export type GameDialogueDefinition = {
  id: string;
  entryNodeId: string;
  nodes: GameDialogueNode[];
};

export type GameAction =
  | {
      type: "setScene";
      sceneId: SceneId;
    }
  | {
      type: "addInventoryItem";
      itemId: string;
    }
  | {
      type: "removeInventoryItem";
      itemId: string;
    }
  | {
      type: "setFlag";
      flag: string;
      value: GameFlagValue;
    }
  | {
      type: "showDialogueText";
      text: string;
    }
  | {
      type: "openItemInfo";
      itemId: string;
    }
  | {
      type: "closeItemInfo";
    }
  | {
      type: "openInventory";
    }
  | {
      type: "closeInventory";
    }
  | {
      type: "hideSceneObject";
      objectId: string;
    }
  | {
      type: "showSceneObject";
      objectId: string;
    };

export type GameInteractableActionDefinition = {
  id: string;
  label: string;
  iconKind?: "info" | "collect";
  conditions?: GameCondition[];
  actions: GameAction[];
};

export type GameInteractableDefinition = {
  id: string;
  label: string;
  onInteractText?: string;
  conditions?: GameCondition[];
  acceptedItemIds?: string[];
  actions: GameInteractableActionDefinition[];
};

export type GameInventoryItemDefinition = {
  id: string;
  label: string;
  iconSrc: string;
  title: string;
  description: string;
  previewSrc: string;
  alternatePreviewSrc?: string;
};

export type GameContent = {
  dialogues: GameDialogueDefinition[];
  interactables: GameInteractableDefinition[];
  inventoryItems: GameInventoryItemDefinition[];
};
