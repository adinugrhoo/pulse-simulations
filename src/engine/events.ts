import type { CartLine, OrderStatus, SplitPlan } from "./types";
import type { MobileScreenId, TabletScreenId } from "./screens";

/**
 * Every state change in the sim goes through one of these events.
 * Customer events originate on the mobile device, waiter events on the tablet.
 */
export type SimEvent =
  /* customer (mobile) */
  | { type: "customer/scan-qr"; tableId: string }
  | { type: "customer/login"; guestName: string; guests: number }
  | { type: "customer/open-item"; itemId: string }
  | { type: "customer/add-to-cart"; line: Omit<CartLine, "lineId"> }
  | { type: "customer/remove-from-cart"; lineId: string }
  | { type: "customer/increment-cart-line"; lineId: string }
  | { type: "customer/decrement-cart-line"; lineId: string }
  | { type: "customer/open-cart" }
  | { type: "customer/submit-order" }
  /**
   * A guest asks for a waiter: from the phone later, from hotkey 2 for now. `tableId`
   * defaults to the customer's own table; `at` is wall-clock ms, passed in so the reducer stays pure.
   */
  | { type: "customer/call-waiter"; tableId?: string; at: number }
  /** A guest with an open call rings again (hotkey 3 for now): the call turns red, "Calling again". */
  | { type: "customer/call-again"; tableId: string; at: number }
  /** A guest cancels their open call (hotkey 4 for now): it leaves the floor and the drawer. */
  | { type: "customer/dismiss-call"; tableId: string; at: number }
  | { type: "customer/request-bill" }
  | { type: "customer/pay-bill" }
  | { type: "customer/start-split"; plan: SplitPlan }
  | { type: "customer/clear-split" }
  | { type: "customer/pay-share" }
  /* waiter (tablet) */
  | { type: "waiter/select-table"; tableId: string }
  | { type: "waiter/close-order-detail" }
  | { type: "waiter/open-pos"; tableId: string }
  | { type: "waiter/close-pos" }
  | { type: "waiter/pos-open-category"; categoryId: string }
  | { type: "waiter/pos-close-category" }
  | { type: "waiter/pos-pick-subcategory"; subcategoryId: string }
  /** Opens (or, with null, closes) the schedule popover of a dish its merchant schedule blocks. */
  | { type: "waiter/pos-schedule-info"; dishId: string | null }
  | { type: "waiter/increment-cart-line"; lineId: string }
  | { type: "waiter/decrement-cart-line"; lineId: string }
  | { type: "waiter/remove-cart-line"; lineId: string }
  /** Opens (or, with null, closes) the order-note dialog for a bucket line. */
  | { type: "waiter/open-line-note"; lineId: string | null }
  /** Saves a bucket line's order note (blank clears it) and closes the dialog. */
  | { type: "waiter/set-line-note"; lineId: string; notes: string }
  | { type: "waiter/replace-cart-line"; lineId: string; line: Omit<CartLine, "lineId"> }
  | { type: "waiter/open-order"; orderId: string }
  | { type: "waiter/add-to-cart"; tableId: string; line: Omit<CartLine, "lineId"> }
  | { type: "waiter/submit-order"; tableId: string }
  | { type: "waiter/set-order-status"; orderId: string; status: OrderStatus }
  | { type: "waiter/settle-bill"; tableId: string; amount: number; method?: string; tendered?: number }
  | { type: "waiter/close-table"; tableId: string }
  | { type: "waiter/print-qr"; tableId: string }
  | { type: "waiter/open-table"; tableId: string; guests: number; guestName: string; phone: string }
  /** The waiter takes a table's call: its tag and drawer row turn green. */
  | { type: "waiter/accept-call"; tableId: string }
  /** The waiter has helped the guest: the call disappears. */
  | { type: "waiter/complete-call"; tableId: string }
  /* simulation control */
  | { type: "sim/navigate"; mobile?: MobileScreenId; tablet?: TabletScreenId }
  | { type: "sim/reset" };

export type SimEventType = SimEvent["type"];

export type EventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
