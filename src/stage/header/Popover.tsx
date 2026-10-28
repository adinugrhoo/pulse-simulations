"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Chevron } from "./Chevron";
import { useDismiss } from "./useDismiss";

/** Shared header dropdown shell — button with label/chip/chevron, panel below. */
export function Popover({
  label,
  chip,
  children,
  align = "left",
  width,
}: {
  label: string;
  chip?: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition",
          open
            ? "border-neutral-600 bg-neutral-800 text-white"
            : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700",
        )}
      >
        <span className="font-medium">{label}</span>
        {chip}
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          style={{ width }}
          className={cn(
            "absolute top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl shadow-black/60",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
