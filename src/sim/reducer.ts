import { produce } from "immer";
import type { SimEvent } from "./events";
import type { SimState } from "./state";
import type { CartLine, Order, Signal, Table } from "./types";

const lineTotal = (l: CartLine) => l.unitPrice * l.qty;
const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0);

const tableOf = (draft: SimState, tableId?: string): Table | undefined =>
  draft.tables.find((t) => t.id === tableId);

/** Open bill = everything ordered on that table that has not been settled. */
const recalcTableBill = (draft: SimState, tableId: string) => {
  const table = tableOf(draft, tableId);
  if (!table) return;
  const open = draft.orders.filter(
    (o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid",
  );
  table.totalBill = open.length ? open.reduce((s, o) => s + o.total, 0) : undefined;
};

const signal = (draft: SimState, s: Omit<Signal, "id" | "tick">) => {
  draft.signals.unshift({ ...s, id: `sig-${draft.tick}`, tick: draft.tick });
  draft.signals = draft.signals.slice(0, 12);
};

/**
 * Pure domain transition. Navigation lives in triggers.ts so the "customer does X,
 * tablet shows Y" wiring stays editable in one file.
 */
export const reduce = (state: SimState, event: SimEvent): SimState =>
  produce(state, (draft) => {
    draft.tick += 1;

    switch (event.type) {
      case "customer/scan-qr": {
        draft.customer.tableId = event.tableId;
        const table = tableOf(draft, event.tableId);
        if (table && table.status === "vacant") table.status = "allocated";
        break;
      }

      case "customer/login": {
        draft.customer.loggedIn = true;
        draft.customer.guestName = event.guestName;
        const table = tableOf(draft, draft.customer.tableId);
        if (table) {
          table.status = "occupied";
          table.guestName = event.guestName;
          table.guests = event.guests;
          table.seatedMinutes = 0;
        }
        break;
      }

      case "customer/open-item": {
        draft.customer.selectedItemId = event.itemId;
        break;
      }

      case "customer/add-to-cart": {
        draft.customer.cart.push({ ...event.line, lineId: `cl-${draft.tick}` });
        break;
      }

      case "customer/remove-from-cart": {
        draft.customer.cart = draft.customer.cart.filter((l) => l.lineId !== event.lineId);
        break;
      }

      case "customer/increment-cart-line": {
        const line = draft.customer.cart.find((l) => l.lineId === event.lineId);
        if (line) line.qty += 1;
        break;
      }

      case "customer/decrement-cart-line": {
        const line = draft.customer.cart.find((l) => l.lineId === event.lineId);
        if (line) {
          line.qty -= 1;
          if (line.qty <= 0) {
            draft.customer.cart = draft.customer.cart.filter((l) => l.lineId !== event.lineId);
          }
        }
        break;
      }

      case "customer/open-cart":
        break;

      case "customer/submit-order": {
        const tableId = draft.customer.tableId;
        if (!tableId || draft.customer.cart.length === 0) break;
        const order: Order = {
          id: `ord-${draft.tick}`,
          tableId,
          source: "customer",
          status: "submitted",
          lines: draft.customer.cart,
          placedAtTick: draft.tick,
          total: cartTotal(draft.customer.cart),
        };
        draft.orders.unshift(order);
        draft.customer.cart = [];
        draft.waiter.selectedOrderId = order.id;
        recalcTableBill(draft, tableId);
        signal(draft, {
          device: "tablet",
          kind: "success",
          title: `New order · ${tableOf(draft, tableId)?.label ?? tableId}`,
          body: `${order.lines.length} item(s) · ${order.total.toFixed(2)}`,
        });
        break;
      }

      case "customer/call-waiter": {
        const table = tableOf(draft, draft.customer.tableId);
        if (table) table.assistanceRequested = true;
        signal(draft, {
          device: "tablet",
          kind: "alert",
          title: `Assistance · ${table?.label ?? "table"}`,
          body: event.reason,
        });
        break;
      }

      case "customer/request-bill": {
        const table = tableOf(draft, draft.customer.tableId);
        if (table) table.billRequested = true;
        signal(draft, {
          device: "tablet",
          kind: "alert",
          title: `Bill requested · ${table?.label ?? "table"}`,
        });
        break;
      }

      case "customer/pay-bill": {
        const tableId = draft.customer.tableId;
        const table = tableOf(draft, tableId);
        if (!table || !tableId) break;
        const tableOrders = draft.orders.filter(
          (o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid",
        );
        const amount = table.totalBill ?? tableOrders.reduce((s, o) => s + o.total, 0);

        table.status = "billed";
        table.paidBill = amount;
        table.totalBill = undefined;
        table.balance = undefined;
        table.billRequested = false;
        table.paidAtTick = draft.tick;
        tableOrders.forEach((o) => {
          o.status = "paid";
        });

        draft.customer.lastReceipt = {
          orderId: `PAY-${draft.tick}`,
          queueNumber: String(1000 + (draft.tick % 9000)),
          tableLabel: table.label,
          amount,
          lines: tableOrders.flatMap((o) => o.lines),
          paidAtTick: draft.tick,
        };

        signal(draft, {
          device: "tablet",
          kind: "success",
          title: `Payment received · ${table.label}`,
          body: `SGD${amount.toFixed(2)}`,
        });
        break;
      }

      case "waiter/select-table": {
        draft.waiter.selectedTableId = event.tableId;
        const table = tableOf(draft, event.tableId);
        if (table) table.assistanceRequested = false;
        break;
      }

      case "waiter/open-order": {
        draft.waiter.selectedOrderId = event.orderId;
        break;
      }

      case "waiter/add-to-cart": {
        draft.waiter.selectedTableId = event.tableId;
        draft.waiter.cart.push({ ...event.line, lineId: `wl-${draft.tick}` });
        break;
      }

      case "waiter/submit-order": {
        if (draft.waiter.cart.length === 0) break;
        const order: Order = {
          id: `ord-${draft.tick}`,
          tableId: event.tableId,
          source: "waiter",
          status: "accepted",
          lines: draft.waiter.cart,
          placedAtTick: draft.tick,
          total: cartTotal(draft.waiter.cart),
        };
        draft.orders.unshift(order);
        draft.waiter.cart = [];
        recalcTableBill(draft, event.tableId);
        signal(draft, {
          device: "mobile",
          kind: "info",
          title: "Waiter added items to your order",
        });
        break;
      }

      case "waiter/set-order-status": {
        const order = draft.orders.find((o) => o.id === event.orderId);
        if (!order) break;
        order.status = event.status;
        recalcTableBill(draft, order.tableId);
        signal(draft, {
          device: "mobile",
          kind: event.status === "rejected" ? "alert" : "info",
          title: `Order ${event.status}`,
        });
        break;
      }

      case "waiter/settle-bill": {
        const table = tableOf(draft, event.tableId);
        draft.orders
          .filter((o) => o.tableId === event.tableId && o.status !== "rejected")
          .forEach((o) => {
            o.status = "paid";
          });
        if (table) {
          table.status = "billed";
          table.paidBill = event.amount;
          table.totalBill = undefined;
          table.billRequested = false;
        }
        signal(draft, { device: "mobile", kind: "success", title: "Bill settled" });
        break;
      }

      case "sim/navigate": {
        if (event.mobile) draft.screens.mobile = event.mobile;
        if (event.tablet) draft.screens.tablet = event.tablet;
        break;
      }

      case "sim/reset":
        break;
    }
  });

export { cartTotal };
