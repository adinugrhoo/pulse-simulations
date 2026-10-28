import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getTheme, type PhaseId, type ThemeId } from "@/config/phases";

/**
 * What the header has selected: the phase on screen and the theme each phase shows.
 * Lives outside the sim store so a reset or a scenario replay keeps the look, and in
 * sessionStorage so a dev reload (e.g. after the Menu Studio saves a menu.json) lands
 * back on the same phase and theme.
 */
type ThemeChoice = {
  byPhase: Record<PhaseId, ThemeId>;
  lastPhase?: PhaseId;
  setTheme: (phaseId: PhaseId, themeId: ThemeId) => void;
  rememberPhase: (phaseId: PhaseId) => void;
};

export const useThemeChoice = create<ThemeChoice>()(
  persist(
    (set) => ({
      byPhase: {},
      setTheme: (phaseId, themeId) => set((s) => ({ byPhase: { ...s.byPhase, [phaseId]: themeId } })),
      rememberPhase: (lastPhase) => set({ lastPhase }),
    }),
    {
      name: "pulse-view",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ byPhase: s.byPhase, lastPhase: s.lastPhase }),
      // rehydrated from the Stage after mount, like the menu drafts
      skipHydration: true,
    },
  ),
);

/** The phase's chosen theme id, or its default. */
export const themeIdFor = (byPhase: Record<PhaseId, ThemeId>, phaseId: PhaseId): ThemeId =>
  getTheme(phaseId, byPhase[phaseId]).id;

export const activeThemeId = (phaseId: PhaseId): ThemeId => themeIdFor(useThemeChoice.getState().byPhase, phaseId);
