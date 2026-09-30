"use client";

import type { DeviceId } from "@/sim/devices";
import { useSim } from "@/sim/store";
import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  info: "bg-neutral-900 text-white",
  success: "bg-emerald-600 text-white",
  alert: "bg-amber-500 text-neutral-950",
};

/** In-device toast stack. Shows only signals addressed to this device. */
export function SignalLayer({ device }: { device: DeviceId }) {
  const signals = useSim((s) => s.signals);
  const dismiss = useSim((s) => s.dismissSignal);
  const visible = signals.filter((s) => s.device === device).slice(0, 3);

  if (!visible.length) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-50 flex flex-col gap-2">
      {visible.map((s) => (
        <button
          key={s.id}
          onClick={() => dismiss(s.id)}
          className={cn(
            "pointer-events-auto rounded-xl px-3 py-2 text-left shadow-lg ring-1 ring-black/10",
            TONE[s.kind],
          )}
        >
          <p className="text-[13px] leading-tight font-semibold">{s.title}</p>
          {s.body ? <p className="text-[11px] opacity-80">{s.body}</p> : null}
        </button>
      ))}
    </div>
  );
}
