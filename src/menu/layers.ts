import { BASE_MENU } from "@/config/global";
import { PHASES, type PhaseId, type ThemeId } from "@/config/phases";
import type { MenuData, MenuPatch } from "./types";

/**
 * Layer keys: "global", a phase ("2.0"), or a theme inside it ("2.0/dark").
 * The menu a device renders stacks global, then its phase, then its theme.
 */
export type LayerKey = string;

export const GLOBAL_LAYER: LayerKey = "global";

export const layerKey = (phaseId?: PhaseId, themeId?: ThemeId): LayerKey =>
  !phaseId ? GLOBAL_LAYER : themeId ? `${phaseId}/${themeId}` : phaseId;

/** Layers from global down to the given one, inclusive. */
export const chainTo = (key: LayerKey): LayerKey[] => {
  if (key === GLOBAL_LAYER) return [GLOBAL_LAYER];
  const [phaseId, themeId] = key.split("/");
  return themeId ? [GLOBAL_LAYER, phaseId, key] : [GLOBAL_LAYER, phaseId];
};

export type LayerInfo = {
  key: LayerKey;
  level: "global" | "phase" | "theme";
  label: string;
  phaseId?: PhaseId;
  themeId?: ThemeId;
};

/** Every editable layer, in tree order: Global, Phase 1.0, Phase 1.0 › Default, Phase 2.0, … */
export const LAYERS: LayerInfo[] = [
  { key: GLOBAL_LAYER, level: "global", label: "Global" },
  ...PHASES.flatMap((p) => [
    { key: layerKey(p.id), level: "phase" as const, label: p.label, phaseId: p.id },
    ...p.themes.map((t) => ({
      key: layerKey(p.id, t.id),
      level: "theme" as const,
      label: `${p.label} › ${t.label}`,
      phaseId: p.id,
      themeId: t.id,
    })),
  ]),
];

/** Layer contents as committed in the config folders. */
export const FILE_LAYERS: { global: MenuData; patches: Record<LayerKey, MenuPatch> } = {
  global: BASE_MENU,
  patches: Object.fromEntries(
    PHASES.flatMap((p) => [
      [layerKey(p.id), p.menu],
      ...p.themes.map((t) => [layerKey(p.id, t.id), t.menu] as const),
    ]),
  ),
};
