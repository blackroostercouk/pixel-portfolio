"use client";

import { type Editor, EditorContent } from "@tiptap/react";
import type { SceneSpriteInteractionConfig } from "@/lib/game/types";

type Props = {
  isOpen: boolean;
  interaction: SceneSpriteInteractionConfig | null | undefined;
  drawerTitle: string;
  editor: Editor | null;
  onClose: () => void;
  onTitleChange: (title: string) => void;
};

export function DrawerEditor({
  isOpen,
  interaction,
  drawerTitle,
  editor,
  onClose,
  onTitleChange,
}: Props) {
  if (!isOpen || !interaction?.clickable || !interaction?.hasDrawer) return null;

  return (
    <div className="layout-info-editor-backdrop" onClick={onClose}>
      <div
        className="layout-info-editor font-pixel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="layout-info-editor__header">
          <p className="layout-info-editor__eyebrow">Drawer Content</p>
          <button type="button" className="layout-info-editor__close" onClick={onClose}>
            Close
          </button>
        </div>

        <label className="layout-panel__field">
          <span className="layout-panel__label">Title</span>
          <input
            className="layout-panel__input layout-panel__input--text"
            type="text"
            value={drawerTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Drawer title"
          />
        </label>

        <div className="layout-panel__field">
          <span className="layout-panel__label">Rich Text</span>

          <div className="drawer-rich-editor__toolbar">
            <button
              type="button"
              className="layout-info-editor__close"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              Bold
            </button>
            <button
              type="button"
              className="layout-info-editor__close"
              onClick={() => {
                const url = window.prompt("Enter URL");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
              }}
            >
              Add Link
            </button>
            <button
              type="button"
              className="layout-info-editor__close"
              onClick={() => editor?.chain().focus().unsetLink().run()}
            >
              Remove Link
            </button>
          </div>

          <div className="drawer-rich-editor-shell">
            {editor?.isEmpty ? (
              <span className="drawer-rich-editor__placeholder" aria-hidden="true">
                Write drawer content here...
              </span>
            ) : null}
            <EditorContent className="drawer-rich-editor" editor={editor} />
          </div>

          <span className="layout-info-editor__hint">
            Select text and use Bold or Add Link. Content will be scrollable inside the drawer.
          </span>
        </div>
      </div>
    </div>
  );
}
