import type { AssetsManifest } from "pixi.js";

const characterIdleAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(4, "0");

  return {
    alias: `character-idle-${frameNumber}`,
    src: `/assets/scene/character-idle/frame_${frameNumber}.webp`,
  };
});

const catIdleAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `cat-idle-${frameNumber}`,
    src: `/assets/scene/cat-idle/frame_${frameNumber}.webp`,
  };
});

const characterCloseLaptopAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `character-close-laptop-${frameNumber}`,
    src: `/assets/scene/character-close-laptop/frame_${frameNumber}.webp`,
  };
});

const lampIdleAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `lamp-idle-${frameNumber}`,
    src: `/assets/scene/lamp-idle/frame_${frameNumber}.webp`,
  };
});

const trashMouseIdleAssets = Array.from({ length: 14 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `trash-mouse-idle-${frameNumber}`,
    src: `/assets/scene/trash-mouse-idle/frame_${frameNumber}.webp`,
  };
});

const ufoAssets = Array.from({ length: 21 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `ufo-${frameNumber}`,
    src: `/assets/scene/ufo/frame_${frameNumber}.webp`,
  };
});

const sceneTwoCharacterAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `scene2-character-${frameNumber}`,
    src: `/assets/scene/scene2-character/frame_${frameNumber}.webp`,
  };
});

const sceneTwoCharacterWalkAssets = Array.from({ length: 34 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `scene2-character-walk-${frameNumber}`,
    src: `/assets/scene/scene2-character-walk/frame_${frameNumber}.webp`,
  };
});

const windTurbineAssets = Array.from({ length: 36 }, (_, index) => {
  const frameNumber = index.toString().padStart(3, "0");

  return {
    alias: `wind-turbine-${frameNumber}`,
    src: `/assets/scene/wind-turbine/frame_${frameNumber}.webp`,
  };
});

export const sceneAssetsManifest: AssetsManifest = {
  bundles: [
    {
      name: "scene",
      assets: [
        { alias: "background", src: "/assets/scene/background_moon.webp" },
        { alias: "backgroundScene2", src: "/assets/scene/scene_second.webp" },
        { alias: "backgroundScene3", src: "/assets/scene/shopify/shopify_bg.webp" },
        { alias: "backgroundScene4", src: "/assets/scene/webflow/webflow_bg.webp" },
        { alias: "lamp", src: "/assets/scene/lamba.webp" },
        { alias: "bench", src: "/assets/scene/bank.webp" },
        { alias: "bag", src: "/assets/scene/bag.webp" },
        { alias: "raincot", src: "/assets/scene/raincot.webp" },
        { alias: "knottyAds", src: "/assets/scene/knottyones/ads.webp" },
        { alias: "knottyBasket1", src: "/assets/scene/knottyones/basket_1.webp" },
        { alias: "knottyBasket2", src: "/assets/scene/knottyones/basket_2.webp" },
        { alias: "knottyCenterSign", src: "/assets/scene/knottyones/center_sign.webp" },
        { alias: "knottyChair", src: "/assets/scene/knottyones/chair.webp" },
        { alias: "knottyEmptyBasket", src: "/assets/scene/knottyones/empty_basket.webp" },
        { alias: "knottyFlower", src: "/assets/scene/knottyones/flower.webp" },
        { alias: "knottyFlower2", src: "/assets/scene/knottyones/flower_2.webp" },
        { alias: "knottyFlower3", src: "/assets/scene/knottyones/flower_3.webp" },
        { alias: "knottyFlower4", src: "/assets/scene/knottyones/flower_4.webp" },
        { alias: "knottyGift", src: "/assets/scene/knottyones/gift.webp" },
        { alias: "knottyGimmick", src: "/assets/scene/knottyones/gimmick.webp" },
        { alias: "knottyKnitts", src: "/assets/scene/knottyones/knitts.webp" },
        { alias: "knottyLeadder", src: "/assets/scene/knottyones/leadder.webp" },
        { alias: "knottyLamp", src: "/assets/scene/knottyones/lamp.webp" },
        { alias: "knottyModel", src: "/assets/scene/knottyones/model.webp" },
        { alias: "knottyPaint", src: "/assets/scene/knottyones/paint.webp" },
        { alias: "scene2Character", src: "/assets/scene/scene2-character/frame_000.webp" },
        { alias: "knottyShopSign", src: "/assets/scene/knottyones/shop_sign.webp" },
        { alias: "knottyStone", src: "/assets/scene/knottyones/stone.webp" },
        { alias: "knottyTable", src: "/assets/scene/knottyones/table.webp" },
        { alias: "knottyWhole", src: "/assets/scene/knottyones/whole.webp" },
        { alias: "shopifyHouse", src: "/assets/scene/shopify/shopify_house.webp" },
        { alias: "shopifyBoxes", src: "/assets/scene/shopify/kutular.webp" },
        { alias: "shopifyFlowerBasket", src: "/assets/scene/shopify/cicek_sepeti.webp" },
        { alias: "shopifyUmbrella", src: "/assets/scene/shopify/shopify_umbrella.webp" },
        { alias: "webflowMainPart", src: "/assets/scene/webflow/main_part.webp" },
        { alias: "webflowCube1", src: "/assets/scene/webflow/cube_1.webp" },
        { alias: "webflowCube2", src: "/assets/scene/webflow/cube_2.webp" },
        { alias: "webflowDecor1", src: "/assets/scene/webflow/decor_1.webp" },
        { alias: "webflowDecor2", src: "/assets/scene/webflow/decor_2.webp" },
        { alias: "webflowDecor3", src: "/assets/scene/webflow/decor_3.webp" },
        { alias: "webflowDetailBar", src: "/assets/scene/webflow/detail_bar.webp" },
        { alias: "webflowGrass", src: "/assets/scene/webflow/grass.webp" },
        { alias: "webflowHerb", src: "/assets/scene/webflow/herb.webp" },
        { alias: "webflowMaskot", src: "/assets/scene/webflow/maskot.webp" },
        { alias: "webflowSandik", src: "/assets/scene/webflow/sandik.webp" },
        { alias: "webflowSign", src: "/assets/scene/webflow/sign.webp" },
        { alias: "webflowStoneDecor1", src: "/assets/scene/webflow/stone_decor_1.webp" },
        { alias: "webflowStoneDecor5", src: "/assets/scene/webflow/stone_decor_5.webp" },
        { alias: "webflowStoneDecorMashroom", src: "/assets/scene/webflow/stone_decor_mashroom.webp" },
        { alias: "webflowStoneDecorMini", src: "/assets/scene/webflow/stone_decor_mini.webp" },
        { alias: "webflowStoneGate", src: "/assets/scene/webflow/stone_gate.webp" },
        { alias: "webflowStoneLedder1", src: "/assets/scene/webflow/stone_ledder_1.webp" },
        { alias: "webflowStoneMini2", src: "/assets/scene/webflow/stone_mini_2.webp" },
        { alias: "webflowTable", src: "/assets/scene/webflow/table.webp" },
        { alias: "webflowFirstProp", src: "/assets/scene/webflow/webflow_first_prop.webp" },
        { alias: "webflowSignProp", src: "/assets/scene/webflow/webflow_sign_prop.webp" },
        { alias: "webflowDirection", src: "/assets/scene/webflow/webflow_direction.webp" },
        { alias: "trash", src: "/assets/scene/cop.webp" },
        { alias: "coffee", src: "/assets/scene/kahve.webp" },
        { alias: "sign", src: "/assets/scene/tabela.webp" },
        { alias: "ufo", src: "/assets/scene/ufo/frame_010.webp" },
        { alias: "windTurbine", src: "/assets/scene/wind-turbine/frame_000.webp" },
        { alias: "logo", src: "/assets/logo.webp" },
        { alias: "bubble", src: "/assets/scene/bubble_an.webp" },
        { alias: "bubbleMouse", src: "/assets/scene/bubble_mouse.webp" },
        { alias: "infoIcon", src: "/assets/scene/info_icon.webp" },
        { alias: "collectIcon", src: "/assets/scene/collect_icon.webp" },
        { alias: "character", src: "/assets/scene/karakter.webp" },
        { alias: "cat", src: "/assets/scene/kedi.webp" },
        ...characterIdleAssets,
        ...characterCloseLaptopAssets,
        ...catIdleAssets,
        ...lampIdleAssets,
        ...trashMouseIdleAssets,
        ...sceneTwoCharacterAssets,
        ...sceneTwoCharacterWalkAssets,
        ...ufoAssets,
        ...windTurbineAssets,
      ],
    },
  ],
};
