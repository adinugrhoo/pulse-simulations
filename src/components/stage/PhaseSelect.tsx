"use client";

import { cn } from "@/lib/cn";
import { PHASES } from "@/sim/phases";
import { useSim } from "@/sim/store";
import { Popover } from "./Popover";

/** Header dropdown: picks the build phase, which swaps the scenario the stepper runs. */
export function PhaseSelect() {
  const phaseId = useSim((s) => s.phase);
  const setPhase = useSim((s) => s.setPhase);
  const phase = PHASES.find((p) => p.id === phaseId)!;

  return (
    <Popover
      label={phase.label}
      chip={
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1", phase.tone)}>
          {phase.chip}
        </span>
      }
      width={220}
    >
      {(close) => (
        <ul className="flex flex-col gap-1">
          {PHASES.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setPhase(p.id);
                  close();
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-2 text-left transition",
                  p.id === phaseId
                    ? "border-white/40 bg-white/10"
                    : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                )}
              >
                <span className="text-xs font-medium text-neutral-200">{p.label}</span>
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1", p.tone)}>
                  {p.chip}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
