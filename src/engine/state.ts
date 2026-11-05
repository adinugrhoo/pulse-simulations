import type { MobileScreenId, TabletScreenId } from "./screens";
import { DEFAULT_TABLE_ID } from "@/config/global";
import { DEFAULT_PHASE, getPhase, type PaymentMode, type PhaseId, type QrType } from "@/config/phases";
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

/** What the Adyen terminal shows in payment mode "terminal": idle keypad, then the SmartPay card flow. */
export type TerminalScreen = "idle" | "processing" | "tap-card" | "done" | "success";

/** QR wallets the terminal offers next to the card reader. */
export type TerminalQrOption = "grabpay" | "paynow" | "wechat";

export type TerminalState = {
  screen: TerminalScreen;
  /** The table being charged and the amount due on it, set when the waiter picks SmartPay Terminal. */
  tableId?: string;
  amount?: number;
  /** What settles on the table once the payment goes through (the whole bill, not just the balance). */
  settleAmount?: number;
  /** The "Select QR Code" sheet is open over the card reader. */
  qrMenu?: boolean;
  /** The wallet picked from that sheet: the terminal shows its QR instead of waiting for a card. */
  qrOption?: TerminalQrOption;
  /** Bumped on every new payment so a stale timer from an earlier run never moves the screen. */
  run: number;
  paidAt?: string;
  paymentId?: string;
};

export type SimState = {
  /** Which build phase's scenario the stepper runs. Survives reset. */
  phase: PhaseId;
  /** Static or dynamic QR flow; picks which scenario the stepper runs. Survives reset. */
  qrType: QrType;
  /** Same device (pay on the tablet) or a payment terminal in place of the customer phone. Survives reset. */
  paymentMode: PaymentMode;
  /** Monotonic counter — stands in for wall-clock so replays stay deterministic. */
  tick: number;
  tables: Table[];
  orders: Order[];
  customer: CustomerSession;
  waiter: WaiterSession;
  screens: { mobile: MobileScreenId; tablet: TabletScreenId };
  signals: Signal[];
  /** The open-table QR receipt being printed on the tablet; cleared once the overlay is done. */
  qrPrint?: { id: string; tableLabel: string; guests?: number };
  terminal: TerminalState;
  log: LogEntry[];
  stepIndex: number;
};

export const initialState = (
  phase: PhaseId = DEFAULT_PHASE,
  qrType: QrType = "static",
  paymentMode: PaymentMode = "same-device",
): SimState => {
  const tables = getPhase(phase).seedTables();
  return {
    phase,
    qrType,
    paymentMode,
    tick: 0,
    tables,
    // every table already carrying a bill gets the items behind it, from the menu on screen
    orders: seedOrders(tables, getActiveMenu(phase).mobileDishes),
    customer: { tableId: DEFAULT_TABLE_ID, loggedIn: false, cart: [] },
    waiter: { cart: [] },
    screens: { mobile: "login", tablet: "tables" },
    signals: [],
    qrPrint: undefined,
    terminal: { screen: "idle", run: 0 },
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
