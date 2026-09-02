"use client";

import { useRef, useState, useEffect } from "react";
import type { CollectibleItemDefinition } from "@/lib/game/types";
import type { BuilderSceneDefinition } from "@/lib/game/hooks/use-scene-layout-editor";

const NONE = "__none__";

type Props = {
  isOpen: boolean;
  items: CollectibleItemDefinition[];
  builderScenes: BuilderSceneDefinition[];
  layoutInfoImageOptions: string[];
  onSave: (items: CollectibleItemDefinition[]) => Promise<void>;
  onClose: () => void;
};

export function CollectibleItemsModal({
  isOpen,
  items,
  builderScenes,
  layoutInfoImageOptions,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState<CollectibleItemDefinition[]>(items);
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageOptions, setImageOptions] = useState<string[]>(layoutInfoImageOptions);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rewardFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageOptions((prev) => {
      const extras = prev.filter((src) => !layoutInfoImageOptions.includes(src));
      return [...layoutInfoImageOptions, ...extras];
    });
  }, [layoutInfoImageOptions]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (justOpened) {
      setDraft(items);
      setSelectedId((prev) => items.find((i) => i.id === prev)?.id ?? items[0]?.id ?? null);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/layout-info-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = (await res.json()) as { src?: string };
        if (data.src) {
          setImageOptions((prev) => [...prev, data.src!]);
          updateSelected({ iconSrc: data.src });
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRewardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/layout-info-image", { method: "POST", body: fd });
      if (res.ok) {
        const data = (await res.json()) as { src?: string };
        if (data.src) {
          setImageOptions((prev) => [...prev, data.src!]);
          updateSelected({ targetCollectibleSrc: data.src });
        }
      }
    } finally {
      setUploading(false);
      if (rewardFileInputRef.current) rewardFileInputRef.current.value = "";
    }
  };

  // Sync draft when modal opens with fresh items
  const selected = draft.find((i) => i.id === selectedId) ?? null;

  // All sprites across all scenes — for target object dropdown
  const allSprites = builderScenes.flatMap((scene) =>
    scene.sprites.map((s) => ({ ...s, sceneName: scene.label })),
  );

  const updateSelected = (patch: Partial<CollectibleItemDefinition>) => {
    setDraft((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    const id = `item-${Date.now()}`;
    const newItem: CollectibleItemDefinition = {
      id,
      label: "New Item",
      iconSrc: "",
    };
    setDraft((prev) => [...prev, newItem]);
    setSelectedId(id);
  };

  const deleteSelected = () => {
    const next = draft.filter((i) => i.id !== selectedId);
    setDraft(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <div className="layout-info-editor-backdrop" onClick={onClose}>
      <div
        className="layout-info-editor font-pixel"
        style={{ width: 680, maxWidth: "96vw", display: "flex", gap: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: item list */}
        <div style={{ width: 200, borderRight: "1px solid var(--color-border, #333)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="layout-info-editor__header" style={{ marginBottom: 8 }}>
            <h2 className="layout-info-editor__title" style={{ fontSize: 11 }}>Items Registry</h2>
            <button type="button" className="layout-info-editor__close" onClick={onClose}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {draft.map((item) => (
              <button
                key={item.id}
                type="button"
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderRadius: 4,
                  background: item.id === selectedId ? "var(--color-accent, #4a7)" : "transparent",
                  border: "1px solid var(--color-border, #444)",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={() => setSelectedId(item.id)}
              >
                {item.iconSrc ? (
                  <img src={item.iconSrc} alt="" style={{ width: 20, height: 20, objectFit: "contain", imageRendering: "pixelated" }} />
                ) : (
                  <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>?</span>
                )}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </button>
            ))}
          </div>

          <button type="button" className="layout-panel__action" style={{ marginTop: 8 }} onClick={addItem}>
            + Add Item
          </button>
        </div>

        {/* Right: item editor */}
        <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
          {selected ? (
            <>
              <label className="layout-panel__field">
                <span className="layout-panel__label">Label</span>
                <input
                  className="layout-panel__input"
                  type="text"
                  value={selected.label}
                  placeholder="e.g. Golden Key"
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </label>

              <label className="layout-panel__field">
                <span className="layout-panel__label">Icon Image</span>
                <select
                  className="layout-panel__input"
                  value={selected.iconSrc || NONE}
                  onChange={(e) => updateSelected({ iconSrc: e.target.value === NONE ? "" : e.target.value })}
                >
                  <option value={NONE}>Select image...</option>
                  {imageOptions.map((src) => (
                    <option key={src} value={src}>{src.split("/").pop()}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <button
                  type="button"
                  className="layout-panel__action"
                  style={{ fontSize: 10 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Icon"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                />
              </div>

              {selected.iconSrc ? (
                <div className="layout-info-editor__preview" style={{ marginBottom: 8 }}>
                  <img src={selected.iconSrc} alt="icon" style={{ maxWidth: 60, maxHeight: 60, imageRendering: "pixelated" }} />
                </div>
              ) : null}

              <label className="layout-panel__field">
                <input
                  type="checkbox"
                  checked={selected.consumeOnUse ?? false}
                  onChange={(e) => updateSelected({ consumeOnUse: e.target.checked || undefined })}
                />
                <span className="layout-panel__label">Remove from inventory after use</span>
              </label>

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="layout-panel__action"
                  style={{ background: "var(--color-danger, #c44)", color: "#fff" }}
                  onClick={deleteSelected}
                >
                  Delete Item
                </button>
              </div>
            </>
          ) : (
            <p className="layout-panel__hint" style={{ marginTop: 16 }}>
              No items yet. Click "+ Add Item" to create one.
            </p>
          )}
        </div>
      </div>

      {/* Save / Cancel footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
        <button type="button" className="layout-panel__action" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="layout-panel__action"
          style={{ background: "var(--color-accent, #4a7)", color: "#000" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Items"}
        </button>
      </div>
    </div>
  );
}
