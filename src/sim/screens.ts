/**
 * Screen ids are the contract between the Figma import and the simulation.
 * Adding a Figma frame = add an id here, then register a component in the
 * matching device registry (src/devices/<device>/screens/index.ts).
 */

export const MOBILE_SCREENS = [
  "login",
  "menu",
  "item-detail",
  "cart",
  "order-placed",
  "order-status",
  "bill",
  "payment-success",
] as const;

export const TABLET_SCREENS = [
  "tables",
  "table-detail",
  "orders",
  "order-detail",
  "menu",
  "settings",
] as const;

export type MobileScreenId = (typeof MOBILE_SCREENS)[number];
export type TabletScreenId = (typeof TABLET_SCREENS)[number];

export type ScreenIdFor<D> = D extends "mobile" ? MobileScreenId : TabletScreenId;
