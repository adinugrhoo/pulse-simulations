"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { useSim } from "@/sim/store";

const ASSET = "/figma/mobile-nav";

type TabId = "home" | "bill";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "HOME", icon: "house" },
  { id: "bill", label: "VIEW AND PAY BILL", icon: "receipt" },
];

/**
 * Figma: Pulse, node 2099:4590 — the two-item bottom bar under the mobile home
 * screen. The source file's primary is orange (#ff6b00); the mobile design system
 * in this sim is home's maroon (#43263c, see MenuScreen), so the active tab uses
 * that instead. The 4px active rule rides the top edge of the selected half.
 */
export function MobileTabBar({ active, badge }: { active: TabId; badge?: TabId }) {
  const dispatch = useSim((s) => s.dispatch);

  const go = (id: TabId) =>
    id === "home"
      ? dispatch({ type: "sim/navigate", mobile: "menu" })
      : dispatch({ type: "customer/request-bill" });

  return (
    <div className="relative flex shrink-0 items-center justify-between bg-white px-5 py-2 shadow-[0px_0px_25px_-5px_rgba(0,0,0,0.1),0px_-10px_10px_-5px_rgba(0,0,0,0.04)]">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => go(tab.id)}
            className="relative flex min-w-px flex-1 flex-col items-center gap-1"
          >
            <Image
              src={`${ASSET}/${tab.icon}-${isActive ? "active" : "idle"}.svg`}
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
            <span
              className={cn(
                "text-center text-xs leading-normal",
                isActive ? "font-bold text-[#43263c]" : "text-[#4a4857]",
              )}
            >
              {tab.label}
            </span>
            {badge === tab.id ? (
              <span className="absolute top-0 left-[85.75px] size-2.5 rounded-full bg-[#f51b34]" />
            ) : null}
          </button>
        );
      })}
      <div
        className={cn(
          "absolute top-0 h-1 w-[168px] rounded-b bg-[#43263c]",
          active === "home" ? "left-[19px]" : "right-[19px]",
        )}
      />
    </div>
  );
}
