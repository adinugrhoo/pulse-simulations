import type { PhaseConfig } from "@/config/types";
import { seedTablesV2 } from "@/engine/seed";
import type { MenuPatch } from "@/menu/types";
import menu from "./menu.json";
import { SCENARIO } from "./scenario";
import { theme as dark } from "./themes/dark";
import { theme as foodpanda } from "./themes/foodpanda";
import { theme as light } from "./themes/light";

/** Phase 2.0: sectioned floor, the waiter POS and the customer's split bill. */
export const phase: PhaseConfig = {
  id: "2.0",
  folder: "phase-2",
  label: "Phase 2.0",
  chip: "Ongoing",
  tone: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  features: { floor: "sections", splitBill: true },
  seedTables: seedTablesV2,
  scenario: SCENARIO,
  menu: menu as MenuPatch,
  themes: [dark, light, foodpanda],
  defaultTheme: "dark",
};
