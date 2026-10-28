"use client";

import Image from "next/image";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { SECTIONS, rangeLabel } from "@/config/global";

const ASSET = "/figma/tablet-sections";

export type SectionCounts = Record<string, { vacant: number; allocate: number }>;

/** Vacant / allocate legend, shared by the section headers and the sidebar rows. */
export function SectionLegend({ counts, className }: { counts: { vacant: number; allocate: number }; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Image src={`${ASSET}/dot-vacant.svg`} alt="" width={14} height={14} className="size-[14px]" />
        <span className="text-sm leading-none whitespace-nowrap text-[#fff8eb]">{counts.vacant} Vacant</span>
      </div>
      <div className="flex items-center gap-1">
        <Image src={`${ASSET}/dot-allocate.svg`} alt="" width={14} height={14} className="size-[14px]" />
        <span className="text-sm leading-none whitespace-nowrap text-[#fff8eb]">{counts.allocate} Allocate</span>
      </div>
    </div>
  );
}

/**
 * Left drawer listing every floor section with how many tables are vacant / allocated.
 * Blurred glass panel over a dimmed, blurred floor; closes on the X, the backdrop or Escape.
 * The panel stays mounted so it can slide in and out; `invisible` (delayed on close) keeps
 * it out of the tab order while shut.
 */
export function SectionsSidebar({
  open,
  activeId,
  counts,
  onSelect,
  onClose,
}: {
  open: boolean;
  activeId: string;
  counts: SectionCounts;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const totals = Object.values(counts).reduce(
    (sum, c) => ({ vacant: sum.vacant + c.vacant, allocate: sum.allocate + c.allocate }),
    { vacant: 0, allocate: 0 },
  );

  return (
    <div
      className={cn(figtree.className, "absolute inset-0 z-30", open ? "visible" : "invisible")}
      style={{ transition: open ? "visibility 0s" : "visibility 0s linear 300ms" }}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close sections"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        className={cn(
          "absolute top-0 bottom-0 left-0 flex w-[360px] flex-col border-r border-white/10 bg-[#151515]/70 shadow-[24px_0_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-bold text-[#fff8eb]">Sections</p>
            <p className="text-xs leading-none text-[#afaca2]">
              {SECTIONS.length} areas · {totals.vacant} vacant · {totals.allocate} allocated
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-xl border border-[#3a3a3a] bg-white/5 transition hover:bg-white/10"
          >
            <Image src="/figma/tablet-pos/close.svg" alt="" width={24} height={24} className="size-6" />
          </button>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
          {SECTIONS.map((section) => {
            const active = section.id === activeId;
            const c = counts[section.id] ?? { vacant: 0, allocate: 0 };
            return (
              <li key={section.id}>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => onSelect(section.id)}
                  className={cn(
                    "flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition",
                    active
                      ? "border-[#f5dfa8] bg-[rgba(245,223,168,0.1)]"
                      : "border-[#3a3a3a] bg-white/5 hover:border-[#57574f] hover:bg-white/10",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3 leading-none">
                    <span className={cn("text-base font-semibold", active ? "text-[#f5dfa8]" : "text-[#fff8eb]")}>
                      {section.name}
                    </span>
                    <span className="text-xs whitespace-nowrap text-[#8f8f8f]">{rangeLabel(section)}</span>
                  </div>
                  <SectionLegend counts={c} />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
