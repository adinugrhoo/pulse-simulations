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

/** One level-2 pick on a cart line (Drink: Latte) with its level-3 modifiers (Iced, 2x Fried Egg). */
export type CartChoice = {
  /** Combo group the pick belongs to; unset on a single dish's own modifiers. */
  label?: string;
  /** Unset on a single dish, where the modifiers sit directly under the dish name. */
  name?: string;
  qty: number;
  mods: { name: string; qty: number }[];
  notes?: string;
};

/** Option-sheet state, kept on the line so tapping it in the bucket can reopen the sheet as it was. */
export type SheetSnap = {
  picks: Record<string, string[]>;
  counts: Record<string, number>;
  qty: number;
  notes: string;
};

/** A combo group's pick as the POS builds it. */
export type PosChosen = {
  optionId: string;
  name: string;
  /** Price of the pick, options and quantity included. */
  price: number;
  qty: number;
  /** One line per second-level pick: "Iced", "Almond Milk", "Ice level normal"... */
  lines: string[];
  /** The same picks with their stack counts, for the bucket's modifier level. */
  mods: { name: string; qty: number }[];
  notes?: string;
  /** Sheet state behind the pick, when it came from an option sheet. */
  snap?: SheetSnap;
};

/** What the POS needs to reopen a bucket line for editing; set only on dishes with modifiers or combos. */
export type CartEdit = {
  sheet?: SheetSnap;
  combo?: { selected: Record<string, PosChosen>; notes: string };
};

export type CartLine = {
  lineId: string;
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  notes?: string;
  modifiers?: string[];
  /** Structured form of `modifiers` for the bucket's three-level display. */
  choices?: CartChoice[];
  edit?: CartEdit;
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

/** One payment taken against a table's bill; a table can collect several (split, part-pay, cash top-up). */
export type Payment = {
  id: string;
  /** "Visa" for the customer's phone, "Cash" when the waiter collects. */
  method: string;
  amount: number;
  guest: string;
  splitType: "Full" | "Custom";
  /** Cash only: what the customer handed over, change excluded. */
  tendered?: number;
  /** Wall-clock HH:MM:SS the payment landed. */
  time: string;
};

export type Table = {
  id: string;
  label: string;
  /** Floor section id (Phase 2.0 table management); unset on the Phase 1.0 floor plan. */
  section?: string;
  status: TableStatus;
  guestName?: string;
  guests?: number;
  /** Guest contact captured when the waiter opened the table, country code included. */
  phone?: string;
  seatedMinutes?: number;
  totalBill?: number;
  paidBill?: number;
  /** Every payment collected on this bill, oldest first. Seeded paid tables have none. */
  payments?: Payment[];
  /** Gratuity already collected on a partially paid bill; surfaced in the order detail. */
  tips?: number;
  /** Set when the customer paid more than the bill; the amount to hand back before the table closes. */
  overpaid?: number;
  /** Set only while status is "partial" — the remainder still owed. */
  balance?: number;
  /** Customer tapped "request bill" on mobile; tablet surfaces it. */
  billRequested?: boolean;
  /** Customer tapped "call waiter"; cleared once the waiter opens the table. */
  assistanceRequested?: boolean;
  /** Vacant tables only: the party that just paid and left, kept as a hint on the floor card and the open sheet. */
  lastSession?: { paidBill: number; minutesAgo: number };
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

/** How the customer chose to split the bill (Phase 2.0): what they pay now, before the platform fee. */
export type SplitPlan = {
  mode: "equal" | "custom";
  /** Equal split: people at the table. */
  people: number;
  /** Equal split: how many of those shares this customer pays. */
  payingFor: number;
  name: string;
  share: number;
};

/** Snapshot of a partial payment, read by the processing and partial-success screens. */
export type PartialReceipt = {
  orderId: string;
  tableLabel: string;
  items: number;
  grand: number;
  share: number;
  fee: number;
  /** Paid on the table so far, this share included. */
  paid: number;
  balance: number;
  lines: CartLine[];
  tick: number;
};

export type CustomerSession = {
  tableId?: string;
  guestName?: string;
  loggedIn: boolean;
  cart: CartLine[];
  selectedItemId?: string;
  lastReceipt?: Receipt;
  split?: SplitPlan;
  lastPartial?: PartialReceipt;
};

export type WaiterSession = {
  selectedTableId?: string;
  /** Table whose order-detail dialog is open over the floor plan; survives a trip to the POS screen. */
  openTableId?: string;
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
