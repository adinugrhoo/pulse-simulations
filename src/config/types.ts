import type { ComponentType } from "react";
import type { Step } from "@/engine/scenario";
import type { MobileScreenId, TabletScreenId } from "@/engine/screens";
import type { Table } from "@/engine/types";
import type { MenuPatch } from "@/menu/types";
import type { MobileTokens, TabletTokens } from "@/theme/tokens";

/**
 * Config contracts. The folder tree mirrors them:
 *
 *   config/global/                          GLOBAL_CONFIG, base menu, floor, modifiers
 *   config/phases/<phase>/index.ts          PhaseConfig
 *   config/phases/<phase>/themes/<theme>/   ThemeConfig (+ mobile/ and tablet/ folders)
 *
 * Everything in a PhaseConfig/ThemeConfig is plain data. Screen components are wired
 * separately in each phase's `screens.ts` so the sim engine never imports React UI.
 */

export type PhaseId = string;
export type ThemeId = string;

/** Behaviour switches a phase turns on; screens and triggers read these, never the phase id. */
export type PhaseFeatures = {
  /** "plan" = the 15-table Pulse floor, "sections" = the 25-section floor with the sidebar. */
  floor: "plan" | "sections";
  /** Customer bill goes through the loading screen and offers Split the Bill. */
  splitBill: boolean;
};

export type ThemeConfig = {
  id: ThemeId;
  label: string;
  /** Short tag next to the label in the header picker. */
  chip: string;
  description?: string;
  /** Menu changes for this theme only (see config/phases/<phase>/themes/<theme>/menu.json). */
  menu: MenuPatch;
  mobile: { tokens: MobileTokens };
  tablet: { tokens: TabletTokens };
};

export type PhaseConfig = {
  id: PhaseId;
  /** Folder name under config/phases (the Menu Studio writes this phase's menu.json there). */
  folder: string;
  label: string;
  chip: string;
  /** Tailwind classes for the chip. */
  tone: string;
  features: PhaseFeatures;
  /** Fresh floor for a reset. */
  seedTables: () => Table[];
  /** The scripted steps the header stepper runs. */
  scenario: Step[];
  /** Menu changes for the whole phase (config/phases/<phase>/menu.json). */
  menu: MenuPatch;
  themes: ThemeConfig[];
  defaultTheme: ThemeId;
};

export type MobileRegistry = Record<MobileScreenId, ComponentType>;
export type TabletRegistry = Record<TabletScreenId, ComponentType>;

/** A theme's `mobile/screens.ts` / `tablet/screens.ts`: screens it swaps for its own. */
export type ThemeScreens = { mobile?: Partial<MobileRegistry>; tablet?: Partial<TabletRegistry> };

/** A phase's `screens.ts`: the full registry for both devices, plus per-theme swaps. */
export type PhaseScreens = {
  mobile: MobileRegistry;
  tablet: TabletRegistry;
  themes?: Record<ThemeId, ThemeScreens>;
};
