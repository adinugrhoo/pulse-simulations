"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Popover } from "./Popover";

const PHASES = [
  { id: "1.0", label: "Phase 1.0", chip: "Design Ready", tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  { id: "2.0", label: "Phase 2.0", chip: "Ongoing", tone: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
] as const;

type PhaseId = (typeof PHASES)[number]["id"];

/** Header dropdown: which build phase is currently in view, purely informational. */
export function PhaseSelect() {
  const [phaseId, setPhaseId] = useState<PhaseId>("1.0");
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
                  setPhaseId(p.id);
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
