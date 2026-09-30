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
import { DEFAULT_TABLE_ID, SEED_MENU, SEED_TABLES } from "./seed";

export type LogEntry = {
  tick: number;
  actor: "customer" | "waiter" | "system";
  label: string;
  event: SimEvent;
};

export type SimState = {
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

export const initialState = (): SimState => ({
  tick: 0,
  menu: SEED_MENU,
  tables: SEED_TABLES.map((t) => ({ ...t })),
  orders: [],
  customer: { tableId: DEFAULT_TABLE_ID, loggedIn: false, cart: [] },
  waiter: { cart: [] },
  screens: { mobile: "login", tablet: "tables" },
  signals: [],
  log: [],
  stepIndex: -1,
});

export const actorOf = (type: SimEvent["type"]): LogEntry["actor"] =>
  type.startsWith("customer/")
    ? "customer"
    : type.startsWith("waiter/")
      ? "waiter"
      : "system";
