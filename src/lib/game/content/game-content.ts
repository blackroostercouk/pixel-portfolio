import type { GameContent } from "../core/game-schema";

export const gameContent: GameContent = {
  inventoryItems: [
    {
      id: "coffee",
      label: "Coffee",
      iconSrc: "/assets/scene/kahve.webp",
      title: "Fresh Coffee",
      description:
        "A warm cup of coffee left beside the bench. It looks fresh enough to be useful, and definitely too good to leave behind.",
      previewSrc: "/assets/scene/mug.webp",
      alternatePreviewSrc: "/assets/scene/mug_back.webp",
    },
    {
      id: "bag",
      label: "Bag",
      iconSrc: "/assets/scene/bag.webp",
      title: "Canvas Bag",
      description:
        "A sturdy little bag tucked behind the bench. It looks useful enough to carry something important later.",
      previewSrc: "/assets/scene/bag.webp",
    },
  ],
  interactables: [
    {
      id: "lamp",
      label: "lamp",
      onInteractText: "The lamp gives the whole scene its warmth.",
      actions: [],
    },
    {
      id: "trash",
      label: "trash bin",
      onInteractText: "That trash bin looks like it might be useful later.",
      acceptedItemIds: ["coffee"],
      actions: [
        {
          id: "trash-dispose-coffee",
          label: "Dispose coffee",
          conditions: [
            {
              type: "hasItem",
              itemId: "coffee",
            },
          ],
          actions: [
            {
              type: "removeInventoryItem",
              itemId: "coffee",
            },
            {
              type: "setFlag",
              flag: "trash_mouse_awake",
              value: true,
            },
            {
              type: "showDialogueText",
              text: "Let's be environmentally responsible and dispose of this properly.",
            },
          ],
        },
      ],
    },
    {
      id: "coffee",
      label: "coffee",
      onInteractText: "That coffee might come in handy.",
      actions: [
        {
          id: "coffee-info",
          label: "Inspect",
          iconKind: "info",
          actions: [
            {
              type: "openItemInfo",
              itemId: "coffee",
            },
          ],
        },
        {
          id: "coffee-collect",
          label: "Collect",
          iconKind: "collect",
          conditions: [
            {
              type: "missingItem",
              itemId: "coffee",
            },
          ],
          actions: [
            {
              type: "addInventoryItem",
              itemId: "coffee",
            },
            {
              type: "hideSceneObject",
              objectId: "coffee",
            },
            {
              type: "openInventory",
            },
            {
              type: "setFlag",
              flag: "coffee_collected",
              value: true,
            },
            {
              type: "showDialogueText",
              text: "Coffee added to your inventory.",
            },
          ],
        },
      ],
    },
    {
      id: "bag",
      label: "bag",
      onInteractText: "That bag looks like it could be useful later.",
      actions: [],
    },
    {
      id: "logo",
      label: "logo",
      onInteractText: "That's my logo.",
      actions: [],
    },
    {
      id: "sign",
      label: "sign",
      onInteractText: "You'll need to solve the puzzle before moving on to the next stage.",
      actions: [],
    },
  ],
  dialogues: [
    {
      id: "sign-gate",
      entryNodeId: "start",
      nodes: [
        {
          id: "start",
          text: "You'll need to solve the puzzle before moving on to the next stage.",
          choices: [
            {
              id: "stay",
              label: "Stay here",
            },
            {
              id: "question",
              label: "What should I do?",
              nextNodeId: "hint",
            },
          ],
        },
        {
          id: "hint",
          text: "Try inspecting the objects around you. Some of them can be collected or used.",
          choices: [
            {
              id: "back",
              label: "Got it",
            },
          ],
        },
      ],
    },
  ],
};
