"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  animateItemInfoModalIn,
  animateItemInfoModalOut,
} from "@/lib/game/ui/inventory-animations";

type SceneMapOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectIsland?: (islandId: string) => void;
};

const MAP_ISLANDS = [
  {
    id: "webflow",
    label: "Webflow",
    src: "/assets/map/webflow.png",
    className: "scene-map-overlay__island scene-map-overlay__island--webflow",
  },
  {
    id: "shopify",
    label: "Shopify",
    src: "/assets/map/shopify.png",
    className: "scene-map-overlay__island scene-map-overlay__island--shopify",
  },
  {
    id: "nextjs",
    label: "Next.js",
    src: "/assets/map/nextjs.png",
    className: "scene-map-overlay__island scene-map-overlay__island--nextjs",
  },
  {
    id: "home",
    label: "Home",
    src: "/assets/map/home.png",
    className: "scene-map-overlay__island scene-map-overlay__island--home",
  },
  {
    id: "contact",
    label: "Contact",
    src: "/assets/map/contact.png",
    className: "scene-map-overlay__island scene-map-overlay__island--contact",
  },
  {
    id: "about",
    label: "About",
    src: "/assets/map/about.png",
    className: "scene-map-overlay__island scene-map-overlay__island--about",
  },
  {
    id: "hubspot",
    label: "HubSpot",
    src: "/assets/map/hubspot.png",
    className: "scene-map-overlay__island scene-map-overlay__island--hubspot",
  },
] as const;

export function SceneMapOverlay({ isOpen, onClose, onSelectIsland }: SceneMapOverlayProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const islandRefs = useRef(new Map<string, HTMLImageElement>());
  const hoverLeaveTimeoutRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [hoveredIslandId, setHoveredIslandId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimeoutRef.current !== null) {
        window.clearTimeout(hoverLeaveTimeoutRef.current);
        hoverLeaveTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const modal = modalRef.current;

    if (!modal || !isMounted) {
      return;
    }

    if (isOpen) {
      const tween = animateItemInfoModalIn(modal);
      return () => {
        tween.kill();
      };
    }

    const tween = animateItemInfoModalOut(modal, () => {
      setIsMounted(false);
    });

    return () => {
      tween.kill();
    };
  }, [isMounted, isOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="scene-map-overlay-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="scene-map-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scene-map-overlay-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="scene-map-overlay__close font-pixel"
          aria-label="Close map"
          onClick={onClose}
        >
          X
        </button>

        <div className="scene-map-overlay__header">
          <p className="scene-map-overlay__eyebrow font-pixel">Travel Map</p>
          <h2 id="scene-map-overlay-title" className="scene-map-overlay__title font-pixel">
            Choose A Destination
          </h2>
        </div>

        <div className="scene-map-overlay__world">
          {MAP_ISLANDS.map((island) => (
            <img
              key={island.id}
              ref={(element) => {
                if (!element) {
                  islandRefs.current.delete(island.id);
                  return;
                }

                islandRefs.current.set(island.id, element);
              }}
              className={`${island.className}${
                hoveredIslandId && hoveredIslandId !== island.id
                  ? " scene-map-overlay__island--dimmed"
                  : ""
              }`}
              src={island.src}
              alt={island.label}
              onPointerEnter={() => {
                if (hoverLeaveTimeoutRef.current !== null) {
                  window.clearTimeout(hoverLeaveTimeoutRef.current);
                  hoverLeaveTimeoutRef.current = null;
                }

                setHoveredIslandId(island.id);
                const element = islandRefs.current.get(island.id);

                if (!element) {
                  return;
                }

                gsap.to(element, {
                  y: -10,
                  scale: 1.035,
                  duration: 0.26,
                  ease: "power2.out",
                });
              }}
              onPointerLeave={() => {
                hoverLeaveTimeoutRef.current = window.setTimeout(() => {
                  setHoveredIslandId((current) => (current === island.id ? null : current));
                  hoverLeaveTimeoutRef.current = null;
                }, 90);

                const element = islandRefs.current.get(island.id);

                if (!element) {
                  return;
                }

                gsap.to(element, {
                  y: 0,
                  scale: 1,
                  duration: 0.24,
                  ease: "power2.out",
                });
              }}
              onClick={() => onSelectIsland?.(island.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
