export const BUILDER_SCENE_SELECT_PREFIX = "builder:";

export type BuilderAssetType = "prop" | "animated";
export type BuilderAnimatedPreset = "main-character" | "character-idle" | "cat" | "wind-turbine";

export const BUILDER_ANIMATED_PRESET_OPTIONS: Array<{ id: BuilderAnimatedPreset; label: string }> = [
  { id: "main-character", label: "Main Character" },
  { id: "character-idle", label: "Character Idle" },
  { id: "cat", label: "Cat" },
  { id: "wind-turbine", label: "Wind Turbine" },
];

export const LIGHT_PARTICLE_PRESETS = {
  softMotes: {
    label: "Soft Motes",
    config: {
      enabled: true,
      color: "#f7deb0",
      count: 5,
      size: 4,
      opacity: 0.16,
      speed: 0.88,
      drift: 0.92,
      areaWidth: 56,
      areaHeight: 88,
      blendMode: "screen" as const,
    },
  },
  fireflies: {
    label: "Fireflies",
    config: {
      enabled: true,
      color: "#f9ee8d",
      count: 8,
      size: 5,
      opacity: 0.34,
      speed: 1.26,
      drift: 0.82,
      areaWidth: 86,
      areaHeight: 118,
      blendMode: "screen" as const,
    },
  },
  dust: {
    label: "Dust",
    config: {
      enabled: true,
      color: "#cdbb98",
      count: 12,
      size: 3,
      opacity: 0.12,
      speed: 0.62,
      drift: 1.18,
      areaWidth: 92,
      areaHeight: 136,
      blendMode: "lighten" as const,
    },
  },
  magic: {
    label: "Magic",
    config: {
      enabled: true,
      color: "#ffd0fa",
      count: 10,
      size: 5,
      opacity: 0.3,
      speed: 1.34,
      drift: 1.08,
      areaWidth: 96,
      areaHeight: 132,
      blendMode: "add" as const,
    },
  },
} as const;

export const INTERACTION_TARGET_LABELS: Record<string, string> = {
  character: "character",
  cat: "cat",
};

export const PLAYFUL_ITEM_USE_MESSAGES: Record<
  string,
  { default: string[]; targets?: Record<string, string[]> }
> = {
  coffee: {
    default: [
      "This coffee deserves a better destiny than that.",
      "That would be a dramatic use of coffee, but not a useful one.",
      "I admire the creativity, but this is not the coffee moment.",
      "Funny idea. Wrong target, excellent confidence.",
    ],
    targets: {
      coffee: [
        "Using coffee on coffee feels bold, recursive, and deeply unnecessary.",
        "More coffee for the coffee is not the breakthrough we need.",
      ],
      lamp: [
        "The lamp already looks fully caffeinated.",
        "I could offer the lamp a coffee, but it seems awake enough.",
      ],
      logo: [
        "My logo appreciates good taste, but it does not drink coffee.",
        "Nice try. The logo prefers attention, not espresso.",
      ],
      sign: [
        "A coffee-powered shortcut would be amazing, but the sign is not buying it.",
        "I do not think the sign accepts caffeine as a bribe.",
      ],
      character: [
        "Giving myself more coffee right now would only increase the chaos.",
        "Tempting, but I am trying to solve puzzles, not double my caffeine stack.",
      ],
      cat: [
        "Absolutely not. The cat has enough personality already.",
        "The cat does not need coffee. None of us are ready for that timeline.",
      ],
    },
  },
};

export const INFO_MODAL_STAGE_ORDER = ["normal", "updated", "final"] as const;
