import type {
  GameDialogueChoice,
  GameDialogueDefinition,
  GameFlagValue,
} from "./game-schema";

export type GameDialogueView = {
  dialogueId: string;
  nodeId: string;
  text: string;
  choices: GameDialogueChoice[];
} | null;

export type SceneId = "scene-builder";

export type DynamicInventoryItem = {
  id: string;
  label: string;
  iconSrc: string;
  targetObjectId?: string;
  targetAction?: "openModal" | "giveCollectible";
  targetCollectibleSrc?: string;
  targetCollectibleLabel?: string;
  consumeOnUse?: boolean;
};

export type GameState = {
  currentSceneId: SceneId;
  inventoryItemIds: string[];
  dynamicInventoryItems: DynamicInventoryItem[];
  selectedInventoryItemId: string | null;
  flags: Record<string, GameFlagValue>;
  hiddenSceneObjectIds: string[];
  isInventoryOpen: boolean;
  activeItemInfoId: string | null;
  activeDialogue: GameDialogueView;
};

export function createInitialGameState(): GameState {
  return {
    currentSceneId: "scene-builder",
    inventoryItemIds: [],
    dynamicInventoryItems: [],
    selectedInventoryItemId: null,
    flags: {},
    hiddenSceneObjectIds: [],
    isInventoryOpen: false,
    activeItemInfoId: null,
    activeDialogue: null,
  };
}

export function buildDialogueView(
  dialogue: GameDialogueDefinition,
  nodeId: string,
): GameDialogueView {
  const node = dialogue.nodes.find((entry) => entry.id === nodeId);

  if (!node) {
    return null;
  }

  return {
    dialogueId: dialogue.id,
    nodeId: node.id,
    text: node.text,
    choices: node.choices ?? [],
  };
}
