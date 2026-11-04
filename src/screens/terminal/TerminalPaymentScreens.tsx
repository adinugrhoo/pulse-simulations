"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { figtree, roboto } from "@/lib/fonts";
import { useSim } from "@/engine/store";

const ASSET = "/figma/terminal";

const money = (amount = 0) => amount.toFixed(2);

/** Figma 5342:7318: the request leaves the terminal. Holds a second before the card reader opens. */
export function TerminalProcessingScreen() {
  return (
    <div className={cn(figtree.className, "relative size-full bg-white")}>
      <div className="absolute top-[199px] left-1/2 size-[200px] -translate-x-1/2">
        <Image
          src={`${ASSET}/processing.gif`}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      </div>
      <p className="absolute top-[441px] left-1/2 w-[328px] -translate-x-1/2 -translate-y-1/2 text-center text-2xl leading-8 font-medium tracking-[-0.8px] text-[#24242e]">
        Processing your payment request
      </p>
      <p className="absolute top-[491px] left-1/2 w-[248px] -translate-x-1/2 -translate-y-1/2 text-center text-sm leading-5 text-[#7b7d8d]">
        Please wait a moment...
      </p>
    </div>
  );
}

function CardLogos() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={`${ASSET}/visa.svg`}
        alt="Visa"
        width={47}
        height={14}
        className="h-[14px] w-[47px]"
      />
      <Image
        src={`${ASSET}/mastercard.svg`}
        alt="Mastercard"
        width={31}
        height={22}
        className="h-[22px] w-[31px]"
      />
      <Image
        src={`${ASSET}/amex.png`}
        alt="American Express"
        width={27}
        height={20}
        className="h-5 w-[27px] rounded object-cover"
      />
    </div>
  );
}

/** Figma 4292:10244: the card reader, waiting for a tap. */
export function TerminalTapCardScreen() {
  const amount = useSim((s) => s.terminal.amount);
  return (
    <div
      className={cn(
        roboto.className,
        "relative size-full bg-white text-[#24242e]",
      )}
    >
      <div className="absolute top-[201px] left-[calc(50%+17px)] h-[143px] w-[230px] -translate-x-1/2">
        <Image
          src={`${ASSET}/tap-card.png`}
          alt=""
          fill
          className="object-cover"
        />
      </div>
      <p className="absolute top-[389px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg leading-6 whitespace-nowrap">
        Please tap the card
      </p>
      <p className="absolute top-[648px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg leading-6 font-medium whitespace-nowrap">
        Total
      </p>
      <p className="absolute top-[688px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[42px] leading-[56px] font-bold tracking-[-1px] whitespace-nowrap">
        SGD{money(amount)}
      </p>
      <div className="absolute top-[728px] left-1/2 -translate-x-1/2">
        <CardLogos />
      </div>
    </div>
  );
}

/** Bits of confetti thrown out of the disc as the check lands: direction and colour per piece. */
const CONFETTI = [
  { dx: -120, dy: -70, c: "#ffffff", s: 8 },
  { dx: 118, dy: -64, c: "#fff3a6", s: 7 },
  { dx: -96, dy: 92, c: "#b8ffd2", s: 6 },
  { dx: 104, dy: 88, c: "#ffffff", s: 9 },
  { dx: -10, dy: -132, c: "#fff3a6", s: 6 },
  { dx: 6, dy: 130, c: "#b8ffd2", s: 8 },
  { dx: -138, dy: 12, c: "#b8ffd2", s: 7 },
  { dx: 136, dy: 4, c: "#fff3a6", s: 6 },
];

/**
 * Figma 4292:10286, animated: green floods out from the disc, the white disc springs in, the green
 * badge pops and its check draws itself, rings ripple and confetti flies, then Done and the amount rise.
 */
export function TerminalDoneScreen() {
  const amount = useSim((s) => s.terminal.amount);
  return (
    <div
      className={cn(
        roboto.className,
        "relative size-full overflow-hidden bg-white",
      )}
    >
      <div className="animate-terminal-done-flood absolute inset-0 bg-[#00c145]" />

      <div className="absolute top-[94px] left-1/2 size-[200px] -translate-x-1/2">
        <div className="animate-terminal-done-ring absolute inset-0 rounded-full border-4 border-white/70" />
        <div className="animate-terminal-done-ring absolute inset-0 rounded-full border-4 border-white/50 [animation-delay:1.2s]" />
        <div className="animate-terminal-done-disc absolute inset-0 rounded-full bg-white" />
        {CONFETTI.map((p, i) => (
          <span
            key={i}
            className="animate-terminal-done-confetti absolute top-1/2 left-1/2 rounded-full"
            style={
              {
                width: p.s,
                height: p.s,
                marginTop: -p.s / 2,
                marginLeft: -p.s / 2,
                background: p.c,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
              } as CSSProperties
            }
          />
        ))}
        <div className="absolute top-[76px] left-[79px] size-[48px] p-1">
          <svg
            viewBox="0 0 40 40"
            className="animate-terminal-done-badge size-10"
            aria-hidden
          >
            <circle cx="20" cy="20" r="20" fill="#00c145" />
            <path
              d="M12 20.5l5.5 5.5L28.5 15"
              fill="none"
              stroke="#fff"
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-terminal-done-check"
            />
          </svg>
        </div>
      </div>

      <div className="animate-terminal-done-rise absolute top-[332px] left-0 flex w-[360px] flex-col items-center text-white">
        <p className="text-lg leading-6 font-semibold">Done</p>
        <p className="text-lg leading-6">SGD{money(amount)}</p>
      </div>
    </div>
  );
}

/**
 * Figma 4296:16006: the receipt page once the card went through. The frame is 960 tall, taller than
 * the 800 display, so the page scrolls under the pinned print / home buttons.
 */
export function TerminalSuccessScreen() {
  const terminal = useSim((s) => s.terminal);
  const setScreen = useSim((s) => s.setTerminalScreen);
  const amount = money(terminal.amount);
  const [date, time] = (terminal.paidAt ?? "").split(" • ");

  return (
    <div
      className={cn(
        figtree.className,
        "relative size-full overflow-hidden bg-[#f0f2f5] text-[#24242e]",
      )}
    >
      <div className="absolute inset-0 overflow-y-auto">
        <div className="relative h-[960px] w-[360px]">
          <div className="absolute top-16 left-0 h-[300px] w-[360px] bg-white" />
          <div className="absolute top-[252px] right-0 left-0 h-40">
            <Image src={`${ASSET}/success-wave.svg`} alt="" fill />
          </div>

          <div className="absolute top-20 left-4 flex w-[328px] flex-col items-center gap-[19px]">
            <div className="relative size-[59px]">
              <Image
                src={`${ASSET}/success.gif`}
                alt=""
                width={51}
                height={51}
                unoptimized
                className="absolute top-1 left-1 size-[51px]"
              />
            </div>
            <div className="flex w-full flex-col items-center gap-1 text-center">
              <p className="text-[22px] leading-7 font-bold tracking-[-0.5px] whitespace-nowrap text-[#00b25f]">
                Payment Successful!
              </p>
              <p className="h-[38px] w-full text-sm leading-5 text-[#4a4857]">
                Please inform the customer about the payment has already been
                successful
              </p>
            </div>
          </div>

          <div className="absolute top-0 left-0 z-10 flex h-16 w-[360px] items-center justify-between bg-white px-4 py-2.5 drop-shadow-[0px_6px_10.5px_rgba(7,7,7,0.1)]">
            <div className="flex flex-col items-start gap-1 whitespace-nowrap">
              <p className="text-lg leading-6 font-bold">
                Payment Confirmation
              </p>
              <p className="text-xs leading-3 text-[#7b7d8d]">
                1.0.0(24) / TP016
              </p>
            </div>
            <Image
              src={`${ASSET}/online.svg`}
              alt="Online"
              width={24}
              height={24}
              className="size-6"
            />
          </div>

          <div className="absolute top-[284px] left-[9px] w-[343px]">
            <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[20px] bg-[#24242e] pb-6 shadow-[0px_4px_54px_-5px_rgba(7,7,7,0.15)]">
              <div className="absolute top-0 left-0 h-[253px] w-[343px] -scale-y-100">
                <Image src={`${ASSET}/card-pattern.svg`} alt="" fill />
              </div>
              <div className="relative flex flex-col items-center gap-5 pt-6">
                <div className="flex w-[343px] flex-col items-center whitespace-nowrap">
                  <p className="-mb-2 flex items-end gap-1 text-[38px] leading-[64px] tracking-[-1px] text-[#f9fafc]">
                    <span className="font-thin">SGD</span>
                    <span>{amount}</span>
                  </p>
                  <p className="flex items-start gap-2 text-base leading-6 font-semibold">
                    <span className="text-[#e4e4eb]">{date}</span>
                    <span className="text-white/50">•</span>
                    <span className="text-[#e4e4eb]">{time}</span>
                  </p>
                </div>
                <Image
                  src={`${ASSET}/card-divider.svg`}
                  alt=""
                  width={311}
                  height={1}
                  className="h-px w-[311px]"
                />
                <div className="flex w-full items-center justify-center gap-2 px-4">
                  <div className="flex min-w-px flex-1 flex-col items-center gap-1 whitespace-nowrap">
                    <p className="text-xs leading-5 text-[#7b7d8d]">
                      Payment ID
                    </p>
                    <p className="text-[15px] leading-6 font-semibold text-[#dfdfe8]">
                      {terminal.paymentId}
                    </p>
                  </div>
                  <p className="text-sm leading-5 text-white/30">|</p>
                  <div className="flex min-w-px flex-1 flex-col items-center gap-1">
                    <p className="text-xs leading-5 text-[#7b7d8d]">
                      Payment By
                    </p>
                    <div className="flex items-start gap-2">
                      <div className="relative h-5 w-[30px] overflow-hidden rounded-[3px]">
                        <Image
                          src={`${ASSET}/card-mastercard.png`}
                          alt="Mastercard"
                          width={36}
                          height={20}
                          className="absolute top-[-0.82%] left-[-10.57%] h-[102.27%] w-[121.14%] max-w-none"
                        />
                      </div>
                      <p className="text-[15px] leading-6 font-semibold whitespace-nowrap text-[#dfdfe8]">
                        ** 8568
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-[524px] left-4 flex w-[328px] flex-col items-center drop-shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
            <Image
              src={`${ASSET}/receipt-top.svg`}
              alt=""
              width={328}
              height={16}
              className="h-4 w-[328px]"
            />
            <div className="w-full bg-white px-4 pt-5 pb-2">
              <p className="text-lg leading-6 font-bold text-[#24242e]">
                Payment Details
              </p>
            </div>
            <div className="flex w-full flex-col gap-px">
              <div className="flex w-full -scale-y-100 items-start">
                <Image
                  src={`${ASSET}/receipt-notch-left.svg`}
                  alt=""
                  width={18}
                  height={16}
                  className="h-4 w-[18px]"
                />
                <div className="min-w-px flex-1 self-stretch bg-white" />
                <Image
                  src={`${ASSET}/receipt-notch-right.svg`}
                  alt=""
                  width={18}
                  height={16}
                  className="h-4 w-[18px] rotate-180 -scale-y-100"
                />
              </div>
              <div className="flex w-full items-start">
                <Image
                  src={`${ASSET}/receipt-notch-left.svg`}
                  alt=""
                  width={18}
                  height={16}
                  className="h-4 w-[18px]"
                />
                <div className="min-w-px flex-1 self-stretch bg-white" />
                <Image
                  src={`${ASSET}/receipt-notch-right.svg`}
                  alt=""
                  width={18}
                  height={16}
                  className="h-4 w-[18px] rotate-180 -scale-y-100"
                />
              </div>
            </div>
            <div className="flex w-[328px] flex-col items-center justify-center gap-2.5 bg-white px-4 py-3">
              <div className="flex w-full items-center justify-between">
                <p className="text-sm leading-5 whitespace-nowrap text-[#7b7d8d]">
                  Amount to be paid
                </p>
                <p className="flex items-start gap-0.5 text-[15px] leading-6 whitespace-nowrap text-[#7b7d8d]">
                  <span>SGD</span>
                  <span className="font-semibold">{amount}</span>
                </p>
              </div>
              <Image
                src={`${ASSET}/receipt-divider.svg`}
                alt=""
                width={296}
                height={1}
                className="h-px w-full"
              />
              <div className="flex w-full items-start justify-between">
                <p className="text-lg leading-6 font-bold whitespace-nowrap">
                  Total Charge
                </p>
                <p className="flex items-start gap-0.5 leading-6 whitespace-nowrap">
                  <span className="text-[15px]">SGD</span>
                  <span className="text-lg font-bold">{amount}</span>
                </p>
              </div>
            </div>
            <Image
              src={`${ASSET}/receipt-bottom.svg`}
              alt=""
              width={328}
              height={16}
              className="h-4 w-[328px]"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-10 flex w-[360px] flex-col items-center gap-4 bg-white px-4 pt-3 pb-4 drop-shadow-[0px_-4px_27px_rgba(7,7,7,0.15)]">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ff6b00] text-[15px] leading-6 font-bold text-white"
        >
          Print Customer Receipt
        </button>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#ff6b00] text-[15px] leading-6 font-bold text-white"
        >
          Print Merchant Receipt
        </button>
        <button
          type="button"
          onClick={() => setScreen("idle")}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-[#dfdfe8] text-[15px] leading-6 font-bold text-[#4a4857]"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
