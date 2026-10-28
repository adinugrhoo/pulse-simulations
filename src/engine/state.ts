import type { MobileScreenId, TabletScreenId } from "./screens";
import { DEFAULT_TABLE_ID } from "@/config/global";
import { DEFAULT_PHASE, getPhase, type PhaseId } from "@/config/phases";
import { getActiveMenu } from "@/menu/active";
import type { CustomerSession, Order, Signal, Table, WaiterSession } from "./types";
import type { SimEvent } from "./events";
import { seedOrders } from "./seed";

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
  const tables = getPhase(phase).seedTables();
  return {
    phase,
    tick: 0,
    tables,
    // every table already carrying a bill gets the items behind it, from the menu on screen
    orders: seedOrders(tables, getActiveMenu(phase).mobileDishes),
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
