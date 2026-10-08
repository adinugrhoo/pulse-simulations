import type { MobileScreenId, TabletScreenId } from "./screens";
import type {
  CustomerSession,
  MenuItem,
  Order,
  Signal,
  Table,
  WaiterSession,
} from "./types";
import type { SimEvent } from "./events";
import { DEFAULT_PHASE, type PhaseId } from "./phases";
import {
  DEFAULT_TABLE_ID,
  SEED_MENU,
  SEED_TABLES,
  seedOrders,
  seedTablesV2,
} from "./seed";

export type LogEntry = {
  tick: number;
  actor: "customer" | "waiter" | "system";
  label: string;
  event: SimEvent;
};

export type SimState = {
  /** Which build phase's scenario the stepper runs. Survives reset. */
  phase: PhaseId;
  /** Monotonic counter — stands in for wall-clock so replays stay deterministic. */
  tick: number;
  menu: MenuItem[];
  tables: Table[];
  orders: Order[];
  customer: CustomerSession;
  waiter: WaiterSession;
  screens: { mobile: MobileScreenId; tablet: TabletScreenId };
  signals: Signal[];
  log: LogEntry[];
  stepIndex: number;
};

export const initialState = (phase: PhaseId = DEFAULT_PHASE): SimState => {
  // Phase 2.0 runs on the sectioned floor; Phase 1.0 keeps the 15-table plan
  const tables =
    phase === "2.0" ? seedTablesV2() : SEED_TABLES.map((t) => ({ ...t }));
  return {
    phase,
    tick: 0,
    menu: SEED_MENU,
    tables,
    // every table already carrying a bill gets the items behind it
    orders: seedOrders(tables),
    customer: { tableId: DEFAULT_TABLE_ID, loggedIn: false, cart: [] },
    waiter: { cart: [] },
    screens: { mobile: "login", tablet: "tables" },
    signals: [],
    log: [],
    stepIndex: -1,
  };
};

export const actorOf = (type: SimEvent["type"]): LogEntry["actor"] =>
  type.startsWith("customer/")
    ? "customer"
    : type.startsWith("waiter/")
      ? "waiter"
      : "system";
