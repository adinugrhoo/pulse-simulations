"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import type { TabletScreenId } from "@/engine/screens";
import { useSim } from "@/engine/store";

const TABS: { id: TabletScreenId; label: string; icon: string }[] = [
  { id: "tables", label: "Table", icon: "nav-table" },
  { id: "orders", label: "Order", icon: "nav-order" },
  { id: "settings", label: "Settings", icon: "nav-settings" },
];

/** Bottom navigation shared by the tablet floor screens (Figma 1802:11665 / 2861:12521). */
export function TabletTabBar({ className }: { className?: string }) {
  const screen = useSim((s) => s.screens.tablet);
  const setScreen = useSim((s) => s.setScreen);

  return (
    <div
      className={cn(
        "absolute bottom-0 left-1/2 flex w-[1280px] -translate-x-1/2 items-center justify-center bg-[#151515]",
        className,
      )}
    >
      {TABS.map((tab) => {
        const active = tab.id === screen;
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(undefined, tab.id)}
            className="flex h-full w-[140px] flex-col items-center justify-center gap-3 pb-3"
          >
            <div className={cn("h-0.5 w-8 rounded-full", active && "w-16 bg-[#f5dfa8]")} />
            <div className="flex flex-col items-center gap-1">
              <Image src={`/figma/tablet-tables/${tab.icon}.svg`} alt="" width={24} height={24} />
              <span className={cn("text-sm leading-none", active ? "font-semibold text-[#f5dfa8]" : "text-[#8f8f8f]")}>
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
