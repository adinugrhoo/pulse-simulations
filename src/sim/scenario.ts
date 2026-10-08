import type { SimEvent } from "./events";
import type { SimState } from "./state";
import type { PhaseId } from "./phases";
import { DEFAULT_TABLE_ID, SEED_MENU } from "./seed";
import { MENU_CATALOG } from "./menuCatalog";

export type Step = {
  id: string;
  title: string;
  actor: "customer" | "waiter";
  /** What the viewer should watch for on the *other* device. */
  expect?: string;
  /** A function form lets a step read live state (e.g. the id of the order just placed). */
  event: SimEvent | ((state: SimState) => SimEvent | null);
};

const item = (id: string, qty = 1) => {
  const m = SEED_MENU.find((x) => x.id === id)!;
  return { itemId: m.id, name: m.name, unitPrice: m.price, qty };
};

/** Phase 1.0 happy-path script. Extend as each Figma screen is wired in. */
const SCENARIO_1: Step[] = [
  {
    id: "s1",
    title: "Customer logs in",
    actor: "customer",
    expect: "Tablet shows the table as occupied with the guest name",
    event: { type: "customer/login", guestName: "Adi", guests: 2 },
  },
  {
    id: "s2",
    title: "Customer adds Berczy Burger",
    actor: "customer",
    event: { type: "customer/add-to-cart", line: item("m3") },
  },
  {
    id: "s3",
    title: "Customer adds Iced Latte",
    actor: "customer",
    event: { type: "customer/add-to-cart", line: item("m7", 2) },
  },
  {
    id: "s4",
    title: "Customer reviews the cart",
    actor: "customer",
    event: { type: "customer/open-cart" },
  },
  {
    id: "s5",
    title: "Customer submits the order",
    actor: "customer",
    expect: "Tablet raises a new-order signal and opens the order detail",
    event: { type: "customer/submit-order" },
  },
  {
    id: "s6",
    title: "Waiter accepts the order",
    actor: "waiter",
    expect: "Mobile order status flips to accepted",
    event: (state) => {
      const latest = state.orders[0];
      return latest ? { type: "waiter/set-order-status", orderId: latest.id, status: "accepted" } : null;
    },
  },
  {
    id: "s7",
    title: "Waiter adds a dessert for the table",
    actor: "waiter",
    expect: "Mobile sees the waiter-added line",
    event: { type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line: item("m6") },
  },
  {
    id: "s8",
    title: "Waiter fires the waiter-side order",
    actor: "waiter",
    event: { type: "waiter/submit-order", tableId: DEFAULT_TABLE_ID },
  },
  {
    id: "s9",
    title: "Customer requests the bill",
    actor: "customer",
    expect: "Customer sees the bill; the tablet stays on the floor",
    event: { type: "customer/request-bill" },
  },
  {
    id: "s10",
    title: "Customer pays the bill in full",
    actor: "customer",
    expect: "Tablet's table card turns green and blinks a few times",
    event: { type: "customer/pay-bill" },
  },
];

const dish = (id: string, qty = 1) => {
  const d = MENU_CATALOG.find((x) => x.id === id)!;
  return { itemId: d.id, name: d.name, unitPrice: d.price, qty };
};

/** Phase 2.0: the waiter rings an order through the full-screen POS page. */
const SCENARIO_2: Step[] = [
  {
    id: "p2-1",
    title: "Customer is seated and logs in",
    actor: "customer",
    expect: "Tablet shows the table as open with the guest name",
    event: { type: "customer/login", guestName: "Adi", guests: 2 },
  },
  {
    id: "p2-2",
    title: "Waiter opens the table",
    actor: "waiter",
    expect: "Order detail dialog opens over the floor plan",
    event: { type: "waiter/select-table", tableId: DEFAULT_TABLE_ID },
  },
  {
    id: "p2-3",
    title: "Waiter taps Add Order",
    actor: "waiter",
    expect: "Tablet goes full screen on the POS order page",
    event: { type: "waiter/open-pos", tableId: DEFAULT_TABLE_ID },
  },
  {
    id: "p2-4",
    title: "Waiter adds two dumplings to the bucket",
    actor: "waiter",
    expect: "Order Bucket lists the dish and the subtotal updates",
    event: { type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line: dish("d1", 2) },
  },
  {
    id: "p2-5",
    title: "Waiter adds a rice roll",
    actor: "waiter",
    event: { type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line: dish("d2") },
  },
  {
    id: "p2-6",
    title: "Waiter confirms the order",
    actor: "waiter",
    expect: "Back on the table detail with the items listed; mobile sees the waiter-added order",
    event: { type: "waiter/submit-order", tableId: DEFAULT_TABLE_ID },
  },
  {
    id: "p2-7",
    title: "Customer taps View and Pay Bill",
    actor: "customer",
    expect: "Phone checks the orders, then shows the bill with the Split the Bill card",
    event: { type: "customer/request-bill" },
  },
];

export const SCENARIOS: Record<PhaseId, Step[]> = {
  "1.0": SCENARIO_1,
  "2.0": SCENARIO_2,
};

export const resolveStepEvent = (step: Step, state: SimState): SimEvent | null =>
  typeof step.event === "function" ? step.event(state) : step.event;
