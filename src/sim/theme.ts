import { create } from "zustand";

/** Look of the tablet POS order page; only applies in Phase 2.0 and survives sim resets. */
export const THEMES = [
  { id: "dark", label: "Dark", chip: "Default" },
  { id: "light", label: "Light", chip: "Pulse" },
  { id: "foodpanda", label: "Foodpanda", chip: "Pink" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "dark";

export const useTheme = create<{ theme: ThemeId; setTheme: (theme: ThemeId) => void }>((set) => ({
  theme: DEFAULT_THEME,
  setTheme: (theme) => set({ theme }),
}));
