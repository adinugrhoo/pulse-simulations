"use client";

import { getPhase } from "@/config/phases";
import { useSim } from "@/engine/store";
import { cn } from "@/lib/cn";
import { Popover } from "./Popover";

const ACTOR_TONE = {
  customer: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  waiter: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  system: "bg-neutral-500/15 text-neutral-300 ring-neutral-500/30",
} as const;

const countChip = (count?: string) =>
  count ? <span className="tabular-nums text-neutral-500">{count}</span> : null;

/** Header controls: step runner, scenario dropdown, event log dropdown. */
export function ScenarioBar() {
  const phase = useSim((s) => s.phase);
  const SCENARIO = getPhase(phase).scenario;
  const stepIndex = useSim((s) => s.stepIndex);
  const log = useSim((s) => s.log);
  const runStep = useSim((s) => s.runStep);
  const next = useSim((s) => s.next);
  const prev = useSim((s) => s.prev);
  const reset = useSim((s) => s.reset);

  const current = SCENARIO[stepIndex];
  const atEnd = stepIndex >= SCENARIO.length - 1;

  return (
    <div className="flex items-center gap-2">
      <Popover
        label={current ? current.title : "Scenario"}
        chip={countChip(`${Math.max(stepIndex + 1, 0)}/${SCENARIO.length}`)}
        width={380}
      >
        {(close) => (
          <ol className="flex flex-col gap-1">
            {SCENARIO.map((step, i) => (
              <li key={step.id}>
                <button
                  onClick={() => {
                    runStep(i);
                    close();
                  }}
                  className={cn(
                    "w-full rounded-lg border p-2 text-left transition",
                    i === stepIndex
                      ? "border-white/40 bg-white/10"
                      : i < stepIndex
                        ? "border-neutral-800 bg-neutral-900/60 opacity-60 hover:opacity-100"
                        : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase ring-1",
                        ACTOR_TONE[step.actor],
                      )}
                    >
                      {step.actor}
                    </span>
                    <span className="text-[10px] text-neutral-600">{i + 1}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-neutral-200">{step.title}</span>
                  {step.expect ? (
                    <span className="mt-0.5 block text-[10px] leading-snug text-neutral-500">
                      → {step.expect}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        )}
      </Popover>

      <Popover label="Log" chip={countChip(log.length ? String(log.length) : undefined)} align="right" width={300}>
        {() =>
          log.length === 0 ? (
            <p className="p-2 text-[11px] text-neutral-600">No events yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 p-1 font-mono text-[10px] text-neutral-400">
              {log.map((entry, i) => (
                <li key={`${entry.tick}-${i}`} className="flex gap-2">
                  <span className="w-6 shrink-0 text-right text-neutral-600">{entry.tick}</span>
                  <span
                    className={cn(
                      "shrink-0",
                      entry.actor === "customer" ? "text-sky-400" : "text-violet-400",
                    )}
                  >
                    {entry.actor[0].toUpperCase()}
                  </span>
                  <span className="truncate">{entry.event.type}</span>
                </li>
              ))}
            </ul>
          )
        }
      </Popover>

      <div className="ml-1 flex items-center gap-1">
        <button
          onClick={prev}
          disabled={stepIndex < 0}
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={atEnd}
          className="rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-neutral-900 disabled:opacity-40"
        >
          Next step
        </button>
        <button
          onClick={reset}
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
