"use client";

import { useEffect, useState } from "react";
import { PHASES } from "@/config/phases";
import { cn } from "@/lib/cn";
import { useSim } from "@/engine/store";
import { useMenuStore } from "@/menu/store";
import { applyPosHandoff } from "@/screens/tablet/pos/handoff";
import { useThemeChoice } from "@/theme/store";
import { MobileDevice } from "./device/MobileDevice";
import { StageErrorBoundary } from "./ErrorBoundary";
import { TabletDevice } from "./device/TabletDevice";
import { ScenarioBar } from "./header/ScenarioBar";
import { ControlSidebar } from "./nav/ControlSidebar";
import { GLASS, PROGRESSIVE_BLUR } from "./glass";

/** Full site view: customer mobile on the left, waiter tablet on the right. */
export function Stage() {
  /** Recording mode: F hides the floating step runner and sidebar button, F again brings them back. */
  const [chromeHidden, setChromeHidden] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      // typing an F into a field (the POS search, a note) isn't a shortcut
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      setChromeHidden((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // browser-stored state (unsaved studio edits, the selected phase and themes) loads after
  // the first render, so it matches the server render
  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    void Promise.all([useMenuStore.persist.rehydrate(), useThemeChoice.persist.rehydrate()]).then(() => {
      if (cancelled) return;
      const { lastPhase, lastQrType, lastPaymentMode } = useThemeChoice.getState();
      const known = PHASES.some((p) => p.id === lastPhase);
      // always re-seed: the first seed ran before the drafts and theme choice were loaded
      if (lastQrType) useSim.setState({ qrType: lastQrType });
      if (lastPaymentMode) useSim.setState({ paymentMode: lastPaymentMode });
      useSim.getState().setPhase(known ? lastPhase! : useSim.getState().phase);
      // "Open in prototype" from a design-system page: Phase 2 POS in that case's state
      applyPosHandoff();
      // from here on, remember every phase, QR type and payment mode switch
      stop = useSim.subscribe((s, prev) => {
        if (s.phase !== prev.phase) useThemeChoice.getState().rememberPhase(s.phase);
        if (s.qrType !== prev.qrType) useThemeChoice.getState().rememberQrType(s.qrType);
        if (s.paymentMode !== prev.paymentMode) useThemeChoice.getState().rememberPaymentMode(s.paymentMode);
      });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-neutral-900 text-neutral-100">
      {/* liquid-glass top edge: progressive blur under the floating button and step runner */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[96px]">
        {PROGRESSIVE_BLUR.map((l) => (
          <div
            key={l.blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${l.blur}px) saturate(1.4)`,
              WebkitBackdropFilter: `blur(${l.blur}px) saturate(1.4)`,
              maskImage: `linear-gradient(to bottom, black 0%, black ${l.stop * 0.4}%, transparent ${l.stop}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, black 0%, black ${l.stop * 0.4}%, transparent ${l.stop}%)`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/25 to-transparent" />
      </div>
      <ControlSidebar hidden={chromeHidden} />
      {/* step runner stays one tap away; everything else lives in the sidebar */}
      <div
        inert={chromeHidden}
        className={cn(
          "fixed top-4 right-4 z-50 rounded-2xl p-1.5 transition duration-300",
          GLASS,
          chromeHidden && "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <ScenarioBar />
      </div>

      <main className="flex min-h-0 flex-1 gap-6 px-6 pt-[72px] pb-6">
        <div className="flex min-h-0 w-[26%] min-w-[240px] max-w-[380px] flex-col">
          <StageErrorBoundary label="Mobile">
            <MobileDevice />
          </StageErrorBoundary>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <StageErrorBoundary label="Tablet">
            <TabletDevice />
          </StageErrorBoundary>
        </div>
      </main>
    </div>
  );
}
