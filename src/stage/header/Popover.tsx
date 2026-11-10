"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GLASS_CONTROL, GLASS_PANEL } from "../glass";
import { Chevron } from "./Chevron";
import { useDismiss } from "./useDismiss";

/**
 * "dropdown" floats the panel under the button (the default). "inline" stretches the button
 * to full width and opens the panel in the flow below it, like an accordion: the control
 * sidebar uses it so panels never get clipped by its scroll area.
 */
export const PopoverLayout = createContext<"dropdown" | "inline">("dropdown");

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
  const inline = useContext(PopoverLayout) === "inline";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-neutral-200 transition",
          inline && "h-10 w-full rounded-xl px-3.5 text-[13px] [&>span:first-child]:mr-auto",
          open ? "border border-white/20 bg-white/[0.12] text-white" : GLASS_CONTROL,
        )}
      >
        <span className="font-medium">{label}</span>
        {chip}
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          style={inline ? undefined : { width }}
          className={cn(
            "rounded-xl p-2",
            inline
              ? "mt-1.5 border border-white/[0.08] bg-white/[0.04]"
              : cn("absolute top-full z-50 mt-2 max-h-[70vh] overflow-y-auto", GLASS_PANEL),
            !inline && (align === "right" ? "right-0" : "left-0"),
          )}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
