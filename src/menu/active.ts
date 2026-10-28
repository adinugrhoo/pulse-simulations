import type { PhaseId, ThemeId } from "@/config/phases";
import { activeThemeId } from "@/theme/store";
import { chainTo, layerKey } from "./layers";
import { composeMenu, resolveMenu } from "./resolve";
import { globalOf, patchOf, useMenuStore } from "./store";
import type { MenuData, MenuPatch, ResolvedMenu } from "./types";

type Inputs = [MenuData, ...MenuPatch[]];

/** Resolving is cheap but not free; reuse the last result while its layers are unchanged. */
let last: { inputs: Inputs; menu: ResolvedMenu } | undefined;

export const resolveLayers = (inputs: Inputs): ResolvedMenu => {
  if (last && last.inputs.length === inputs.length && last.inputs.every((x, i) => x === inputs[i])) return last.menu;
  const [base, ...patches] = inputs;
  const menu = resolveMenu(composeMenu(base, patches));
  last = { inputs, menu };
  return menu;
};

/** Layer contents, global first, that make up a phase + theme's menu. */
const layerInputs = (phaseId: PhaseId, themeId: ThemeId): Inputs => {
  const s = useMenuStore.getState();
  const [, ...below] = chainTo(layerKey(phaseId, themeId));
  return [globalOf(s), ...below.map((k) => patchOf(s, k))];
};

/** The menu the devices show right now for a phase (outside React: engine, scenario steps). */
export const getActiveMenu = (phaseId: PhaseId): ResolvedMenu =>
  resolveLayers(layerInputs(phaseId, activeThemeId(phaseId)));
