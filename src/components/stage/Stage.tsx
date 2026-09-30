"use client";

import { MobileDevice } from "@/devices/mobile/MobileDevice";
import { TabletDevice } from "@/devices/tablet/TabletDevice";
import { PhaseSelect } from "./PhaseSelect";
import { ScenarioBar } from "./ScenarioBar";

/** Full site view: customer mobile on the left, waiter tablet on the right. */
export function Stage() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-neutral-900 text-neutral-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950 px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-wide">Pulse Simulations</h1>
          <PhaseSelect />
        </div>
        <ScenarioBar />
      </header>

      <main className="flex min-h-0 flex-1 gap-6 p-6">
        <div className="flex min-h-0 w-[26%] min-w-[240px] max-w-[380px] flex-col">
          <MobileDevice />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <TabletDevice />
        </div>
      </main>
    </div>
  );
}
