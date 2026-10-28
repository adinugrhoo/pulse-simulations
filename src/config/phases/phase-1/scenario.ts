import { DEFAULT_TABLE_ID } from "@/config/global";
import { withDish, type Step } from "@/engine/scenario";

/** Phase 1.0 happy-path script. Extend as each Figma screen is wired in. */
export const SCENARIO: Step[] = [
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
    event: (_state, { menu }) =>
      withDish(menu, "m3", 1, (line) => ({ type: "customer/add-to-cart", line })),
  },
  {
    id: "s3",
    title: "Customer adds Iced Latte",
    actor: "customer",
    event: (_state, { menu }) =>
      withDish(menu, "m7", 2, (line) => ({ type: "customer/add-to-cart", line })),
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
    event: (_state, { menu }) =>
      withDish(menu, "m6", 1, (line) => ({ type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line })),
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
