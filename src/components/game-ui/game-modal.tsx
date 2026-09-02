"use client";

import { useEffect, useState } from "react";
import { SlidingPuzzleGame } from "./sliding-puzzle-game";

export type GameId = "sliding-puzzle";

type Props = {
  isOpen: boolean;
  gameId: GameId;
  onWin: () => void;
  onClose: () => void;
};

export function GameModal({ isOpen, gameId, onWin, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        background: `rgb(3 8 4 / ${visible ? "9%" : "0%"})`,
        backdropFilter: "blur(6px)",
        transition: "background 380ms",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes gm-in {
          from { opacity: 0; transform: translateY(28px) scale(.93); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gm-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(28px) scale(.93); }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: `${visible ? "gm-in" : "gm-out"} 380ms cubic-bezier(.22,.76,.28,1) both`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: -32,
            right: 0,
            background: "transparent",
            border: "none",
            color: "#d5ae75",
            fontSize: 18,
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: 1,
            padding: "4px 8px",
            opacity: visible ? 1 : 0,
            transition: "opacity 300ms ease 200ms",
          }}
        >
          ✕
        </button>
        {gameId === "sliding-puzzle" && (
          <SlidingPuzzleGame onWin={onWin} />
        )}
      </div>
    </div>
  );
}
