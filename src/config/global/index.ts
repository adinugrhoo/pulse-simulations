import menu from "./menu.json";
import type { MenuData } from "@/menu/types";

/**
 * Global layer: settings every phase and theme inherits.
 * Phase-specific values live in config/phases/<phase>/index.ts.
 */
export const GLOBAL_CONFIG = {
  appName: "Pulse Simulations",
  /** Prefix for every price the sim prints. */
  currency: "SGD",
  /** Phase the page opens on. */
  defaultPhase: "1.0",
} as const;

/** Base menu: every dish and both devices' category lists. Edit it in the Menu Studio or by hand. */
export const BASE_MENU = menu as MenuData;

export { DEVICES, type DeviceId, type DeviceSpec } from "./devices";
export { DEFAULT_TABLE_ID, SEED_TABLES } from "./floor";
export { SECTIONS, rangeLabel, tableLabel, type SectionDef } from "./sections";
