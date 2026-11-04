"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";

const ASSET = "/figma/terminal";

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", "00", "000"],
] as const;

/** Keyed digits are cents: "1250" reads SGD 12.50. Capped so the amount stays on one line. */
const MAX_DIGITS = 9;
const formatCents = (digits: string) => (Number(digits || "0") / 100).toFixed(2);

const NAV = [
  { id: "payment", label: "Payment", icon: "wallet-open" },
  { id: "history", label: "History", icon: "bill" },
  { id: "settings", label: "Settings", icon: "settings" },
] as const;

/**
 * Terminal Payment 1.0, Figma 5342:4827: the Adyen terminal's idle Payment tab. The waiter keys an
 * amount on the pad. Axiforma (the design's font) is not bundled, so Figtree stands in.
 */
export function TerminalIdleScreen() {
  const [digits, setDigits] = useState("");
  const press = (key: string) =>
    setDigits((d) => {
      const next = (d + key).replace(/^0+/, "");
      return next.length > MAX_DIGITS ? d : next;
    });
  const hasAmount = Number(digits || "0") > 0;

  return (
    <div className={cn(figtree.className, "relative size-full bg-white text-[#27364b]")}>
      <div className="absolute top-0 left-0 z-10 flex h-16 w-[360px] items-center justify-between bg-white px-4 py-2.5 drop-shadow-[0px_6px_10.5px_rgba(7,7,7,0.1)]">
        <div className="flex items-center gap-3">
          <div className="relative size-6 overflow-hidden rounded-[5.714px] bg-[#ff6a00]">
            <div className="absolute inset-[37.5%_15.53%_0_15.33%]">
              <Image src={`${ASSET}/logo-t.svg`} alt="" fill />
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 whitespace-nowrap">
            <p className="text-lg leading-6 font-bold text-[#24242e]">SmartPay Terminal</p>
            <p className="text-xs leading-3 text-[#7b7d8d]">1.0.0(24) / TP016</p>
          </div>
        </div>
        <Image src={`${ASSET}/online.svg`} alt="Online" width={24} height={24} className="size-6" />
      </div>

      <p className="absolute top-[134px] left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
        <span className="text-[19px] leading-6 tracking-[-0.3px] text-[#94a3b8]">SGD</span>{" "}
        <span className="text-5xl leading-[64px] font-extrabold tracking-[-1px]">{formatCents(digits)}</span>
      </p>

      <div className="absolute top-[280px] left-0 flex flex-col items-start gap-3">
        {KEY_ROWS.map((row) => (
          <div key={row.join()} className="flex h-[60px] w-[360px] items-center justify-center gap-[30px] px-8">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className="flex min-w-px flex-1 items-center justify-center rounded-lg p-2.5 text-[22px] leading-7 font-bold tracking-[-0.5px] transition active:bg-[#f1f1f5]"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="flex h-[60px] w-[360px] items-center justify-center gap-[30px] px-8">
          <button
            type="button"
            onClick={() => setDigits("")}
            className="h-10 w-[187px] rounded text-[15px] leading-6 font-semibold transition active:bg-[#f1f1f5]"
          >
            Clear all
          </button>
          <button type="button" aria-label="Backspace" onClick={() => setDigits((d) => d.slice(0, -1))}>
            <Image src={`${ASSET}/backspace.svg`} alt="" width={26} height={26} className="size-[26px]" />
          </button>
        </div>
      </div>

      <div className="absolute top-[644px] left-0 flex flex-col items-start">
        <div className="flex w-[360px] items-start bg-white px-4 py-3.5">
          <button
            type="button"
            disabled={!hasAmount}
            className={cn(
              "flex h-12 w-[328px] items-center justify-center rounded-xl px-2.5 py-3.5 text-[15px] leading-6 font-bold",
              hasAmount ? "bg-[#ff6b00] text-white" : "bg-[rgba(14,14,18,0.05)] text-[rgba(14,14,18,0.4)]",
            )}
          >
            Confirm and Pay
          </button>
        </div>
        <div className="flex w-[360px] items-start border-t border-[#dfdfe8] bg-white">
          {NAV.map((item) => {
            const active = item.id === "payment";
            return (
              <div key={item.id} className="flex h-20 min-w-px flex-1 flex-col items-center justify-start">
                <div className="flex h-2 w-[54px] items-end justify-center px-0.5 pb-[5px]">
                  {active ? <div className="h-[3px] w-full rounded-b-full bg-[#ff6b00]" /> : null}
                </div>
                <div className="flex w-full flex-col items-center gap-1 py-3">
                  <Image src={`${ASSET}/${item.icon}.svg`} alt="" width={24} height={24} className="size-6" />
                  <p
                    className={cn(
                      "text-center text-xs leading-5 font-semibold whitespace-nowrap",
                      active ? "text-[#ff6b00]" : "text-[#9a9cab]",
                    )}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
