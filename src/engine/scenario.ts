import type { ResolvedMenu } from "@/menu/types";
import type { SimEvent } from "./events";
import type { SimState } from "./state";
import type { CartLine } from "./types";

/** What a step can read besides sim state: the menu of the active phase + theme. */
export type StepContext = { menu: ResolvedMenu };

export type Step = {
  id: string;
  title: string;
  actor: "customer" | "waiter";
  /** What the viewer should watch for on the *other* device. */
  expect?: string;
  /** A function form lets a step read live state (e.g. the id of the order just placed) or the menu. */
  event: SimEvent | ((state: SimState, ctx: StepContext) => SimEvent | null);
};

/**
 * Builds a step event around a menu dish, so scripts quote whatever name and price the
 * Menu Studio set. Skips the step (null) when the dish was removed from the menu.
 */
export const withDish = (
  menu: ResolvedMenu,
  dishId: string,
  qty: number,
  build: (line: Omit<CartLine, "lineId">) => SimEvent,
): SimEvent | null => {
  const d = menu.byId[dishId];
  return d ? build({ itemId: d.id, name: d.name, unitPrice: d.price, qty }) : null;
};

export const resolveStepEvent = (step: Step, state: SimState, ctx: StepContext): SimEvent | null =>
  typeof step.event === "function" ? step.event(state, ctx) : step.event;
