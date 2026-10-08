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
  | { type: "customer/call-waiter"; reason?: string }
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
  | { type: "waiter/increment-cart-line"; lineId: string }
  | { type: "waiter/decrement-cart-line"; lineId: string }
  | { type: "waiter/remove-cart-line"; lineId: string }
  | { type: "waiter/replace-cart-line"; lineId: string; line: Omit<CartLine, "lineId"> }
  | { type: "waiter/open-order"; orderId: string }
  | { type: "waiter/add-to-cart"; tableId: string; line: Omit<CartLine, "lineId"> }
  | { type: "waiter/submit-order"; tableId: string }
  | { type: "waiter/set-order-status"; orderId: string; status: OrderStatus }
  | { type: "waiter/settle-bill"; tableId: string; amount: number; method?: string; tendered?: number }
  | { type: "waiter/close-table"; tableId: string }
  | { type: "waiter/open-table"; tableId: string; guests: number; guestName: string; phone: string }
  /* simulation control */
  | { type: "sim/navigate"; mobile?: MobileScreenId; tablet?: TabletScreenId }
  | { type: "sim/reset" };

export type SimEventType = SimEvent["type"];

export type EventOf<T extends SimEventType> = Extract<SimEvent, { type: T }>;
