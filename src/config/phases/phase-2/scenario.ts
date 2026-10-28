import { DEFAULT_TABLE_ID } from "@/config/global";
import { withDish, type Step } from "@/engine/scenario";

/** Phase 2.0: the waiter rings an order through the full-screen POS page. */
export const SCENARIO: Step[] = [
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
    id: "p2-3a",
    title: "Waiter opens Drinks",
    actor: "waiter",
    expect: "Drinks has subcategories, so it opens its own page: Hot and Ice tiles, Hot drinks listed",
    event: { type: "waiter/pos-open-category", categoryId: "beverages" },
  },
  {
    id: "p2-3b",
    title: "Waiter switches to Ice",
    actor: "waiter",
    expect: "The dish list swaps to the eight iced drinks",
    event: { type: "waiter/pos-pick-subcategory", subcategoryId: "ice" },
  },
  {
    id: "p2-3c",
    title: "Waiter adds an Iced Lemon Tea, less sugar",
    actor: "waiter",
    expect: "Order Bucket lists the drink with its sugar, ice and size picks",
    event: (_state, { menu }) =>
      withDish(menu, "p-lemon-tea", 1, (line) => ({
        type: "waiter/add-to-cart",
        tableId: DEFAULT_TABLE_ID,
        // same shape the option sheet saves, so the bucket line shows the picks and reopens on Edit
        line: {
          ...line,
          modifiers: ["Sugar less", "Ice level normal", "Regular"],
          choices: [
            {
              qty: 1,
              mods: [
                { name: "Sugar less", qty: 1 },
                { name: "Ice level normal", qty: 1 },
                { name: "Regular", qty: 1 },
              ],
            },
          ],
          edit: { sheet: { picks: { sugar: ["less"], ice: ["normal"], size: ["regular"] }, counts: {}, qty: 1, notes: "" } },
        },
      })),
  },
  {
    id: "p2-3d",
    title: "Waiter goes back and opens Classic Wok Dishes",
    actor: "waiter",
    expect: "No subcategories here: the dishes expand inline under the category grid",
    event: { type: "waiter/pos-open-category", categoryId: "classic-wok-dishes" },
  },
  {
    id: "p2-4",
    title: "Waiter adds two dumplings to the bucket",
    actor: "waiter",
    expect: "Order Bucket lists the dish and the subtotal updates",
    event: (_state, { menu }) =>
      withDish(menu, "d1", 2, (line) => ({ type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line })),
  },
  {
    id: "p2-5",
    title: "Waiter adds a rice roll",
    actor: "waiter",
    event: (_state, { menu }) =>
      withDish(menu, "d2", 1, (line) => ({ type: "waiter/add-to-cart", tableId: DEFAULT_TABLE_ID, line })),
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
