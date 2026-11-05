"use client";

import { create } from "zustand";
import type { SimEvent } from "./events";
import { reduce } from "./reducer";
import { scenarioFor, type PaymentMode, type PhaseId, type QrType } from "@/config/phases";
import { getActiveMenu } from "@/menu/active";
import { resolveStepEvent } from "./scenario";
import { actorOf, initialState, type SimState, type TerminalQrOption, type TerminalScreen } from "./state";
import { resolveNav } from "./triggers";
import type { MobileScreenId, TabletScreenId } from "./screens";

type SimActions = {
  dispatch: (event: SimEvent) => void;
  runStep: (index: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  setPhase: (phase: PhaseId) => void;
  setQrType: (qrType: QrType) => void;
  setPaymentMode: (paymentMode: PaymentMode) => void;
  setScreen: (mobile?: MobileScreenId, tablet?: TabletScreenId) => void;
  dismissSignal: (id: string) => void;
  clearQrPrint: (id: string) => void;
  /** SmartPay Terminal picked on the tablet: run the terminal through processing, tap card, done, success. */
  startTerminalPayment: (tableId: string, amount: number, settleAmount: number) => void;
  setTerminalScreen: (screen: TerminalScreen) => void;
  advanceTerminal: (run: number, to: TerminalScreen, viaQr?: boolean) => void;
  openTerminalQrMenu: () => void;
  closeTerminalQrMenu: () => void;
  chooseTerminalQr: (option: TerminalQrOption) => void;
};

/** How long each terminal screen holds before the next: processing, tap card, then the done animation. */
const TERMINAL_PROCESSING_MS = 2000;
const TERMINAL_TAP_CARD_MS = 3000;
const TERMINAL_DONE_MS = 2200;
/** A customer scanning the QR with their phone takes a little longer than tapping a card. */
const TERMINAL_QR_SCAN_MS = 4000;

export const TERMINAL_QR_LABEL: Record<TerminalQrOption, string> = {
  grabpay: "GrabPay",
  paynow: "PayNow",
  wechat: "WeChat Pay",
};

const labelOf = (event: SimEvent) => event.type.split("/")[1].replace(/-/g, " ");

export const useSim = create<SimState & SimActions>((set, get) => ({
  ...initialState(),

  dispatch: (event) => {
    if (event.type === "sim/reset") {
      set({ ...initialState(get().phase, get().qrType, get().paymentMode) });
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
    const phase = get().phase;
    const step = scenarioFor(phase, get().qrType)[index];
    if (!step) return;
    const event = resolveStepEvent(step, get(), { menu: getActiveMenu(phase) });
    if (event) get().dispatch(event);
    set({ stepIndex: index });
  },

  next: () => {
    const nextIndex = get().stepIndex + 1;
    if (nextIndex >= scenarioFor(get().phase, get().qrType).length) return;
    get().runStep(nextIndex);
  },

  /** No undo log yet: rewind replays the script from scratch up to the target step. */
  prev: () => {
    const target = get().stepIndex - 1;
    set({ ...initialState(get().phase, get().qrType, get().paymentMode) });
    for (let i = 0; i <= target; i += 1) get().runStep(i);
    set({ stepIndex: target });
  },

  reset: () => set({ ...initialState(get().phase, get().qrType, get().paymentMode) }),

  setPhase: (phase) => set({ ...initialState(phase, get().qrType, get().paymentMode) }),

  setPaymentMode: (paymentMode) => set({ paymentMode }),

  setQrType: (qrType) => set({ ...initialState(get().phase, qrType, get().paymentMode) }),

  setScreen: (mobile, tablet) => get().dispatch({ type: "sim/navigate", mobile, tablet }),

  dismissSignal: (id) => set({ signals: get().signals.filter((s) => s.id !== id) }),

  clearQrPrint: (id) => {
    if (get().qrPrint?.id === id) set({ qrPrint: undefined });
  },

  startTerminalPayment: (tableId, amount, settleAmount) => {
    // a timestamp, so a run started after a reset never matches a timer left over from before it
    const run = Date.now();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    set({
      terminal: {
        screen: "processing",
        tableId,
        amount,
        settleAmount,
        run,
        paidAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} • ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
        paymentId: `SP-${5568 + (run % 100)}-${9090 + get().tick}`,
      },
    });
    setTimeout(() => get().advanceTerminal(run, "tap-card"), TERMINAL_PROCESSING_MS);
    setTimeout(() => get().advanceTerminal(run, "done"), TERMINAL_PROCESSING_MS + TERMINAL_TAP_CARD_MS);
  },

  /**
   * Moves a payment run one step on, but only if it is still waiting on that step: a newer payment,
   * a reset, or the customer choosing a QR wallet in the meantime leaves it alone.
   */
  advanceTerminal: (run, to, viaQr = false) => {
    const t = get().terminal;
    if (t.run !== run || t.screen === "idle") return;
    if (to === "tap-card" && t.screen === "processing") {
      set({ terminal: { ...t, screen: "tap-card" } });
    } else if (to === "done" && t.screen === "tap-card") {
      // the card timer is paused while the QR sheet or a wallet QR is up; the wallet has its own
      if (!viaQr && (t.qrMenu || t.qrOption)) return;
      set({ terminal: { ...t, screen: "done", qrMenu: false } });
      if (t.tableId) {
        get().dispatch({
          type: "waiter/settle-bill",
          tableId: t.tableId,
          amount: t.settleAmount ?? t.amount ?? 0,
          method: t.qrOption ? TERMINAL_QR_LABEL[t.qrOption] : "Card",
        });
      }
      setTimeout(() => get().advanceTerminal(run, "success"), TERMINAL_DONE_MS);
    } else if (to === "success" && t.screen === "done") {
      // the confirmation page stays until the waiter taps Back to home
      set({ terminal: { ...t, screen: "success" } });
    }
  },

  setTerminalScreen: (screen) => set({ terminal: { ...get().terminal, screen } }),

  openTerminalQrMenu: () => {
    const t = get().terminal;
    if (t.screen === "tap-card") set({ terminal: { ...t, qrMenu: true } });
  },

  closeTerminalQrMenu: () => {
    const t = get().terminal;
    set({ terminal: { ...t, qrMenu: false } });
    // back to waiting for a card, with the card timer starting over
    setTimeout(() => {
      const now = get().terminal;
      if (now.run === t.run) get().advanceTerminal(t.run, "done");
    }, TERMINAL_TAP_CARD_MS);
  },

  chooseTerminalQr: (option) => {
    const t = get().terminal;
    if (t.screen !== "tap-card") return;
    set({ terminal: { ...t, qrMenu: false, qrOption: option } });
    setTimeout(() => get().advanceTerminal(t.run, "done", true), TERMINAL_QR_SCAN_MS);
  },
}));

export const useMobileScreen = () => useSim((s) => s.screens.mobile);
export const useTabletScreen = () => useSim((s) => s.screens.tablet);
