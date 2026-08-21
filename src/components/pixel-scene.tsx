"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Directions, Expand, Grid3x3 } from "pixelarticons/react";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/react";
import { PixelSceneController } from "@/lib/game/pixel-scene-controller";
import { useGameSession } from "@/lib/game/hooks/use-game-session";
import { useRainAudio } from "@/lib/game/hooks/use-rain-audio";
import { useAvatarDrawer } from "@/lib/game/hooks/use-avatar-drawer";
import { useCursorFollow } from "@/lib/game/hooks/use-cursor-follow";
import { useInventoryAnimations } from "@/lib/game/hooks/use-inventory-animations";
import { useInfoModal } from "@/lib/game/hooks/use-info-modal";
import { useSceneLayoutEditor } from "@/lib/game/hooks/use-scene-layout-editor";
import { LayoutPanel } from "@/components/game-ui/layout-panel";
import { LayoutInfoModal } from "@/components/game-ui/layout-info-modal";
import { InfoEditor } from "@/components/game-ui/info-editor";
import { DrawerEditor } from "@/components/game-ui/drawer-editor";
import { CollectEditor } from "@/components/game-ui/collect-editor";
import { useAuth } from "@/lib/auth/use-auth";
import { ItemInfoModal } from "@/components/game-ui/item-info-modal";
import { SceneMapOverlay } from "@/components/game-ui/scene-map-overlay";
import { sceneRegistry } from "@/lib/game/scene-registry";
import {
  BUILDER_SCENE_SELECT_PREFIX,
  INTERACTION_TARGET_LABELS,
  PLAYFUL_ITEM_USE_MESSAGES,
} from "@/lib/game/builder-constants";
import { pickRotatingMessage } from "@/lib/game/layout-utils";
import type {
  SceneInfoModalConfig,
  SceneDrawerConfig,
  SceneInfoModalStageId,
} from "@/lib/game/types";
import type { SceneId } from "@/lib/game/core/game-state";

export function PixelScene() {
  const game = useGameSession();
  const shellRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PixelSceneController | null>(null);
  const gameRef = useRef(game);
  const selectedInventoryItemIdRef = useRef<string | null>(null);
  const playfulInteractionRotationRef = useRef<Record<string, number>>({});

  gameRef.current = game;

  const auth = useAuth();

  const [isReady, setIsReady] = useState(false);
  const [isRainEnabled, setIsRainEnabled] = useState(true);
  const [isLightingEnabled, setIsLightingEnabled] = useState(true);
  const [isLayoutModeEnabled, setIsLayoutModeEnabled] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isInfoEditorOpen, setIsInfoEditorOpen] = useState(false);
  const [isDrawerEditorOpen, setIsDrawerEditorOpen] = useState(false);
  const [isCollectEditorOpen, setIsCollectEditorOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedInfoEditorStage, setSelectedInfoEditorStage] =
    useState<SceneInfoModalStageId>("normal");
  const [layoutInfoImageOptions, setLayoutInfoImageOptions] = useState<string[]>([]);
  const [isUploadingInfoImage, setIsUploadingInfoImage] = useState(false);
  const [isUploadingCollectIcon, setIsUploadingCollectIcon] = useState(false);

  const currentScene = sceneRegistry[game.state.currentSceneId];
  const activeItemInfo =
    game.content.inventoryItems.find((item) => item.id === game.state.activeItemInfoId) ?? null;
  const selectedInventoryItem =
    game.inventoryItems.find((item) => item.id === game.state.selectedInventoryItemId) ?? null;

  selectedInventoryItemIdRef.current = selectedInventoryItem?.id ?? null;

  useRainAudio(isRainEnabled);
  const avatarDrawer = useAvatarDrawer();
  const cursorFollow = useCursorFollow(!!selectedInventoryItem);
  const { registerInventoryItemRef } = useInventoryAnimations(game.inventoryItems);
  const infoModal = useInfoModal();
  const layout = useSceneLayoutEditor(currentScene.id, controllerRef);

  // ─── Derived selected sprite ──────────────────────────────────────────────

  const selectedLayoutSprite =
    layout.effectiveLayoutSprites.find((s) => s.id === layout.selectedLayoutSpriteId) ??
    layout.layoutSpritesWithSmoke.find((s) => s.id === layout.selectedLayoutSpriteId) ??
    null;
  const isSmokeSelected = layout.selectedLayoutSpriteId === "scene3-smoke";
  const selectedLayoutSpriteLive =
    layout.selectedLayoutSpriteId && !isSmokeSelected
      ? (controllerRef.current?.getSelectedLayoutSpriteSnapshot() ?? selectedLayoutSprite)
      : selectedLayoutSprite;
  const selectedLayoutSpriteLiveInteraction =
    selectedLayoutSpriteLive && "interaction" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.interaction
      : undefined;
  const selectedLayoutSpriteInteraction =
    layout.selectedLayoutSpriteId && !isSmokeSelected
      ? (controllerRef.current?.getSelectedLayoutSpriteInteraction() ??
          selectedLayoutSpriteLiveInteraction ??
          null)
      : null;
  const selectedLayoutSpriteRainSplash =
    selectedLayoutSpriteLive && "rainSplash" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.rainSplash
      : undefined;
  const selectedLayoutSpriteRainSplashSegments =
    selectedLayoutSpriteLive && "rainSplashSegments" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.rainSplashSegments
      : undefined;
  const selectedLayoutSpriteVisuals =
    selectedLayoutSpriteLive && "visuals" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.visuals
      : undefined;
  const selectedLayoutSpriteLight =
    selectedLayoutSpriteLive && "light" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.light
      : undefined;
  const selectedLayoutSpriteParticles =
    selectedLayoutSpriteLive && "particles" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.particles
      : undefined;
  const selectedLayoutSpriteRuntimeType =
    selectedLayoutSpriteLive && "runtimeType" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.runtimeType
      : undefined;
  const selectedLayoutSpriteAlpha =
    selectedLayoutSpriteLive && "alpha" in selectedLayoutSpriteLive
      ? selectedLayoutSpriteLive.alpha
      : undefined;
  const isLightSelected = selectedLayoutSpriteRuntimeType === "light";
  const selectedLayoutSpriteWidth = Math.max(1, Math.abs(selectedLayoutSpriteLive?.width ?? 0));
  const effectiveRainSplashSegments = selectedLayoutSpriteRainSplashSegments?.length
    ? selectedLayoutSpriteRainSplashSegments
    : selectedLayoutSpriteRainSplash
      ? [selectedLayoutSpriteRainSplash]
      : [];
  const activeRainSplashSegment =
    effectiveRainSplashSegments[layout.selectedRainSplashSegmentIndex] ??
    effectiveRainSplashSegments[0];
  const activeRainSplashWidthPercent = Math.round((activeRainSplashSegment?.widthRatio ?? 1) * 100);
  const activeRainSplashMinWidthPercent = Math.round(
    (activeRainSplashSegment?.minWidthRatio ??
      (activeRainSplashSegment?.minWidth ?? 10) / selectedLayoutSpriteWidth) *
      100,
  );
  const activeRainSplashMaxWidthPercent = Math.round(
    (activeRainSplashSegment?.maxWidthRatio ??
      (activeRainSplashSegment?.maxWidth ?? 22) / selectedLayoutSpriteWidth) *
      100,
  );

  const selectedLayoutInfoModal =
    (selectedLayoutSpriteLiveInteraction?.infoModal as SceneInfoModalConfig | undefined) ?? {};
  const selectedInfoEditorStageConfig = selectedLayoutInfoModal[selectedInfoEditorStage] ?? {};
  const selectedLayoutDrawer =
    (selectedLayoutSpriteLiveInteraction?.drawer as SceneDrawerConfig | undefined) ?? {};
  const activeLayoutDrawer =
    (infoModal.activeLayoutInfoModal?.interaction.drawer as SceneDrawerConfig | undefined) ??
    undefined;

  const selectedSceneOptionValue =
    currentScene.id === "scene-builder"
      ? `${BUILDER_SCENE_SELECT_PREFIX}${layout.activeBuilderSceneId}`
      : currentScene.id;
  const cursorLabel = selectedInventoryItem
    ? cursorFollow.isHoveringInteractiveObject
      ? "Use"
      : selectedInventoryItem.label
    : null;

  const updateSelectedDrawerConfig = (patch: Partial<SceneDrawerConfig>) => {
    const currentDrawer =
      (controllerRef.current?.getSelectedLayoutSpriteSnapshot()?.interaction?.drawer as
        | SceneDrawerConfig
        | undefined) ?? selectedLayoutDrawer;
    const nextDrawer = { ...currentDrawer, ...patch };
    controllerRef.current?.updateSelectedLayoutSpriteInteraction({
      drawer: Object.values(nextDrawer).some((v) => v !== undefined && v !== "")
        ? nextDrawer
        : undefined,
    });
  };

  // ─── Tiptap drawer editor ─────────────────────────────────────────────────

  const drawerEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
    ],
    content: selectedLayoutDrawer.bodyHtml ?? "",
    editable: isDrawerEditorOpen,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      updateSelectedDrawerConfig({
        bodyHtml:
          html === "<p></p>" || html.replace(/<[^>]*>/g, "").trim() === "" ? undefined : html,
      });
    },
  });

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsReady(false);

    const host = hostRef.current;
    if (!host) return;

    let isMounted = true;
    const activeBuilderScene = layout.activeBuilderScene;
    const activeSceneOverride = layout.sceneOverrides[currentScene.id as SceneId];

    const controller = new PixelSceneController({
      sceneId: currentScene.id,
      runtimeSceneBackgroundSrc:
        currentScene.id === "scene-builder"
          ? (activeBuilderScene?.backgroundSrc ?? null)
          : (activeSceneOverride?.backgroundSrc ?? null),
      runtimeSceneSprites:
        currentScene.id === "scene-builder"
          ? (activeBuilderScene?.sprites.map((s) => ({ ...s, layer: s.layer ?? "environmentLayer" })) ?? [])
          : activeSceneOverride?.sprites?.map((s) => ({ ...s, layer: s.layer ?? "environmentLayer" })),
      onActionMenuAction: (objectId, actionId) => {
        if (actionId.endsWith("-generic-collect")) {
          const snapshot =
            layout.latestLayoutSpritesRef.current.find((s) => s.id === objectId) ??
            controllerRef.current?.getLayoutSpriteSnapshotById(objectId);
          const label = snapshot?.interaction?.collectLabel || snapshot?.interaction?.infoTitle || objectId;
          const iconSrc = snapshot?.interaction?.collectIconSrc || snapshot?.src || "";
          game.addDynamicInventoryItem({ id: objectId, label, iconSrc });
          controllerRef.current?.consumeLayoutSprite(objectId);
          return;
        }

        if (actionId.endsWith("-generic-info")) {
          const snapshot =
            layout.latestLayoutSpritesRef.current.find((s) => s.id === objectId) ??
            controllerRef.current?.getLayoutSpriteSnapshotById(objectId);
          const interaction = snapshot?.interaction;

          if (interaction) {
            if (interaction.hasDrawer && !interaction.hasInfo) {
              avatarDrawer.setIsAvatarDrawerOpen(true);
              infoModal.setActiveLayoutInfoModal({ spriteId: objectId, interaction });
              return;
            }
            const preferredStage =
              infoModal.resolvedLayoutInfoModalStagesRef.current[objectId] ?? "normal";
            infoModal.setActiveLayoutInfoModal({ spriteId: objectId, interaction });
            infoModal.setActiveLayoutInfoModalStage(preferredStage);
            infoModal.setActiveLayoutInfoModalFlipped(false);
            infoModal.setActiveLayoutInfoInputValue("");
            return;
          }
        }
        gameRef.current.runInteractableAction(objectId, actionId);
      },
      onInteractiveHoverChange: (isHovering) => {
        cursorFollow.setIsHoveringInteractiveObject(isHovering);
      },
      onLayoutStateChange: layout.onLayoutStateChange,
      getInteractionOverrideMessage: (objectId) => {
        const selectedItemId = selectedInventoryItemIdRef.current;
        if (!selectedItemId) return null;

        const interactable = gameRef.current.getInteractable(objectId);
        const targetLabel =
          interactable?.label ?? INTERACTION_TARGET_LABELS[objectId] ?? objectId;

        if (interactable?.acceptedItemIds?.includes(selectedItemId)) return null;

        const selectedItem = gameRef.current.content.inventoryItems.find(
          (i) => i.id === selectedItemId,
        );
        const playfulMessages = PLAYFUL_ITEM_USE_MESSAGES[selectedItemId];
        if (!selectedItem || !playfulMessages) return null;

        const targetMessages = playfulMessages.targets?.[objectId];
        const fallbackMessages = playfulMessages.default.map(
          (msg) =>
            `${msg} ${selectedItem.label} and ${targetLabel} are not the right combo just yet.`,
        );

        return pickRotatingMessage(
          targetMessages?.length ? targetMessages : fallbackMessages,
          `${selectedItemId}:${objectId}`,
          playfulInteractionRotationRef,
        );
      },
      getDefaultObjectActionId: (objectId) => {
        const actions = gameRef.current.getAvailableInteractableActions(objectId);
        return actions.find((a) => !a.iconKind)?.id ?? null;
      },
    });

    controllerRef.current = controller;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) controller.resize(entry.contentRect.width, entry.contentRect.height);
    });

    const mountScene = async () => {
      await controller.mount(host);
      controller.syncSceneState(gameRef.current.state);
      controller.setRainEnabled(isRainEnabled);
      controller.setLightingEnabled(isLightingEnabled);
      controller.setLayoutMode(isLayoutModeEnabled);
      host.focus();
      if (isMounted) {
        setIsReady(true);
      }
    };

    void mountScene();
    resizeObserver.observe(host);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentScene.id,
    layout.activeBuilderScene?.backgroundSrc,
    layout.activeBuilderSceneId,
    layout.builderSceneRenderVersion,
    layout.sceneOverrideRenderVersion,
  ]);

  useEffect(() => {
    controllerRef.current?.syncSceneState(game.state);
  }, [game.state]);

  useEffect(() => {
    controllerRef.current?.setRainEnabled(isRainEnabled);
  }, [isRainEnabled]);

  useEffect(() => {
    controllerRef.current?.setLightingEnabled(isLightingEnabled);
  }, [isLightingEnabled]);

  useEffect(() => {
    controllerRef.current?.setLayoutMode(isLayoutModeEnabled);
  }, [isLayoutModeEnabled]);

  useEffect(() => {
    controllerRef.current?.setSelectedLayoutSprite(layout.selectedLayoutSpriteId);
  }, [layout.selectedLayoutSpriteId]);

  useEffect(() => {
    const pressed = new Set<string>();
    const syncDirection = () => {
      const ctrl = controllerRef.current;
      if (!ctrl) return;
      const left = pressed.has("ArrowLeft");
      const right = pressed.has("ArrowRight");
      ctrl.setWalkInputDirection(left === right ? 0 : left ? -1 : 1);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      pressed.add(e.key);
      syncDirection();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      pressed.delete(e.key);
      syncDirection();
    };
    const onBlur = () => {
      pressed.clear();
      syncDirection();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/layout-info-image");
        if (!res.ok) return;
        const data = (await res.json()) as { images?: string[] };
        if (!cancelled) setLayoutInfoImageOptions(data.images ?? []);
      } catch { /* ignore */ }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!drawerEditor) return;
    drawerEditor.setEditable(isDrawerEditorOpen);
    const currentHtml = drawerEditor.getHTML();
    const nextHtml = selectedLayoutDrawer.bodyHtml ?? "";
    if (currentHtml !== nextHtml) {
      drawerEditor.commands.setContent(nextHtml || "<p></p>");
    }
  }, [drawerEditor, isDrawerEditorOpen, selectedLayoutDrawer.bodyHtml, layout.selectedLayoutSpriteId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement === shell) {
      await document.exitFullscreen();
    } else {
      await shell.requestFullscreen();
    }
  };

  const handleSceneSelectChange = (value: string) => {
    if (value.startsWith(BUILDER_SCENE_SELECT_PREFIX)) {
      const id = value.slice(BUILDER_SCENE_SELECT_PREFIX.length);
      layout.setActiveBuilderSceneId(id);
      layout.setSelectedLayoutSpriteId(null);
      game.setScene("scene-builder");
      return;
    }
    game.setScene(value as SceneId);
  };

  const updateSelectedInfoModalStage = (
    stageId: SceneInfoModalStageId,
    patch: Partial<SceneInfoModalConfig[SceneInfoModalStageId]>,
  ) => {
    const currentInfoModal =
      (controllerRef.current?.getSelectedLayoutSpriteSnapshot()?.interaction?.infoModal as
        | SceneInfoModalConfig
        | undefined) ??
      (selectedLayoutInfoModal as SceneInfoModalConfig | undefined) ??
      {};
    const currentStage =
      (currentInfoModal as Record<string, Partial<SceneInfoModalConfig[SceneInfoModalStageId]>>)[stageId] ?? {};
    const nextStage = { ...currentStage, ...patch };
    const nextInfoModal: SceneInfoModalConfig = {
      ...currentInfoModal,
      [stageId]: Object.values(nextStage).some((v) => v !== undefined && v !== "")
        ? nextStage
        : undefined,
    };
    controllerRef.current?.updateSelectedLayoutSpriteInteraction({ infoModal: nextInfoModal });
  };

  const handleInfoImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingInfoImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/layout-info-image", { method: "POST", body: formData });
      if (!res.ok) return;
      const data = (await res.json()) as { src?: string };
      if (!data.src) return;
      setLayoutInfoImageOptions((curr) =>
        curr.includes(data.src!) ? curr : [...curr, data.src!].sort(),
      );
      updateSelectedInfoModalStage(selectedInfoEditorStage, { imageSrc: data.src });
    } catch { /* ignore */ } finally {
      setIsUploadingInfoImage(false);
      event.target.value = "";
    }
  };

  const handleCollectIconUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingCollectIcon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/layout-info-image", { method: "POST", body: formData });
      if (!res.ok) return;
      const data = (await res.json()) as { src?: string };
      if (!data.src) return;
      setLayoutInfoImageOptions((curr) =>
        curr.includes(data.src!) ? curr : [...curr, data.src!].sort(),
      );
      controllerRef.current?.updateSelectedLayoutSpriteInteraction({ collectIconSrc: data.src });
    } catch { /* ignore */ } finally {
      setIsUploadingCollectIcon(false);
      event.target.value = "";
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section ref={shellRef} className="scene-shell" aria-label="Interactive pixel art intro">
      <div className={`scene-workspace${isLayoutModeEnabled ? " is-layout-open" : ""}`}>
        {isLayoutModeEnabled ? (
          <LayoutPanel
            controllerRef={controllerRef}
            isLightingEnabled={isLightingEnabled}
            isRainEnabled={isRainEnabled}
            onLightingChange={setIsLightingEnabled}
            onRainChange={setIsRainEnabled}
            currentSceneId={currentScene.id}
            layoutSaveLabel={layout.layoutSaveLabel}
            layoutSaveState={layout.layoutSaveState}
            onCopyJson={() => void layout.handleCopyLayoutJson()}
            onSave={() => void layout.saveCurrentSceneLayout()}
            onReset={() => void layout.resetCurrentSceneLayout()}
            selectedLayoutSpriteId={layout.selectedLayoutSpriteId}
            setSelectedLayoutSpriteId={layout.setSelectedLayoutSpriteId}
            visibleLayoutSprites={layout.visibleLayoutSprites}
            selectedLayoutSpriteLive={selectedLayoutSpriteLive}
            selectedLayoutSpriteInteraction={selectedLayoutSpriteInteraction}
            selectedLayoutSpriteLiveInteraction={selectedLayoutSpriteLiveInteraction}
            selectedLayoutSpriteVisuals={selectedLayoutSpriteVisuals}
            selectedLayoutSpriteLight={selectedLayoutSpriteLight}
            selectedLayoutSpriteAlpha={selectedLayoutSpriteAlpha}
            selectedLayoutSpriteParticles={selectedLayoutSpriteParticles}
            selectedLayoutSpriteRuntimeType={selectedLayoutSpriteRuntimeType}
            isSmokeSelected={isSmokeSelected}
            isLightSelected={isLightSelected}
            sceneThreeSmokeControls={layout.sceneThreeSmokeControls}
            onSmokeUpdate={layout.updateSmokeControl}
            effectiveRainSplashSegments={effectiveRainSplashSegments}
            selectedRainSplashSegmentIndex={layout.selectedRainSplashSegmentIndex}
            setSelectedRainSplashSegmentIndex={layout.setSelectedRainSplashSegmentIndex}
            activeRainSplashSegment={activeRainSplashSegment}
            activeRainSplashWidthPercent={activeRainSplashWidthPercent}
            activeRainSplashMinWidthPercent={activeRainSplashMinWidthPercent}
            activeRainSplashMaxWidthPercent={activeRainSplashMaxWidthPercent}
            onUpdateRainSplashSegments={layout.updateRainSplashSegments}
            builderScenes={layout.builderScenes}
            activeBuilderSceneId={layout.activeBuilderSceneId}
            setActiveBuilderSceneId={layout.setActiveBuilderSceneId}
            activeBuilderScene={layout.activeBuilderScene}
            newBuilderSceneName={layout.newBuilderSceneName}
            setNewBuilderSceneName={layout.setNewBuilderSceneName}
            onSaveBuilderScene={() => void layout.saveActiveBuilderScene()}
            onCreateEmptyBuilderScene={() =>
              layout.createEmptyBuilderScene((sceneId) => game.setScene(sceneId as SceneId))
            }
            onUpdateActiveBuilderScene={layout.updateActiveBuilderScene}
            builderAssetOptions={layout.builderAssetOptions}
            isUploadingBuilderAsset={layout.isUploadingBuilderAsset}
            selectedBuilderItemSrc={layout.selectedBuilderItemSrc}
            setSelectedBuilderItemSrc={layout.setSelectedBuilderItemSrc}
            filteredBuilderItemOptions={layout.filteredBuilderItemOptions}
            builderItemSearchQuery={layout.builderItemSearchQuery}
            setBuilderItemSearchQuery={layout.setBuilderItemSearchQuery}
            selectedBuilderAssetType={layout.selectedBuilderAssetType}
            setSelectedBuilderAssetType={layout.setSelectedBuilderAssetType}
            selectedBuilderAnimatedPreset={layout.selectedBuilderAnimatedPreset}
            setSelectedBuilderAnimatedPreset={layout.setSelectedBuilderAnimatedPreset}
            onBuilderAssetUpload={layout.handleBuilderAssetUpload}
            onAddItemToScene={() => void layout.addBuilderItemToScene()}
            onAddLight={() => void layout.addRuntimeLightToScene()}
            onOpenInfoEditor={() => setIsInfoEditorOpen(true)}
            onOpenDrawerEditor={() => setIsDrawerEditorOpen(true)}
            onOpenCollectEditor={() => setIsCollectEditorOpen(true)}
          />
        ) : null}

        <div
          ref={hostRef}
          className={`scene-canvas-host${isReady ? " is-ready" : ""}`}
          tabIndex={0}
        />
      </div>

      {auth.user ? (
        <div className="scene-controls">
          <div className="scene-controls__top-row">
            <div className="scene-controls__actions">
              <button
                type="button"
                className="scene-icon-trigger"
                onClick={() => setIsMapOpen(true)}
                aria-label="Open map"
                title="Map"
              >
                <Directions aria-hidden="true" />
              </button>
              <button
                type="button"
                className="scene-icon-trigger"
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <Expand aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`scene-icon-trigger${isLayoutModeEnabled ? " is-active" : ""}`}
                onClick={() => setIsLayoutModeEnabled((c) => !c)}
                aria-label={isLayoutModeEnabled ? "Disable layout mode" : "Enable layout mode"}
                title={isLayoutModeEnabled ? "Layout On" : "Layout Off"}
              >
                <Grid3x3 aria-hidden="true" />
              </button>
              <button
                type="button"
                className="scene-icon-trigger scene-icon-trigger--logout"
                onClick={() => {
                  setIsLayoutModeEnabled(false);
                  void auth.signOut();
                }}
                title="Logout"
                aria-label="Logout"
              >
                <span className="scene-logout-label font-pixel">exit</span>
              </button>
            </div>
          </div>

          <label className="scene-select font-pixel" htmlFor="scene-select">
            <span className="scene-select__label">Scene</span>
            <select
              id="scene-select"
              className="scene-select__input"
              value={selectedSceneOptionValue}
              onChange={(e) => handleSceneSelectChange(e.target.value)}
            >
              <option value="scene-1">Scene 1</option>
              <option value="scene-2">Scene 2</option>
              <option value="scene-3">Scene 3</option>
              <option value="scene-4">Scene 4</option>
              <option value="scene-builder">Scene Builder</option>
              {layout.builderScenes.map((scene) => (
                <option key={scene.id} value={`${BUILDER_SCENE_SELECT_PREFIX}${scene.id}`}>
                  Builder: {scene.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {/* Avatar drawer */}
      <div
        ref={avatarDrawer.avatarDrawerBackdropRef}
        className={`avatar-drawer-backdrop${avatarDrawer.isAvatarDrawerOpen ? " is-open" : ""}`}
        onClick={() => {
          avatarDrawer.setIsAvatarDrawerOpen(false);
          infoModal.setActiveLayoutInfoModal((curr) => (curr?.interaction.hasDrawer ? null : curr));
        }}
      >
        <div
          ref={avatarDrawer.avatarDrawerPanelRef}
          className={`avatar-drawer${avatarDrawer.isAvatarDrawerOpen ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Avatar panel"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="avatar-drawer__close"
            aria-label="Close drawer"
            onClick={() => {
              avatarDrawer.setIsAvatarDrawerOpen(false);
              infoModal.setActiveLayoutInfoModal((curr) =>
                curr?.interaction.hasDrawer ? null : curr,
              );
            }}
          >
            Close
          </button>

          {activeLayoutDrawer?.title ? (
            <h2 className="avatar-drawer__title font-pixel">{activeLayoutDrawer.title}</h2>
          ) : null}

          <div className="avatar-drawer__scroll">
            {activeLayoutDrawer?.bodyHtml ? (
              <div
                className="avatar-drawer__body"
                dangerouslySetInnerHTML={{ __html: activeLayoutDrawer.bodyHtml }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`scene-avatar-ui${avatarDrawer.isAvatarDrawerOpen ? " is-active" : ""}${infoModal.activeLayoutInfoModal?.interaction.hasDrawer ? " is-visible" : ""}`}
        onClick={() => avatarDrawer.setIsAvatarDrawerOpen((c) => !c)}
        aria-label={avatarDrawer.isAvatarDrawerOpen ? "Close avatar panel" : "Open avatar panel"}
        title={avatarDrawer.isAvatarDrawerOpen ? "Close panel" : "Open panel"}
      >
        <img className="scene-avatar-ui__image" src="/assets/ui/avatar.png" alt="" />
      </button>

      {game.inventoryItems.length > 0 ? (
        <aside className="inventory-dock" aria-label="Collected items">
          {game.inventoryItems.map((item, index) => {
            const isSelected = game.state.selectedInventoryItemId === item.id;
            return (
              <button
                key={item.id}
                ref={(element) => registerInventoryItemRef(item.id, element)}
                type="button"
                className={`inventory-dock__item${isSelected ? " is-selected" : ""}`}
                aria-label={item.label}
                onClick={() => game.setSelectedInventoryItem(isSelected ? null : item.id)}
                style={{ ["--inventory-order" as string]: index }}
              >
                <img
                  className="inventory-dock__frame"
                  src="/assets/ui/item_container.webp"
                  alt=""
                  aria-hidden="true"
                />
                <img
                  className="inventory-dock__icon"
                  src={item.iconSrc}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </aside>
      ) : null}

      <ItemInfoModal isOpen={activeItemInfo !== null} item={activeItemInfo} onClose={game.closeItemInfo} />

      <LayoutInfoModal
        activeLayoutInfoModal={infoModal.activeLayoutInfoModal}
        activeLayoutInfoStage={infoModal.activeLayoutInfoStage}
        activeLayoutInfoStageId={infoModal.activeLayoutInfoStageId}
        activeLayoutInfoUsesWindow={infoModal.activeLayoutInfoUsesWindow}
        activeLayoutInfoPortraitSrc={infoModal.activeLayoutInfoPortraitSrc}
        activeLayoutInfoHasAlternateImage={infoModal.activeLayoutInfoHasAlternateImage}
        activeLayoutInfoHasFinalStage={infoModal.activeLayoutInfoHasFinalStage}
        activeLayoutInfoModalFlipped={infoModal.activeLayoutInfoModalFlipped}
        activeLayoutInfoInputValue={infoModal.activeLayoutInfoInputValue}
        onClose={infoModal.closeActiveLayoutInfoModal}
        onPreviewClick={infoModal.handleActiveLayoutInfoPreviewClick}
        onInputChange={infoModal.setActiveLayoutInfoInputValue}
        onInputSubmit={infoModal.submitActiveLayoutInfoInput}
      />

      <InfoEditor
        isOpen={isInfoEditorOpen}
        interaction={selectedLayoutSpriteInteraction}
        selectedInfoEditorStage={selectedInfoEditorStage}
        selectedInfoEditorStageConfig={selectedInfoEditorStageConfig}
        layoutInfoImageOptions={layoutInfoImageOptions}
        isUploadingInfoImage={isUploadingInfoImage}
        onClose={() => setIsInfoEditorOpen(false)}
        onStageChange={setSelectedInfoEditorStage}
        onStageUpdate={updateSelectedInfoModalStage}
        onImageUpload={handleInfoImageUpload}
      />

      <DrawerEditor
        isOpen={isDrawerEditorOpen}
        interaction={selectedLayoutSpriteInteraction}
        drawerTitle={selectedLayoutDrawer.title ?? ""}
        editor={drawerEditor}
        onClose={() => setIsDrawerEditorOpen(false)}
        onTitleChange={(title) => updateSelectedDrawerConfig({ title: title || undefined })}
      />

      <CollectEditor
        isOpen={isCollectEditorOpen}
        interaction={selectedLayoutSpriteInteraction}
        layoutInfoImageOptions={layoutInfoImageOptions}
        isUploadingCollectIcon={isUploadingCollectIcon}
        controllerRef={controllerRef}
        onClose={() => setIsCollectEditorOpen(false)}
        onCollectIconUpload={handleCollectIconUpload}
      />

      <SceneMapOverlay
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectIsland={(islandId) => {
          if (islandId === "home") { setIsMapOpen(false); game.setScene("scene-1"); }
          if (islandId === "shopify") { setIsMapOpen(false); game.setScene("scene-3"); }
          if (islandId === "webflow") { setIsMapOpen(false); game.setScene("scene-4"); }
        }}
      />

      {cursorLabel ? (
        <div
          className="inventory-cursor-label"
          aria-hidden="true"
          style={{
            left: `${cursorFollow.cursorDisplayPosition.x}px`,
            top: `${cursorFollow.cursorDisplayPosition.y}px`,
          }}
        >
          {cursorLabel}
        </div>
      ) : null}

    </section>
  );
}
