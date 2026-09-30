"use client";

import { create } from "zustand";
import type { SimEvent } from "./events";
import { reduce } from "./reducer";
import { SCENARIO, resolveStepEvent } from "./scenario";
import { actorOf, initialState, type SimState } from "./state";
import { resolveNav } from "./triggers";
import type { MobileScreenId, TabletScreenId } from "./screens";

type SimActions = {
  dispatch: (event: SimEvent) => void;
  runStep: (index: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  setScreen: (mobile?: MobileScreenId, tablet?: TabletScreenId) => void;
  dismissSignal: (id: string) => void;
};

const labelOf = (event: SimEvent) => event.type.split("/")[1].replace(/-/g, " ");

export const useSim = create<SimState & SimActions>((set, get) => ({
  ...initialState(),

  dispatch: (event) => {
    if (event.type === "sim/reset") {
      set({ ...initialState() });
      return;
    }
    const current = get();
    const afterDomain = reduce(current, event);
    const nav = resolveNav(event, afterDomain);
    const next = nav.mobile || nav.tablet ? reduce(afterDomain, { type: "sim/navigate", ...nav }) : afterDomain;
    set({
      ...next,
      // sim/navigate bumps the tick too; keep the log aligned to the real event.
      log: [
        { tick: afterDomain.tick, actor: actorOf(event.type), label: labelOf(event), event },
        ...current.log,
      ].slice(0, 60),
    });
  },

  runStep: (index) => {
    const step = SCENARIO[index];
    if (!step) return;
    const event = resolveStepEvent(step, get());
    if (event) get().dispatch(event);
    set({ stepIndex: index });
  },

  next: () => {
    const nextIndex = get().stepIndex + 1;
    if (nextIndex >= SCENARIO.length) return;
    get().runStep(nextIndex);
  },

  /** No undo log yet: rewind replays the script from scratch up to the target step. */
  prev: () => {
    const target = get().stepIndex - 1;
    set({ ...initialState() });
    for (let i = 0; i <= target; i += 1) get().runStep(i);
    set({ stepIndex: target });
  },

  reset: () => set({ ...initialState() }),

  setScreen: (mobile, tablet) => get().dispatch({ type: "sim/navigate", mobile, tablet }),

  dismissSignal: (id) => set({ signals: get().signals.filter((s) => s.id !== id) }),
}));

export const useMobileScreen = () => useSim((s) => s.screens.mobile);
export const useTabletScreen = () => useSim((s) => s.screens.tablet);
