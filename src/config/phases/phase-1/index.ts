import type { PhaseConfig } from "@/config/types";
import { seedTablesV1 } from "@/engine/seed";
import type { MenuPatch } from "@/menu/types";
import menu from "./menu.json";
import { SCENARIO } from "./scenario";
import { theme as defaultTheme } from "./themes/default";

/** Phase 1.0: customer orders and pays from the phone; the waiter watches the 15-table floor. */
export const phase: PhaseConfig = {
  id: "1.0",
  folder: "phase-1",
  label: "Phase 1.0",
  chip: "Design Ready",
  tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  features: { floor: "plan", splitBill: false },
  seedTables: seedTablesV1,
  scenario: SCENARIO,
  menu: menu as MenuPatch,
  themes: [defaultTheme],
  defaultTheme: "default",
};
