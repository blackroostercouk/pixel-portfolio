"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function useAvatarDrawer() {
  const [isAvatarDrawerOpen, setIsAvatarDrawerOpen] = useState(false);
  const avatarDrawerPanelRef = useRef<HTMLDivElement | null>(null);
  const avatarDrawerBackdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = avatarDrawerPanelRef.current;
    const backdrop = avatarDrawerBackdropRef.current;
    if (!panel || !backdrop) return;

    gsap.killTweensOf(panel);
    gsap.killTweensOf(backdrop);

    if (isAvatarDrawerOpen) {
      gsap.set(backdrop, { pointerEvents: "auto" });
      gsap.set(panel, { clearProps: "x,xPercent,transform" });
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: "power2.out" });
      gsap.fromTo(panel, { opacity: 0.72 }, { opacity: 1, duration: 0.42, ease: "power2.out" });
      return;
    }

    gsap.to(backdrop, {
      opacity: 0,
      duration: 0.18,
      ease: "power2.out",
      onComplete: () => {
        if (avatarDrawerBackdropRef.current) {
          gsap.set(avatarDrawerBackdropRef.current, { pointerEvents: "none" });
        }
      },
    });
    gsap.to(panel, { opacity: 0.72, duration: 0.3, ease: "power2.out" });
  }, [isAvatarDrawerOpen]);

  return {
    isAvatarDrawerOpen,
    setIsAvatarDrawerOpen,
    avatarDrawerPanelRef,
    avatarDrawerBackdropRef,
  };
}
