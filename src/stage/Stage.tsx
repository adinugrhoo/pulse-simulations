"use client";

import { useEffect } from "react";
import { GLOBAL_CONFIG } from "@/config/global";
import { PHASES } from "@/config/phases";
import { useSim } from "@/engine/store";
import { useMenuStore } from "@/menu/store";
import { useThemeChoice } from "@/theme/store";
import { MobileDevice } from "./device/MobileDevice";
import { StageErrorBoundary } from "./ErrorBoundary";
import { TabletDevice } from "./device/TabletDevice";
import { PhaseSelect } from "./header/PhaseSelect";
import { ScenarioBar } from "./header/ScenarioBar";
import { ThemeSelect } from "./header/ThemeSelect";
import { MenuStudioButton } from "./studio/MenuStudio";

/** Full site view: customer mobile on the left, waiter tablet on the right. */
export function Stage() {
  // browser-stored state (unsaved studio edits, the selected phase and themes) loads after
  // the first render, so it matches the server render
  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    void Promise.all([useMenuStore.persist.rehydrate(), useThemeChoice.persist.rehydrate()]).then(() => {
      if (cancelled) return;
      const { lastPhase } = useThemeChoice.getState();
      const known = PHASES.some((p) => p.id === lastPhase);
      // always re-seed: the first seed ran before the drafts and theme choice were loaded
      useSim.getState().setPhase(known ? lastPhase! : useSim.getState().phase);
      // from here on, remember every phase switch
      stop = useSim.subscribe((s, prev) => {
        if (s.phase !== prev.phase) useThemeChoice.getState().rememberPhase(s.phase);
      });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-neutral-900 text-neutral-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-wide">{GLOBAL_CONFIG.appName}</h1>
          <PhaseSelect />
          <ThemeSelect />
          <MenuStudioButton />
        </div>
        <ScenarioBar />
      </header>

      <main className="flex min-h-0 flex-1 gap-6 p-6">
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
