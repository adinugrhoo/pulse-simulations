"use client";

import { create } from "zustand";
import { DEFAULT_TABLE_ID } from "@/config/global";
import { useSim } from "@/engine/store";
import type { CartLine, WaiterSession } from "@/engine/types";
import type { ResolvedMenu } from "@/menu/types";
import { useThemeChoice, type ScheduleClock } from "@/theme/store";
import type { PosUiStart } from "./preview";

/** A design-system page case, carried into the prototype: "Open in prototype". */
export type PosHandoff = {
  themeId: string;
  cart?: CartLine[];
  pos?: WaiterSession["pos"];
  ui?: PosUiStart;
  scheduleClock?: ScheduleClock;
  /** Only when the case swaps the menu (an empty API answer). */
  menu?: ResolvedMenu;
};

/** localStorage, not session: the prototype opens in a new tab. Read once, then removed. */
const KEY = "pulse:pos-handoff";
const PHASE = "2.0";

/**
 * What the prototype's POS page shows on top of the live sim while a handoff is on
 * screen: the starting search / recommendations state and a swapped menu. Cleared once
 * the waiter leaves the POS page.
 */
export const usePosHandoff = create<{ ui?: PosUiStart; menu?: ResolvedMenu }>(() => ({}));

export function sendPosHandoff(handoff: PosHandoff) {
  localStorage.setItem(KEY, JSON.stringify(handoff));
  window.open("/", "_blank");
}

/** Called by the Stage once the stored phase and theme are loaded. True when a handoff was applied. */
export function applyPosHandoff(): boolean {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  localStorage.removeItem(KEY);
  let h: PosHandoff;
  try {
    h = JSON.parse(raw);
  } catch {
    return false;
  }
  const theme = useThemeChoice.getState();
  theme.setTheme(PHASE, h.themeId);
  theme.rememberPhase(PHASE);
  if (h.scheduleClock) theme.setScheduleClock(h.scheduleClock);

  // before the POS mounts: it reads the starting search / recommendations once
  usePosHandoff.setState({ ui: h.ui, menu: h.menu });
  useSim.getState().setPhase(PHASE);
  const s = useSim.getState();
  useSim.setState({
    waiter: { ...s.waiter, selectedTableId: DEFAULT_TABLE_ID, openTableId: DEFAULT_TABLE_ID, cart: h.cart ?? [], pos: h.pos },
    screens: { ...s.screens, tablet: "pos-order" },
  });
  const stop = useSim.subscribe((next) => {
    if (next.screens.tablet === "pos-order") return;
    usePosHandoff.setState({ ui: undefined, menu: undefined });
    stop();
  });
  return true;
}
