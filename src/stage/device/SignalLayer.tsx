"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { DeviceId } from "@/config/global";
import { useSim } from "@/engine/store";
import type { Signal } from "@/engine/types";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";

const TONE: Record<string, string> = {
  info: "bg-neutral-900 text-white",
  success: "bg-emerald-600 text-white",
  alert: "bg-amber-500 text-neutral-950",
};

/** Slide in 0.6s, hold 3s, slide out 0.6s: matches `animate-toast-slide`. */
const TABLE_OPEN_MS = 4200;

/** Figma 3172:101: a table chip beside the action it asks the waiter to take. */
function TableOpenToast({ signal, onDismiss }: { signal: Signal; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, TABLE_OPEN_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <button
      type="button"
      onClick={onDismiss}
      className={cn(
        figtree.className,
        "animate-toast-slide pointer-events-auto flex items-center gap-1 self-end rounded-full bg-neutral-800/90 p-2 shadow-lg backdrop-blur-sm",
      )}
    >
      <span className="flex h-11 items-center justify-center gap-1 rounded-full bg-[#917b0a] p-3">
        <Image src="/figma/tablet/toast-bell.svg" alt="" width={24} height={24} className="size-6" />
        <span className="text-sm leading-none font-bold whitespace-nowrap text-white">{signal.title}</span>
      </span>
      <span className="flex h-11 items-center justify-center p-3 text-sm leading-none font-medium whitespace-nowrap text-[#cdcdcd]">
        {signal.body}
      </span>
    </button>
  );
}

/** In-device toast stack. Shows only signals addressed to this device. */
export function SignalLayer({ device }: { device: DeviceId }) {
  const signals = useSim((s) => s.signals);
  const dismiss = useSim((s) => s.dismissSignal);
  const visible = signals.filter((s) => s.device === device).slice(0, 3);

  if (!visible.length) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-[70] flex flex-col gap-2">
      {visible.map((s) =>
        s.variant === "table-open" ? (
          <TableOpenToast key={s.id} signal={s} onDismiss={() => dismiss(s.id)} />
        ) : (
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
        ),
      )}
    </div>
  );
}
