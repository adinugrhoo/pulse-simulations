"use client";

import { useSim } from "@/engine/store";
import { useThemeId } from "@/theme/hooks";
import { resolveLayers } from "./active";
import { layerKey } from "./layers";
import { globalOf, patchOf, useMenuStore } from "./store";
import type { ResolvedMenu } from "./types";

/** The menu for the phase + theme on screen. Re-renders when the Menu Studio edits any of its layers. */
export const useMenu = (): ResolvedMenu => {
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  const base = useMenuStore(globalOf);
  const phasePatch = useMenuStore((s) => patchOf(s, layerKey(phase)));
  const themePatch = useMenuStore((s) => patchOf(s, layerKey(phase, themeId)));
  return resolveLayers([base, phasePatch, themePatch]);
};
