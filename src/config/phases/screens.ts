import type { MobileRegistry, PhaseId, PhaseScreens, TabletRegistry, ThemeId } from "@/config/types";
import { screens as phase1 } from "./phase-1/screens";
import { screens as phase2 } from "./phase-2/screens";

/**
 * Screen components per phase. Kept apart from ./index.ts (plain data) so the sim
 * engine can read phase config without pulling in React UI.
 */
const PHASE_SCREENS: Record<PhaseId, PhaseScreens> = {
  "1.0": phase1,
  "2.0": phase2,
};

/** Phase registry with the theme's swaps on top. */
export function registryFor(device: "mobile", phaseId: PhaseId, themeId: ThemeId): MobileRegistry;
export function registryFor(device: "tablet", phaseId: PhaseId, themeId: ThemeId): TabletRegistry;
export function registryFor(device: "mobile" | "tablet", phaseId: PhaseId, themeId: ThemeId) {
  const phase = PHASE_SCREENS[phaseId] ?? phase1;
  return { ...phase[device], ...phase.themes?.[themeId]?.[device] };
}
