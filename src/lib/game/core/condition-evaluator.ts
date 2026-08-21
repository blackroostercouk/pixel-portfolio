import type { GameCondition } from "./game-schema";
import type { GameState } from "./game-state";

export function evaluateCondition(state: GameState, condition: GameCondition) {
  switch (condition.type) {
    case "hasItem":
      return state.inventoryItemIds.includes(condition.itemId);
    case "missingItem":
      return !state.inventoryItemIds.includes(condition.itemId);
    case "flagEquals":
      return state.flags[condition.flag] === condition.value;
    case "flagNotEquals":
      return state.flags[condition.flag] !== condition.value;
    default:
      return false;
  }
}

export function evaluateConditions(
  state: GameState,
  conditions: GameCondition[] | undefined,
) {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateCondition(state, condition));
}
