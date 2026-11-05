"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { figtree, rubik } from "@/lib/fonts";
import { TERMINAL_QR_LABEL, useSim } from "@/engine/store";
import type { TerminalQrOption } from "@/engine/state";
import { currency } from "@/engine/types";
import {
  Approved,
  PresentCard,
} from "@/screens/tablet/sheets/SameDevicePayment";
import { QrCodeSvg } from "@/stage/device/QrCodeSvg";

const ASSET = "/figma/terminal";

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

const amountLabel = (amount = 0) => currency(amount).replace(/^SGD/, "SGD ");

/** One logo box per wallet: the images sit centred in a 46x30.7 white chip, as in Figma 5359:7550. */
function WalletLogo({
  option,
  className,
}: {
  option: TerminalQrOption;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      {option === "grabpay" ? (
        <Image
          src={`${ASSET}/qr-grabpay.png`}
          alt="GrabPay"
          width={300}
          height={260}
          className="absolute top-[10%] left-1/2 h-[80%] w-[63.3%] -translate-x-[48%] object-cover"
        />
      ) : option === "paynow" ? (
        <Image
          src={`${ASSET}/qr-paynow.png`}
          alt="PayNow"
          width={211}
          height={133}
          className="absolute top-1/2 left-1/2 h-[65%] w-[70%] -translate-x-[48%] -translate-y-1/2 object-cover"
        />
      ) : (
        <div className="absolute top-1/2 left-1/2 h-[70%] w-[53.3%] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
          <Image
            src={`${ASSET}/qr-wechat.png`}
            alt="WeChat Pay"
            width={800}
            height={245}
            className="absolute top-0 left-0 h-full w-[285.71%] max-w-none"
          />
        </div>
      )}
    </div>
  );
}

const QR_OPTIONS: { id: TerminalQrOption; label: string }[] = [
  { id: "grabpay", label: "GrabPay" },
  { id: "paynow", label: "PayNow" },
  { id: "wechat", label: "WeChat Pay" },
];

/**
 * Figma 5359:7550: the QR button grows into the "Select QR Code" sheet. The dark page expands out of
 * the button's circle, then the options rise in; Cancel shrinks it back.
 */
function QrMenu({
  onPick,
  onCancel,
}: {
  onPick: (option: TerminalQrOption) => void;
  onCancel: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const cancel = () => {
    setClosing(true);
    setTimeout(onCancel, 350);
  };

  return (
    <div
      className={cn(
        figtree.className,
        "absolute inset-0 z-20 bg-[#0e1a34]",
        closing
          ? "animate-terminal-fab-collapse"
          : "animate-terminal-fab-expand",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-[516px] flex justify-center",
          closing
            ? "animate-terminal-fab-fade-out"
            : "animate-terminal-fab-content",
        )}
      >
        <div className="flex flex-col gap-3">
          <p
            className={cn(
              rubik.className,
              "text-2xl leading-none font-medium whitespace-nowrap text-white",
            )}
          >
            Select QR Code
          </p>
          {QR_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              className="relative flex h-12 w-[328px] items-center justify-center rounded-xl bg-white px-2.5 py-3.5 text-[15px] leading-6 font-bold text-[#24242e]"
            >
              <WalletLogo
                option={o.id}
                className="absolute top-[8.67px] left-4 h-[30.667px] w-[46px] rounded-[4.6px]"
              />
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={cancel}
            className="flex h-12 w-[328px] items-center justify-center rounded-xl bg-white/20 text-[15px] leading-6 font-bold text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Figma 5359:7616: a wallet's QR for the customer to scan, with that wallet's logo in the middle. */
function QrPayment({
  option,
  amount,
}: {
  option: TerminalQrOption;
  amount?: number;
}) {
  return (
    <div className={cn(rubik.className, "absolute inset-0 bg-[#0e1a34]")}>
      <div className="absolute top-10 left-5 flex gap-2">
        <Image
          src="/figma/tablet-payment/same-device/dot-active.svg"
          alt=""
          width={16}
          height={16}
          className="animate-reader-dot size-4"
        />
        {[0, 1, 2].map((i) => (
          <Image
            key={i}
            src="/figma/tablet-payment/same-device/dot.svg"
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        ))}
      </div>
      <p className="absolute top-[104px] left-5 -translate-y-1/2 text-5xl leading-[56px] font-medium tracking-[-1px] whitespace-nowrap text-[#d8e2ea]">
        {amountLabel(amount)}
      </p>
      <p className="absolute top-[159px] left-5 -translate-y-1/2 text-2xl leading-none font-light tracking-[-1px] whitespace-nowrap text-[#dae7fc]">
        Total amount
      </p>
      <div className="animate-terminal-fab-content absolute top-[306px] left-1/2 size-[188px] -translate-x-1/2 rounded-[20px] bg-white">
        <QrCodeSvg
          seed={`${option}-${amount}`}
          size={140}
          fg="#000"
          clearCenter
          className="absolute top-6 left-6"
        />
        <div className="absolute top-[67px] left-[67px] size-[54px] rounded-[6.5px] bg-white" />
        <WalletLogo
          option={option}
          className="absolute top-[74px] left-[73px] h-7 w-[42px] rounded-[4px]"
        />
      </div>
    </div>
  );
}

/**
 * Figma 5342:5391: the terminal waits for a card, with the QR button in the corner. The button opens
 * the wallet sheet; picking a wallet swaps the reader for that wallet's QR.
 */
export function TerminalTapCardScreen() {
  const terminal = useSim((s) => s.terminal);
  const open = useSim((s) => s.openTerminalQrMenu);
  const close = useSim((s) => s.closeTerminalQrMenu);
  const choose = useSim((s) => s.chooseTerminalQr);

  if (terminal.qrOption)
    return <QrPayment option={terminal.qrOption} amount={terminal.amount} />;
  return (
    <div className="relative size-full">
      <PresentCard amount={terminal.amount ?? 0} onQr={open} />
      {terminal.qrMenu ? <QrMenu onPick={choose} onCancel={close} /> : null}
    </div>
  );
}

/** Figma 5342:5415: same Approved page and animation as same-device payment, held until the keypad returns. */
export function TerminalApprovedScreen() {
  return (
    <div className="relative size-full">
      <Approved />
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
  const amount = (terminal.amount ?? 0).toFixed(2);
  const [date, time] = (terminal.paidAt ?? "").split(" • ");

  return (
    <div
      className={cn(
        figtree.className,
        "relative size-full overflow-hidden bg-[#f0f2f5] text-[#24242e]",
      )}
    >
      <div className="absolute inset-0 overflow-y-auto">
        <div className="relative h-[960px] w-full">
          <div className="absolute top-16 left-0 h-[300px] w-full bg-white" />
          <div className="absolute top-[252px] right-0 left-0 h-40">
            <Image src={`${ASSET}/success-wave.svg`} alt="" fill />
          </div>

          <div className="absolute inset-x-0 top-20 mx-auto flex w-[328px] flex-col items-center gap-[19px]">
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

          <div className="absolute top-0 left-0 z-10 flex h-16 w-full items-center justify-between bg-white px-4 py-2.5 drop-shadow-[0px_6px_10.5px_rgba(7,7,7,0.1)]">
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

          <div className="absolute inset-x-0 top-[284px] mx-auto w-[343px]">
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
                    {terminal.qrOption ? (
                      <div className="flex items-center gap-2">
                        <WalletLogo option={terminal.qrOption} className="h-5 w-[30px] rounded-[3px]" />
                        <p className="text-[15px] leading-6 font-semibold whitespace-nowrap text-[#dfdfe8]">
                          {TERMINAL_QR_LABEL[terminal.qrOption]}
                        </p>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[524px] mx-auto flex w-[328px] flex-col items-center drop-shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
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

      <div className="absolute bottom-0 left-0 z-10 flex w-full flex-col items-center gap-4 bg-white px-4 pt-3 pb-4 drop-shadow-[0px_-4px_27px_rgba(7,7,7,0.15)]">
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
