"use client";

import { useEffect, useRef, useState } from "react";

export function useCursorFollow(hasSelectedItem: boolean) {
  const [cursorDisplayPosition, setCursorDisplayPosition] = useState({ x: 0, y: 0 });
  const [isHoveringInteractiveObject, setIsHoveringInteractiveObject] = useState(false);
  const cursorTargetPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!hasSelectedItem) {
      setIsHoveringInteractiveObject(false);
      return;
    }

    let animationFrameId = 0;
    let currentX = cursorTargetPositionRef.current.x;
    let currentY = cursorTargetPositionRef.current.y;

    const handlePointerMove = (event: PointerEvent) => {
      cursorTargetPositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const animateCursorLabel = () => {
      currentX += (cursorTargetPositionRef.current.x - currentX) * 0.12;
      currentY += (cursorTargetPositionRef.current.y - currentY) * 0.12;
      setCursorDisplayPosition({ x: currentX, y: currentY });
      animationFrameId = window.requestAnimationFrame(animateCursorLabel);
    };

    window.addEventListener("pointermove", handlePointerMove);
    animationFrameId = window.requestAnimationFrame(animateCursorLabel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [hasSelectedItem]);

  return { cursorDisplayPosition, isHoveringInteractiveObject, setIsHoveringInteractiveObject };
}
