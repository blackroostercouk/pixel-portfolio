"use client";

type SceneLoadingScreenProps = {
  isVisible: boolean;
  progress: number;
};

export function SceneLoadingScreen({
  isVisible,
  progress,
}: SceneLoadingScreenProps) {
  const safeProgress = Math.max(0, Math.min(progress, 1));

  return (
    <div
      className={`scene-loading${isVisible ? " is-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
    >
      <div className="scene-loading__dither" aria-hidden="true" />

      <div className="scene-loading__content">
        <div className="scene-loading__copy font-pixel">
          <p className="scene-loading__eyebrow">Preparing the scene</p>
          <p className="scene-loading__title">Loading intro assets...</p>
        </div>

        <div className="scene-loading__bar" aria-hidden="true">
          <div
            className="scene-loading__bar-fill-wrap"
            style={{
              clipPath: `inset(0 ${100 - safeProgress * 100}% 0 0)`,
            }}
          >
            <img
              className="scene-loading__bar-fill"
              src="/assets/ui/loading_bar.webp"
              alt=""
            />
          </div>
          <img
            className="scene-loading__bar-frame"
            src="/assets/ui/loading_bar_out.webp"
            alt=""
          />
        </div>

        <p className="scene-loading__percent font-pixel">
          {Math.round(safeProgress * 100)}%
        </p>
      </div>
    </div>
  );
}
