import type { DeviceId } from "./devices";

export type { DeviceId };

/* ---------------------------------- menu --------------------------------- */

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
};

export type CartLine = {
  lineId: string;
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  notes?: string;
  modifiers?: string[];
};

/* --------------------------------- orders -------------------------------- */

export type OrderSource = "customer" | "waiter";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "preparing"
  | "served"
  | "paid"
  | "rejected";

export type Order = {
  id: string;
  tableId: string;
  source: OrderSource;
  status: OrderStatus;
  lines: CartLine[];
  /** Sequence number of the sim tick that created it — no wall-clock, keeps runs reproducible. */
  placedAtTick: number;
  total: number;
};

/* --------------------------------- tables -------------------------------- */

export type TableStatus = "vacant" | "allocated" | "occupied" | "partial" | "billed";

export type Table = {
  id: string;
  label: string;
  status: TableStatus;
  guestName?: string;
  guests?: number;
  seatedMinutes?: number;
  totalBill?: number;
  paidBill?: number;
  /** Set only while status is "partial" — the remainder still owed. */
  balance?: number;
  /** Customer tapped "request bill" on mobile; tablet surfaces it. */
  billRequested?: boolean;
  /** Customer tapped "call waiter"; cleared once the waiter opens the table. */
  assistanceRequested?: boolean;
  /** Tick of the most recent full payment — TableCard blinks once when this changes. */
  paidAtTick?: number;
};

/* -------------------------------- session -------------------------------- */

/** Snapshot taken at the moment of payment — the payment-success screen reads this, not live cart/order state. */
export type Receipt = {
  orderId: string;
  queueNumber: string;
  tableLabel: string;
  amount: number;
  lines: CartLine[];
  paidAtTick: number;
};

export type CustomerSession = {
  tableId?: string;
  guestName?: string;
  loggedIn: boolean;
  cart: CartLine[];
  selectedItemId?: string;
  lastReceipt?: Receipt;
};

export type WaiterSession = {
  selectedTableId?: string;
  selectedOrderId?: string;
  cart: CartLine[];
};

/* -------------------------------- signals -------------------------------- */

/** Ephemeral cross-device signal: customer taps something, tablet flashes a badge. */
export type Signal = {
  id: string;
  device: DeviceId;
  kind: "info" | "success" | "alert";
  title: string;
  body?: string;
  tick: number;
};

export const currency = (value: number) =>
  `SGD${value.toFixed(2)}`;
