"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { figtree, rubik } from "@/lib/fonts";
import { currency } from "@/engine/types";
import type { TerminalScreen } from "@/engine/state";

const ASSET = "/figma/tablet-payment/same-device";

/** Figma 3166:21666: the tablet asks its own reader to start. */
function Processing() {
  return (
    <div className={cn(figtree.className, "absolute inset-0 bg-[#121415]")}>
      <div
        className="absolute top-[255px] left-[510px] flex size-[260px] items-center justify-center"
        style={{ background: "radial-gradient(circle at center, rgba(141,154,169,0.2) 0%, rgba(141,154,169,0) 100%)" }}
      >
        <Image src={`${ASSET}/card.svg`} alt="" width={120} height={120} className="size-[120px]" />
      </div>
      <div className="absolute top-[497px] left-[503px] flex w-[275px] flex-col items-center gap-4 text-center leading-none">
        <p className="w-full text-lg font-semibold text-white">Processing your payment request</p>
        <p className="w-full text-sm text-[#cdcdcd]">Please wait a moment...</p>
      </div>
    </div>
  );
}

/** Figma 3168:22962: the tablet becomes the card reader. */
export function PresentCard({ amount, onQr }: { amount: number; onQr?: () => void }) {
  return (
    <div className={cn(rubik.className, "absolute inset-0 bg-[#0e1a34]")}>
      <div className="absolute top-0 left-1/2 h-[800px] w-[360px] -translate-x-1/2">
        <div className="absolute top-10 left-5 flex gap-2">
          <Image src={`${ASSET}/dot-active.svg`} alt="" width={16} height={16} className="animate-reader-dot size-4" />
          {[0, 1, 2].map((i) => (
            <Image key={i} src={`${ASSET}/dot.svg`} alt="" width={16} height={16} className="size-4" />
          ))}
        </div>
        <p className="absolute top-[104px] left-5 -translate-y-1/2 text-5xl leading-[56px] font-medium tracking-[-1px] whitespace-nowrap text-[#d8e2ea]">
          {currency(amount).replace(/^SGD/, "SGD ")}
        </p>
        <p className="absolute top-[159px] left-5 -translate-y-1/2 text-2xl leading-none font-light tracking-[-1px] whitespace-nowrap text-[#dae7fc]">
          Present card
        </p>
        {onQr ? (
          <button type="button" aria-label="Pay by QR" onClick={onQr} className="absolute top-[720px] left-5 size-[60px] rounded-full">
            <Image src={`${ASSET}/qr.svg`} alt="" width={60} height={60} className="size-[60px]" />
          </button>
        ) : (
          <Image src={`${ASSET}/qr.svg`} alt="Pay by QR" width={60} height={60} className="absolute top-[720px] left-5 size-[60px]" />
        )}
      </div>
    </div>
  );
}

/**
 * Figma 3168:23002, animated: the green disc springs in with ripples, the check draws itself,
 * Approved drops in from above and Thank you rises from below.
 */
export function Approved() {
  return (
    <div className={cn(rubik.className, "absolute inset-0 bg-[#0e1a34]")}>
      <div className="absolute top-0 left-1/2 h-[800px] w-[360px] -translate-x-1/2">
        <p className="animate-terminal-done-rise absolute top-[151px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[52px] leading-[56px] font-medium tracking-[-1px] whitespace-nowrap text-[#d8e2ea] [animation-delay:0.3s]">
          Approved
        </p>
        <div className="absolute top-1/2 left-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2">
          <div className="animate-terminal-done-ring absolute inset-0 rounded-full border-4 border-[#18a85e]/70 [animation-delay:0.5s]" />
          <div className="animate-terminal-done-ring absolute inset-0 rounded-full border-4 border-[#18a85e]/50 [animation-delay:1.1s]" />
          <svg viewBox="0 0 240 240" className="animate-terminal-done-disc absolute inset-0 size-full [animation-delay:0s]" aria-hidden>
            <circle cx="120" cy="120" r="120" fill="#18A85E" />
            <path
              d="M89.67 124.33L107 141.67 150.33 98.33"
              fill="none"
              stroke="#0E1A34"
              strokeWidth={19.72}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-approved-check"
            />
          </svg>
        </div>
        <p className="animate-terminal-done-rise absolute top-[681px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[32px] leading-[56px] font-medium tracking-[-1px] whitespace-nowrap text-[#d8e2ea] [animation-delay:0.8s]">
          Thank you!
        </p>
      </div>
    </div>
  );
}

/**
 * Same-device payment: SmartPay runs on the waiter's tablet itself, full screen over the order
 * detail, through the same timed steps as the terminal (processing, present card, approved).
 */
export function SameDevicePaymentOverlay({ screen, amount }: { screen: TerminalScreen; amount: number }) {
  if (screen === "processing") return <Processing />;
  if (screen === "tap-card") return <PresentCard amount={amount} />;
  if (screen === "done") return <Approved />;
  return null;
}
