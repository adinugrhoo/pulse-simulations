"use client";

import { createContext, useContext } from "react";
import { useSim } from "@/engine/store";
import { usePosHandoff } from "./handoff";
import type { SimEvent } from "@/engine/events";
import type { SimState } from "@/engine/state";
import { useMenu } from "@/menu/hooks";
import type { ResolvedMenu } from "@/menu/types";
import type { ScheduleClock } from "@/theme/store";

/** Where the POS page starts when it isn't driven by the sim: search open, its query, recommendations shown. */
export type PosUiStart = { searching?: boolean; query?: string; showReco?: boolean };

export type PosPreviewValue = {
  state: SimState;
  dispatch: (event: SimEvent) => void;
  menu: ResolvedMenu;
  scheduleClock?: ScheduleClock;
  ui?: PosUiStart;
};

/**
 * Lets `/design-system` render the real POS page with its own state, menu and schedule
 * clock, several side by side, without touching the prototype's sim store. Unset, the
 * POS reads the live sim as before.
 */
export const PosPreview = createContext<PosPreviewValue | null>(null);

type PosSim = SimState & { dispatch: (event: SimEvent) => void };

/** `useSim`, unless a preview supplies the state. */
export function usePosSim<T>(select: (s: PosSim) => T): T {
  const live = useSim(select);
  const preview = useContext(PosPreview);
  return preview ? select({ ...preview.state, dispatch: preview.dispatch }) : live;
}

/** `useMenu`, unless a preview (or a case opened from the design system) supplies the menu. */
export function usePosMenu(): ResolvedMenu {
  const live = useMenu();
  const handedOff = usePosHandoff((s) => s.menu);
  return useContext(PosPreview)?.menu ?? handedOff ?? live;
}

export const usePosPreview = () => useContext(PosPreview);

/** Where the page's search and recommendations start: a preview's, a handed-off case's, or the defaults. */
export function usePosUiStart(): PosUiStart | undefined {
  const handedOff = usePosHandoff((s) => s.ui);
  return useContext(PosPreview)?.ui ?? handedOff;
}
