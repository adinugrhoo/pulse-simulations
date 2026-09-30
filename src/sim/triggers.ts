import type { EventOf, SimEvent, SimEventType } from "./events";
import type { MobileScreenId, TabletScreenId } from "./screens";
import type { SimState } from "./state";

export type NavEffect = {
  mobile?: MobileScreenId;
  tablet?: TabletScreenId;
};

type Trigger<T extends SimEventType> =
  | NavEffect
  | ((event: EventOf<T>, next: SimState) => NavEffect);

/**
 * THE WIRING TABLE. One entry per event: "customer does X → these screens show".
 * `next` is the state *after* the reducer ran, so conditional routing is easy.
 * Edit this file as each Figma screen lands; everything else stays untouched.
 */
export const TRIGGERS: { [T in SimEventType]?: Trigger<T> } = {
  "customer/scan-qr": { mobile: "login", tablet: "tables" },
  "customer/login": { mobile: "menu", tablet: "tables" },
  "customer/open-item": { mobile: "item-detail" },
  "customer/add-to-cart": { mobile: "menu" },
  "customer/remove-from-cart": { mobile: "cart" },
  "customer/increment-cart-line": { mobile: "cart" },
  "customer/decrement-cart-line": { mobile: "cart" },
  "customer/open-cart": { mobile: "cart" },
  "customer/submit-order": { mobile: "order-placed", tablet: "order-detail" },
  "customer/call-waiter": { tablet: "table-detail" },
  "customer/request-bill": { mobile: "bill", tablet: "table-detail" },
  "customer/pay-bill": { mobile: "payment-success", tablet: "tables" },

  // the table detail is a dialog rendered over the floor plan, not its own screen
  "waiter/select-table": { tablet: "tables" },
  "waiter/open-order": { tablet: "order-detail" },
  // both are fired from the order-detail dialog, which lives over `tables` —
  // routing the tablet elsewhere would unmount it mid-action
  "waiter/add-to-cart": { tablet: "tables" },
  "waiter/submit-order": { mobile: "order-status", tablet: "tables" },
  "waiter/set-order-status": { mobile: "order-status", tablet: "orders" },
  "waiter/settle-bill": { mobile: "bill", tablet: "tables" },
};

export const resolveNav = (event: SimEvent, next: SimState): NavEffect => {
  const trigger = TRIGGERS[event.type] as Trigger<SimEventType> | undefined;
  if (!trigger) return {};
  return typeof trigger === "function"
    ? trigger(event as EventOf<SimEventType>, next)
    : trigger;
};
