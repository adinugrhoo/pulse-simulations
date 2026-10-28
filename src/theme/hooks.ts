"use client";

import { getPhase, getTheme, type PhaseConfig, type ThemeConfig } from "@/config/phases";
import { useSim } from "@/engine/store";
import type { MobileTokens, TabletTokens } from "./tokens";
import { themeIdFor, useThemeChoice } from "./store";

export const usePhaseConfig = (): PhaseConfig => getPhase(useSim((s) => s.phase));

export const useThemeId = () => {
  const phase = useSim((s) => s.phase);
  return useThemeChoice((s) => themeIdFor(s.byPhase, phase));
};

export const useThemeConfig = (): ThemeConfig => {
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  return getTheme(phase, themeId);
};

export function useTokens(device: "mobile"): MobileTokens;
export function useTokens(device: "tablet"): TabletTokens;
export function useTokens(device: "mobile" | "tablet") {
  return useThemeConfig()[device].tokens;
}
