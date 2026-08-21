"use client";

import { useEffect, useRef } from "react";
import { animateInventoryItemIn } from "@/lib/game/ui/inventory-animations";
import type { GameInventoryItemDefinition } from "@/lib/game/core/game-schema";

export function useInventoryAnimations(inventoryItems: GameInventoryItemDefinition[]) {
  const inventoryItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousInventoryCountRef = useRef(0);

  useEffect(() => {
    const previousCount = previousInventoryCountRef.current;
    const nextCount = inventoryItems.length;

    if (nextCount > previousCount) {
      const lastItem = inventoryItems.at(-1);
      const element = lastItem ? inventoryItemRefs.current.get(lastItem.id) : null;

      if (element) {
        const tween = animateInventoryItemIn(element);
        previousInventoryCountRef.current = nextCount;
        return () => { tween.kill(); };
      }
    }

    previousInventoryCountRef.current = nextCount;
  }, [inventoryItems]);

  const registerInventoryItemRef = (id: string, element: HTMLButtonElement | null) => {
    if (!element) {
      inventoryItemRefs.current.delete(id);
    } else {
      inventoryItemRefs.current.set(id, element);
    }
  };

  return { registerInventoryItemRef };
}
