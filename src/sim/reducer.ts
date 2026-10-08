import { produce } from "immer";
import { grandTotal, platformFee } from "./bill";
import type { SimEvent } from "./events";
import type { SimState } from "./state";
import type { CartLine, Order, Payment, Signal, Table } from "./types";

const lineTotal = (l: CartLine) => l.unitPrice * l.qty;
const cartTotal = (lines: CartLine[]) => lines.reduce((s, l) => s + lineTotal(l), 0);

const clock = () => new Date().toTimeString().slice(0, 8);

/** Append a payment to a table's ledger. */
const record = (draft: SimState, table: Table, p: Omit<Payment, "id" | "time">) => {
  (table.payments ??= []).push({ ...p, id: `SP-${74584593 + draft.tick}-0${table.payments.length + 1}39`, time: clock() });
};

const tableOf = (draft: SimState, tableId?: string): Table | undefined =>
  draft.tables.find((t) => t.id === tableId);

/** Open bill = everything ordered on that table that has not been settled. */
const recalcTableBill = (draft: SimState, tableId: string) => {
  const table = tableOf(draft, tableId);
  if (!table) return;
  const open = draft.orders.filter(
    (o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid",
  );
  table.totalBill = open.length ? grandTotal(open.reduce((s, o) => s + o.total, 0)) : undefined;
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
        // the first order turns a scanned (allocated) table into a seated one, so its card carries the bill
        const seated = tableOf(draft, tableId);
        if (seated && (seated.status === "allocated" || seated.status === "vacant")) {
          seated.status = "occupied";
          seated.guestName = draft.customer.guestName ?? seated.guestName ?? "Guest";
          seated.guests = seated.guests ?? 1;
          seated.seatedMinutes = seated.seatedMinutes ?? 0;
        }
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
        break;
      }

      case "customer/pay-bill": {
        const tableId = draft.customer.tableId;
        const table = tableOf(draft, tableId);
        if (!table || !tableId) break;
        const tableOrders = draft.orders.filter(
          (o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid",
        );
        const items = tableOrders.reduce((s, o) => s + o.total, 0);
        // a part-paid table settles what is left, so the full bill is what was paid and owed together
        const amount =
          table.status === "partial"
            ? Math.round(((table.paidBill ?? 0) + (table.balance ?? 0)) * 100) / 100
            : (table.totalBill ?? grandTotal(items));
        draft.customer.split = undefined;

        record(draft, table, {
          method: "Visa",
          amount: Math.round((amount - (table.status === "partial" ? (table.paidBill ?? 0) : 0)) * 100) / 100,
          guest: draft.customer.guestName ?? table.guestName ?? "Guest",
          splitType: "Full",
        });
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
          // items only: the receipt screen adds service and GST itself
          amount: items,
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

      case "customer/start-split": {
        draft.customer.split = event.plan;
        break;
      }

      case "customer/clear-split": {
        draft.customer.split = undefined;
        break;
      }

      case "customer/pay-share": {
        const tableId = draft.customer.tableId;
        const table = tableOf(draft, tableId);
        const split = draft.customer.split;
        if (!table || !tableId || !split) break;
        const tableOrders = draft.orders.filter(
          (o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid",
        );
        const items = tableOrders.reduce((s, o) => s + o.total, 0);
        const wasPartial = table.status === "partial";
        const grand = wasPartial
          ? Math.round(((table.paidBill ?? 0) + (table.balance ?? 0)) * 100) / 100
          : (table.totalBill ?? grandTotal(items));
        const already = wasPartial ? (table.paidBill ?? 0) : 0;
        const share = Math.min(split.share, Math.round((grand - already) * 100) / 100);

        record(draft, table, {
          method: "Visa",
          amount: share,
          guest: draft.customer.guestName ?? table.guestName ?? "Guest",
          splitType: "Custom",
        });
        table.status = "partial";
        table.paidBill = Math.round((already + share) * 100) / 100;
        table.balance = Math.round((grand - table.paidBill) * 100) / 100;
        table.totalBill = undefined;
        table.billRequested = false;

        draft.customer.lastPartial = {
          orderId: `PAY-${draft.tick}`,
          tableLabel: table.label,
          items,
          grand,
          share,
          fee: platformFee(share),
          paid: table.paidBill,
          balance: table.balance,
          lines: tableOrders.flatMap((o) => o.lines),
          tick: draft.tick,
        };
        draft.customer.split = undefined;
        break;
      }

      case "waiter/select-table": {
        draft.waiter.selectedTableId = event.tableId;
        draft.waiter.openTableId = event.tableId;
        const table = tableOf(draft, event.tableId);
        if (table) table.assistanceRequested = false;
        break;
      }

      case "waiter/close-order-detail": {
        draft.waiter.openTableId = undefined;
        break;
      }

      case "waiter/open-pos": {
        draft.waiter.selectedTableId = event.tableId;
        draft.waiter.openTableId = event.tableId;
        break;
      }

      case "waiter/close-pos":
        break;

      case "waiter/increment-cart-line": {
        const line = draft.waiter.cart.find((l) => l.lineId === event.lineId);
        if (line) line.qty += 1;
        break;
      }

      case "waiter/decrement-cart-line": {
        draft.waiter.cart = draft.waiter.cart.flatMap((l) =>
          l.lineId !== event.lineId ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : [],
        );
        break;
      }

      case "waiter/remove-cart-line": {
        draft.waiter.cart = draft.waiter.cart.filter((l) => l.lineId !== event.lineId);
        break;
      }

      case "waiter/replace-cart-line": {
        const i = draft.waiter.cart.findIndex((l) => l.lineId === event.lineId);
        if (i >= 0) draft.waiter.cart[i] = { ...event.line, lineId: event.lineId };
        break;
      }

      case "waiter/open-order": {
        draft.waiter.selectedOrderId = event.orderId;
        break;
      }

      case "waiter/add-to-cart": {
        draft.waiter.selectedTableId = event.tableId;
        // the POS bucket merges repeat taps of one dish (same options, no notes) into a single line
        const sameMods = (a?: string[], b?: string[]) => (a ?? []).join("|") === (b ?? []).join("|");
        const existing = draft.waiter.cart.find(
          (l) =>
            l.itemId === event.line.itemId &&
            !l.notes &&
            !event.line.notes &&
            sameMods(l.modifiers, event.line.modifiers),
        );
        if (existing) existing.qty += event.line.qty;
        else draft.waiter.cart.push({ ...event.line, lineId: `wl-${draft.tick}` });
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
        if (event.tableId === draft.customer.tableId) {
          signal(draft, {
            device: "mobile",
            kind: "info",
            title: "Waiter added items to your order",
          });
        }
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
          const before = table.status === "partial" ? (table.paidBill ?? 0) : 0;
          const amount = Math.round((event.amount - before) * 100) / 100;
          record(draft, table, {
            method: event.method ?? "Cash",
            amount,
            guest: table.guestName ?? "Guest",
            splitType: "Full",
            tendered: event.tendered,
          });
          table.status = "billed";
          table.paidBill = event.amount;
          table.totalBill = undefined;
          table.billRequested = false;
        }
        signal(draft, { device: "mobile", kind: "success", title: "Bill settled" });
        break;
      }

      case "waiter/open-table": {
        const table = tableOf(draft, event.tableId);
        if (!table || (table.status !== "vacant" && table.status !== "allocated")) break;
        table.status = "occupied";
        table.guests = event.guests;
        table.guestName = event.guestName;
        table.phone = event.phone;
        table.seatedMinutes = 0;
        delete table.lastSession;
        // straight into the order detail, which starts with no orders
        draft.waiter.selectedTableId = event.tableId;
        draft.waiter.openTableId = event.tableId;
        break;
      }

      case "waiter/close-table": {
        const table = tableOf(draft, event.tableId);
        if (table) {
          // back to idle: only the identity of the table survives
          const { id, label, section } = table;
          // a table that was paid keeps a trace of that party until the next one sits down
          const lastSession = table.status === "billed" ? { paidBill: table.paidBill ?? 0, minutesAgo: 0 } : undefined;
          Object.keys(table).forEach((k) => delete (table as Record<string, unknown>)[k]);
          Object.assign(table, { id, label, section, status: "vacant", ...(lastSession ? { lastSession } : {}) });
        }
        // the next party starts on an empty order list
        draft.orders = draft.orders.filter((o) => o.tableId !== event.tableId);
        if (draft.waiter.openTableId === event.tableId) draft.waiter.openTableId = undefined;
        if (draft.waiter.selectedTableId === event.tableId) draft.waiter.selectedTableId = undefined;
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
