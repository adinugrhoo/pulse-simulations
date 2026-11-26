"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { figtree, rubik } from "@/lib/fonts";
import { currency } from "@/engine/types";
import type { TerminalQrOption, TerminalScreen } from "@/engine/state";
import { QrPayment } from "@/screens/terminal/TerminalPaymentScreens";

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

/** The contactless waves, drawn in `currentColor`. */
function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className}>
      <path d="M8.5 8.8a5 5 0 0 1 0 6.4" />
      <path d="M12 6.2a9 9 0 0 1 0 11.6" />
      <path d="M15.5 3.6a13 13 0 0 1 0 16.8" />
      <path d="M5 11.3a1.4 1.4 0 0 1 0 1.4" />
    </svg>
  );
}

/** A plain bank card, no brand: chip, contactless mark and the last four digits. */
function CardArt() {
  return (
    <div className="relative h-[190px] w-[300px] overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#6f9cff_0%,#3466e0_42%,#1a378a_100%)] shadow-[0_28px_60px_-14px_rgba(24,70,200,0.75)] ring-1 ring-white/25">
      {/* sheen across the top left */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_42%)]" />
      <div className="absolute top-[58px] left-7 h-9 w-12 rounded-lg bg-[linear-gradient(135deg,#f6dc95_0%,#c99f3c_100%)] ring-1 ring-black/10" />
      <ContactlessIcon className="absolute top-[60px] left-[92px] size-8 text-white/90" />
      <p className="absolute bottom-6 left-7 text-xl leading-none tracking-[0.18em] text-white/90">•••• 4242</p>
    </div>
  );
}

/**
 * The tablet as the card reader in same-device payment, laid out for the tablet rather than
 * the terminal's 360px column. The guest sits across the table, so the whole page is turned
 * 180° to read from their side. The reader is under the printer dock at the top centre of the
 * tablet, the bottom of the page once turned: "Tap card here" and its arrows sit on that edge,
 * the card above dips toward it, and the glow behind beats twice each time the card lands.
 */
export function TabletPresentCard({ amount }: { amount: number }) {
  return (
    <div className={cn(rubik.className, "absolute inset-0 overflow-hidden bg-[#0e1a34]")}>
      <div className="absolute inset-0 rotate-180">
        {/* lighter toward the reader edge, with a heartbeat glow sitting on the reader */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b1530_0%,#0e1a34_45%,#132a5e_100%)]" />
        <div
          aria-hidden
          className="animate-reader-heartbeat absolute -bottom-[380px] left-1/2 h-[720px] w-[1180px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(78,140,255,0.6)_0%,rgba(78,140,255,0.18)_58%,rgba(78,140,255,0)_100%)] [animation-delay:-1.44s]"
        />

        {/* the reader's four status lights, the first one waiting */}
        <div className="absolute top-12 left-16 flex gap-3">
          <Image src={`${ASSET}/dot-active.svg`} alt="" width={20} height={20} className="animate-reader-dot size-5" />
          {[0, 1, 2].map((i) => (
            <Image key={i} src={`${ASSET}/dot.svg`} alt="" width={20} height={20} className="size-5" />
          ))}
        </div>

        <div className="absolute inset-x-0 top-[96px] flex flex-col items-center gap-6 text-center">
          <p className="text-[112px] leading-none font-medium tracking-[-3px] whitespace-nowrap text-[#eef3fb] tabular-nums">
            {currency(amount).replace(/^SGD/, "SGD ")}
          </p>
          <p className="text-[40px] leading-none font-light tracking-[-0.5px] text-[#dae7fc]">Present card</p>
        </div>

        {/* the card dips toward the reader and back */}
        <div className="absolute top-[350px] left-1/2 -translate-x-1/2">
          <div className="animate-reader-card-tap">
            <CardArt />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <p className="flex items-center gap-3 rounded-full bg-[#eef3fb] py-4 pr-8 pl-6 text-[28px] leading-none font-semibold whitespace-nowrap text-[#0e1a34] shadow-[0_0_48px_rgba(96,150,255,0.55)]">
            <ContactlessIcon className="size-8" />
            Tap card here
          </p>
          {/* arrows running to the reader edge */}
          <div aria-hidden className="mt-2 flex flex-col items-center text-[#a9c6ff]">
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                viewBox="0 0 32 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-reader-chevron -mt-1.5 h-5 w-10"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <path d="M4 3l12 9 12-9" />
              </svg>
            ))}
          </div>
          {/* where the reader is, right under the dock */}
          <div className="animate-reader-heartbeat mt-3 h-2.5 w-[280px] rounded-t-full bg-[#9cc0ff] shadow-[0_0_32px_10px_rgba(110,160,255,0.7)] [animation-delay:-1.44s]" />
        </div>

        <Image src={`${ASSET}/qr.svg`} alt="Pay by QR" width={64} height={64} className="absolute bottom-12 left-16 size-16" />
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
export function SameDevicePaymentOverlay({
  screen,
  amount,
  qrOption,
}: {
  screen: TerminalScreen;
  amount: number;
  qrOption?: TerminalQrOption;
}) {
  if (screen === "processing") return <Processing />;
  if (screen === "tap-card") {
    if (!qrOption) return <TabletPresentCard amount={amount} />;
    // the wallet QR page is laid out for the terminal's narrow screen, so it sits centred on the tablet
    return (
      <div className="absolute inset-0 bg-[#0e1a34]">
        <div className="absolute inset-y-0 left-1/2 w-[400px] -translate-x-1/2">
          <QrPayment option={qrOption} amount={amount} />
        </div>
      </div>
    );
  }
  if (screen === "done") return <Approved />;
  return null;
}
