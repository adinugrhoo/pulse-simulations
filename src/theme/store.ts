import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getTheme, type PaymentMode, type PhaseId, type QrType, type ThemeId } from "@/config/phases";

/**
 * What the header has selected: the phase on screen, the QR type, the payment mode and the theme each phase shows.
 * Lives outside the sim store so a reset or a scenario replay keeps the look, and in
 * sessionStorage so a dev reload (e.g. after the Menu Studio saves a menu.json) lands
 * back on the same phase and theme.
 */
/**
 * What the POS checks dish schedules against: the real clock, or a forced answer so a
 * demo shows the unavailable state (or hides it) whatever the time is.
 */
export type ScheduleClock = "live" | "unavailable" | "available";

type ThemeChoice = {
  byPhase: Record<PhaseId, ThemeId>;
  scheduleClock: ScheduleClock;
  setScheduleClock: (clock: ScheduleClock) => void;
  lastPhase?: PhaseId;
  lastQrType?: QrType;
  lastPaymentMode?: PaymentMode;
  setTheme: (phaseId: PhaseId, themeId: ThemeId) => void;
  rememberPhase: (phaseId: PhaseId) => void;
  rememberQrType: (qrType: QrType) => void;
  rememberPaymentMode: (paymentMode: PaymentMode) => void;
};

export const useThemeChoice = create<ThemeChoice>()(
  persist(
    (set) => ({
      byPhase: {},
      // demos show scheduled dishes blocked whatever the time; "live" is one pick away
      scheduleClock: "unavailable",
      setScheduleClock: (scheduleClock) => set({ scheduleClock }),
      setTheme: (phaseId, themeId) => set((s) => ({ byPhase: { ...s.byPhase, [phaseId]: themeId } })),
      rememberPhase: (lastPhase) => set({ lastPhase }),
      rememberQrType: (lastQrType) => set({ lastQrType }),
      rememberPaymentMode: (lastPaymentMode) => set({ lastPaymentMode }),
    }),
    {
      name: "pulse-view",
      storage: createJSONStorage(() => sessionStorage),
      // v1: schedule clock default moved to "unavailable"; drop the old "live" pick
      version: 1,
      migrate: (persisted) => ({ ...(persisted as object), scheduleClock: "unavailable" }) as ThemeChoice,
      partialize: (s) => ({
        byPhase: s.byPhase,
        scheduleClock: s.scheduleClock,
        lastPhase: s.lastPhase,
        lastQrType: s.lastQrType,
        lastPaymentMode: s.lastPaymentMode,
      }),
      // rehydrated from the Stage after mount, like the menu drafts
      skipHydration: true,
    },
  ),
);

/** The phase's chosen theme id, or its default. */
export const themeIdFor = (byPhase: Record<PhaseId, ThemeId>, phaseId: PhaseId): ThemeId =>
  getTheme(phaseId, byPhase[phaseId]).id;

export const activeThemeId = (phaseId: PhaseId): ThemeId => themeIdFor(useThemeChoice.getState().byPhase, phaseId);
