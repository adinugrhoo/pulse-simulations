import { GLOBAL_CONFIG } from "@/config/global";
import type { PhaseConfig, PhaseId, ThemeConfig, ThemeId } from "@/config/types";
import { phase as phase1 } from "./phase-1";
import { phase as phase2 } from "./phase-2";

/**
 * Every phase, in header order. Adding a phase = copy a phase folder, give it a new id,
 * list it here and in ./screens.ts.
 */
export const PHASES: PhaseConfig[] = [phase1, phase2];

export const DEFAULT_PHASE: PhaseId = GLOBAL_CONFIG.defaultPhase;

export const getPhase = (id: PhaseId): PhaseConfig => PHASES.find((p) => p.id === id) ?? PHASES[0];

/** A phase's theme; an unknown id falls back to the phase default. */
export const getTheme = (phaseId: PhaseId, themeId?: ThemeId): ThemeConfig => {
  const phase = getPhase(phaseId);
  return (
    phase.themes.find((t) => t.id === themeId) ??
    phase.themes.find((t) => t.id === phase.defaultTheme) ??
    phase.themes[0]
  );
};

export type { PhaseConfig, PhaseId, ThemeConfig, ThemeId };
