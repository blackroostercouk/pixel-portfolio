import type {
  FutureCatState,
  FutureCharacterState,
  GroundActorConfig,
  InventoryItemDefinition,
  SceneObjectActionMenuConfig,
  SceneSpriteConfig,
} from "./types";
import { gameContent } from "./content/game-content";

const LAMP_SCALE_COMPENSATION = 0.95 / 0.75;

export const backgroundSprite: SceneSpriteConfig = {
  id: "background",
  assetId: "background",
  x: 960,
  y: 540,
  width: 1920,
  height: 1280,
  anchorX: 0.5,
  anchorY: 0.5,
};

export const environmentSprites: SceneSpriteConfig[] = [
  {
    id: "lamp",
    assetId: "lamp",
    x: 169,
    y: 943,
    width: 120,
    height: 670,
    anchorX: 0.5,
    anchorY: 1,
    scaleX: 1.2666666666666666,
    scaleY: 1.2666666666666666,
  },
  {
    id: "bag",
    assetId: "bag",
    x: 981,
    y: 930,
    width: 91,
    height: 100,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "raincot",
    assetId: "raincot",
    x: 687,
    y: 927,
    width: 77,
    height: 185,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 1,
  },
  {
    id: "bench",
    assetId: "bench",
    x: 842,
    y: 945,
    width: 310,
    height: 203,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "trash",
    assetId: "trash",
    x: 1535,
    y: 924,
    width: 106,
    height: 170,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "trash-active",
    assetId: "trash",
    x: 1535,
    y: 924,
    width: 108,
    height: 171,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "coffee",
    assetId: "coffee",
    x: 823,
    y: 939,
    width: 38,
    height: 50,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
    zIndex: 7,
  },
  {
    id: "sign",
    assetId: "sign",
    x: 1749,
    y: 964,
    width: 134,
    height: 256,
    anchorX: 0.5,
    anchorY: 1,
  },
];

export const sceneTwoEnvironmentSprites: SceneSpriteConfig[] = [
  {
    id: "scene2-center-sign",
    assetId: "knottyCenterSign",
    x: 978,
    y: 990,
    width: 474,
    height: 392,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
    interaction: {
      clickable: true,
      hasInfo: true,
      bubbleMessage: "Knotty ones, I build a custom theme for them....",
    },
  },
  {
    id: "scene2-flower-left",
    assetId: "knottyFlower",
    x: 22,
    y: 979,
    width: 132,
    height: 172,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: -1,
  },
  {
    id: "scene2-flower-mid-left",
    assetId: "knottyFlower2",
    x: 58,
    y: 979,
    width: 88,
    height: 106,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 10,
    interaction: {
      clickable: true,
      hasInfo: true,
      collectible: true,
      bubbleMessage: "Something usefull",
    },
  },
  {
    id: "scene2-flower-mid-right",
    assetId: "knottyFlower3",
    x: 104,
    y: 976,
    width: 90,
    height: 93,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: -2,
  },
  {
    id: "scene2-flower-right",
    assetId: "knottyFlower4",
    x: 1934,
    y: 1009,
    width: 126,
    height: 107,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "scene2-basket-1",
    assetId: "knottyBasket1",
    x: 1382,
    y: 993,
    width: 112,
    height: 102,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 9,
  },
  {
    id: "scene2-basket-2",
    assetId: "knottyBasket2",
    x: 1299,
    y: 999,
    width: 126,
    height: 106,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 8,
  },
  {
    id: "scene2-knitts",
    assetId: "knottyKnitts",
    x: 1450,
    y: 980,
    width: 370,
    height: 305,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: -3,
    interaction: {
      clickable: true,
      hasInfo: true,
      bubbleMessage: "Good collection",
    },
  },
  {
    id: "scene2-lamp",
    assetId: "knottyLamp",
    x: 982,
    y: 622,
    width: 108,
    height: 94,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
  },
  {
    id: "scene2-character",
    assetId: "scene2Character",
    x: 1840,
    y: 1071,
    width: 136,
    height: 354,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
  },
  {
    id: "scene2-paint",
    assetId: "knottyPaint",
    x: -170,
    y: -2,
    width: 23,
    height: 43,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "scene2-stone-right",
    assetId: "knottyStone",
    x: 981,
    y: 955,
    width: 257,
    height: 127,
    anchorX: 0.5,
    anchorY: 1,
    scaleX: -1,
  },
];

export const sceneThreeEnvironmentSprites: SceneSpriteConfig[] = [
  {
    id: "scene3-house",
    assetId: "shopifyHouse",
    x: 1369,
    y: 1032,
    width: 818,
    height: 778,
    anchorX: 0.5,
    anchorY: 1,
  },
  {
    id: "scene3-character",
    assetId: "scene2Character",
    x: 420,
    y: 1074,
    width: 136,
    height: 354,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
  },
  {
    id: "scene3-cat",
    assetId: "cat",
    x: 1747,
    y: 1005,
    width: 99,
    height: 68,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
  },
  {
    id: "scene3-umbrella",
    assetId: "shopifyUmbrella",
    x: 1851,
    y: 1036,
    width: 472,
    height: 492,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 4,
  },
  {
    id: "scene3-boxes",
    assetId: "shopifyBoxes",
    x: -7,
    y: 1009,
    width: 184,
    height: 178,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 3,
  },
  {
    id: "scene3-flower-basket",
    assetId: "shopifyFlowerBasket",
    x: 2025,
    y: 1025,
    width: 144,
    height: 136,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 5,
  },
];

export const sceneFourEnvironmentSprites: SceneSpriteConfig[] = [
  {
    id: "scene4-character",
    assetId: "scene2Character",
    x: 772,
    y: 1072,
    width: 136,
    height: 354,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
    zIndex: 2,
  },
  {
    id: "scene4-cube-1",
    assetId: "webflowCube1",
    x: -33,
    y: 974,
    width: 51,
    height: 52,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 8,
  },
  {
    id: "scene4-cube-2",
    assetId: "webflowCube2",
    x: 852,
    y: 930,
    width: 49,
    height: 48,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 5,
  },
  {
    id: "scene4-cat",
    assetId: "cat",
    x: 1155,
    y: 941,
    width: 99,
    height: 68,
    anchorX: 0.5,
    anchorY: 1,
    layer: "actorLayer",
    zIndex: 1,
  },
  {
    id: "scene4-first-prop",
    assetId: "webflowFirstProp",
    x: 1510,
    y: 1001,
    width: 389,
    height: 317,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 2,
  },
  {
    id: "scene4-sign-prop",
    assetId: "webflowSignProp",
    x: 1158,
    y: 968,
    width: 615,
    height: 389,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 1,
  },
  {
    id: "scene4-direction-prop",
    assetId: "webflowDirection",
    x: 52,
    y: 979,
    width: 171,
    height: 284,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: 2,
  },
  {
    id: "scene4-stone-decor-mashroom",
    assetId: "webflowStoneDecorMashroom",
    x: -105,
    y: 996,
    width: 220,
    height: 197,
    anchorX: 0.5,
    anchorY: 1,
    zIndex: -4,
  },
];

export const characterSprite: GroundActorConfig<FutureCharacterState> = {
  id: "character",
  kind: "groundActor",
  assetId: "character",
  x: 900,
  y: 932,
  width: 178,
  height: 296,
  anchorX: 0.5,
  anchorY: 1,
  initialState: "idle",
  futureStates: ["idle", "closeLaptop", "standUp", "walk", "exit"],
};

export const catSprite: GroundActorConfig<FutureCatState> = {
  id: "cat",
  kind: "groundActor",
  assetId: "cat",
  x: 1125,
  y: 947,
  width: 110,
  height: 76,
  anchorX: 0.5,
  anchorY: 1,
  initialState: "idle",
  futureStates: ["idle", "wake", "stand", "follow"],
};

export const effectSprites: SceneSpriteConfig[] = [
  {
    id: "logo",
    assetId: "logo",
    x: 960,
    y: 346,
    width: 663,
    height: 351,
    anchorX: 0.5,
    anchorY: 0.5,
    ignoreSceneScale: true,
    zIndex: 80,
  },
];

const environmentSpriteById = new Map(environmentSprites.map((sprite) => [sprite.id, sprite]));
const objectActionMenuOffsets = {
  coffee: {
    originX: -31,
    originY: -23,
    infoTargetX: -55,
    collectTargetX: -5,
    targetY: -91,
  },
  bag: {
    originX: 17,
    originY: -10,
    infoTargetX: -9,
    collectTargetX: 41,
    targetY: -76,
  },
} as const;

export const objectActionMenus: SceneObjectActionMenuConfig[] = gameContent.interactables
  .filter((entry) => entry.actions.some((action) => action.iconKind))
  .map((entry) => ({
    objectId: entry.id,
    originX:
      (environmentSpriteById.get(entry.id)?.x ?? 0) +
      (entry.id === "coffee"
        ? objectActionMenuOffsets.coffee.originX
        : entry.id === "bag"
          ? objectActionMenuOffsets.bag.originX
          : 0),
    originY:
      (environmentSpriteById.get(entry.id)?.y ?? 0) +
      (entry.id === "coffee"
        ? objectActionMenuOffsets.coffee.originY
        : entry.id === "bag"
          ? objectActionMenuOffsets.bag.originY
          : 0),
    onInteractMessage: entry.onInteractText,
    actions: entry.actions
      .filter((action) => action.iconKind)
      .map((action) => ({
        id: action.id,
        kind: action.iconKind ?? "info",
        targetX:
          action.id === "coffee-info"
            ? (environmentSpriteById.get(entry.id)?.x ?? 0) + objectActionMenuOffsets.coffee.infoTargetX
            : action.id === "coffee-collect"
              ? (environmentSpriteById.get(entry.id)?.x ?? 0) +
                objectActionMenuOffsets.coffee.collectTargetX
              : action.id === "bag-info"
                ? (environmentSpriteById.get(entry.id)?.x ?? 0) + objectActionMenuOffsets.bag.infoTargetX
                : (environmentSpriteById.get(entry.id)?.x ?? 0) +
                  objectActionMenuOffsets.bag.collectTargetX,
        targetY:
          (environmentSpriteById.get(entry.id)?.y ?? 0) +
          (entry.id === "bag" ? objectActionMenuOffsets.bag.targetY : objectActionMenuOffsets.coffee.targetY),
        width: 56,
        height: 60,
        message:
          action.actions.find((item) => item.type === "showDialogueText" && "text" in item)?.text ??
          "",
        inventoryItemId:
          action.actions.find((item) => item.type === "addInventoryItem" && "itemId" in item)?.itemId,
        consumeObjectOnUse: action.actions.some(
          (item) => item.type === "hideSceneObject" && "objectId" in item && item.objectId === entry.id,
        ),
      })),
  }));

export const interactiveObjectIds = new Set(gameContent.interactables.map((entry) => entry.id));

export const interactiveObjectMessages = new Map(
  gameContent.interactables.map((entry) => [entry.id, entry.onInteractText ?? null]),
);

export const inventoryItems: InventoryItemDefinition[] = gameContent.inventoryItems;
