"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { currency } from "@/sim/types";
import { CloseIcon, Sheet } from "./PaidTableSheets";

const ASSET = "/figma/tablet-payment";

/** Figma 2928:17061: pick how the waiter collects the bill. Only the offline Cash option exists. */
export function CollectPaymentSheet({
  total,
  onClose,
  onCash,
}: {
  total: number;
  onClose: () => void;
  onCash: () => void;
}) {
  return (
    <Sheet width={460} height={386} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Collect Payment</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <div className="absolute top-[124px] left-[30px] flex w-[400px] flex-col gap-3">
        <p className="w-full text-sm leading-none font-semibold text-[#f0f2f7]">Payment Total</p>
        <div className="flex w-full items-center justify-between rounded-2xl bg-[#2f2d2b] p-5">
          <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{currency(total)}</p>
          <Image src={`${ASSET}/swap.svg`} alt="" width={18} height={18} className="size-[18px]" />
        </div>
      </div>

      <div className="absolute top-[238px] left-[30px] flex w-[400px] flex-col gap-3">
        <div className="flex h-9 w-[219px] flex-col gap-1.5 text-sm leading-none">
          <p className="w-full font-semibold text-[#f0f2f7]">Offline</p>
          <p className="w-full text-[#888c98]">Collect payment manually</p>
        </div>
        <button
          type="button"
          onClick={onCash}
          className="flex h-[54px] w-full items-center gap-3 rounded-2xl border border-[#6e5e41] bg-[#1b1b1b] p-[17px] transition hover:brightness-125"
        >
          <Image src={`${ASSET}/cash.svg`} alt="" width={20} height={20} className="size-5" />
          <span className="text-base leading-6 font-semibold whitespace-nowrap text-[#e8bc6b]">Cash</span>
        </button>
      </div>
    </Sheet>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/** Next amount string after a keypress: one dot, two decimals, no leading zeros, capped length. */
export const pressKey = (amount: string, key: string) => {
  if (key === "back") return amount.slice(0, -1);
  if (key === ".") return amount.includes(".") ? amount : `${amount || "0"}.`;
  if (amount.includes(".") && amount.split(".")[1].length >= 2) return amount;
  if (amount.length >= 8) return amount;
  return amount === "0" ? key : amount + key;
};

/** Keypad for the cash the customer hands over, styled like the other tablet sheets. */
export function CashPaymentSheet({
  total,
  amount,
  onKey,
  onClose,
  onConfirm,
}: {
  total: number;
  amount: string;
  onKey: (key: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const tendered = Number(amount) || 0;
  const enough = tendered >= total;

  return (
    <Sheet width={460} height={640} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Collect Payment</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <div className="absolute top-[124px] left-[30px] flex w-[400px] flex-col gap-3">
        <p className="w-full text-sm leading-none font-semibold text-[#f0f2f7]">Payment Total</p>
        <div className="flex w-full items-center justify-between rounded-2xl bg-[#2f2d2b] p-5">
          <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{currency(total)}</p>
          <p className="text-sm leading-none text-[#888c98]">Cash</p>
        </div>
      </div>

      <div className="absolute top-[236px] left-[30px] flex w-[400px] items-baseline justify-between leading-none">
        <span className="text-sm font-semibold text-[#f0f2f7]">Cash received</span>
        <span className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-[#888c98]">SGD</span>
          <span className={cn("text-[40px] font-bold", amount ? "text-[#fcdfa2]" : "text-[#646667]")}>{amount || "0"}</span>
        </span>
      </div>

      <div className="absolute top-[300px] left-[30px] grid w-[400px] grid-cols-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={key === "back" ? "Delete" : key}
            onClick={() => onKey(key)}
            className="flex h-[56px] items-center justify-center rounded-xl text-2xl leading-none font-semibold text-[#fff8eb] transition hover:bg-white/5 active:bg-white/10"
          >
            {key === "back" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="#e8bc6b" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
                <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM17 9.5l-5 5M12 9.5l5 5" />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      <div className="absolute bottom-6 left-[30px] w-[400px]">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!enough}
          style={{ backgroundImage: "linear-gradient(85.8deg, rgb(170, 127, 30) 0%, rgb(144, 105, 14) 52%, rgb(170, 130, 37) 99.8%)" }}
          className="flex h-[46px] w-full items-center justify-center rounded-xl border border-[#e8bc6b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">Confirm Payment</span>
        </button>
      </div>
    </Sheet>
  );
}

/** Left offset (% of the 400px receipt edge) of each scallop in Figma 2928:17316. */
const TEETH = [
  0.25, 4, 8, 11.75, 15.75, 19.75, 23.75, 27.5, 31.5, 35.25, 39.25, 43, 47, 50.75, 54.75, 58.5, 62.75, 66.5, 70.25,
  74.25, 78, 82, 85.75, 89.75, 93.5, 97.5,
];

/** Figma 2928:17286: receipt of what was collected and the change to hand back. */
export function PaymentConfirmedSheet({
  total,
  tendered,
  onClose,
}: {
  total: number;
  tendered: number;
  onClose: () => void;
}) {
  const change = Math.max(0, Math.round((tendered - total) * 100) / 100);

  return (
    <Sheet width={460} height={430} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Payment Confirmed</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <div className="absolute top-[130px] left-[30px] flex h-[190px] w-[400px] flex-col">
        <div className="flex h-[170px] w-full flex-col gap-5 rounded-t-xl bg-[#1b1b1b] px-5 pt-5 drop-shadow-[0_8px_12px_rgba(26,26,26,0.05)]">
          <div className="flex w-[353px] flex-col gap-[26px]">
            <div className="flex w-full items-center justify-between text-sm leading-none whitespace-nowrap text-[#cdcdcd]">
              <p>Total bill</p>
              <p>{currency(total)}</p>
            </div>
            <div className="flex w-full items-center justify-between text-sm leading-none whitespace-nowrap text-[#cdcdcd]">
              <p>Cash payment</p>
              <p>{currency(tendered)}</p>
            </div>
            <div className="relative h-0 w-full">
              <Image src={`${ASSET}/line.svg`} alt="" width={353} height={1} className="absolute inset-x-0 -top-px block h-px w-[353px] max-w-none" />
            </div>
            <div className="flex w-full items-center justify-between text-xl leading-none font-bold whitespace-nowrap text-[#cdcdcd]">
              <p>Change</p>
              <p>{currency(change)}</p>
            </div>
          </div>
        </div>
        <div className="relative h-5 w-full overflow-clip">
          <div className="absolute top-0 right-0 bottom-1/2 left-0">
            <Image src={`${ASSET}/receipt-edge.svg`} alt="" width={400} height={10} className="size-full max-w-none" />
          </div>
          {TEETH.map((left) => (
            <div key={left} className="absolute top-[20%] bottom-[20%]" style={{ left: `${left}%`, width: "3%" }}>
              <Image src={`${ASSET}/receipt-tooth.svg`} alt="" width={12} height={12} className="size-full max-w-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-[30px] flex w-[400px]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-[46px] min-w-px flex-1 items-center justify-center rounded-2xl bg-[#433a31] px-5 py-2.5 transition hover:brightness-125"
        >
          <span className="text-sm leading-none whitespace-nowrap text-[#fcdfa2]">Back to Tables</span>
        </button>
      </div>
    </Sheet>
  );
}
