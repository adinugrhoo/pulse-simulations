"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { platformFee } from "@/engine/bill";
import { useSim } from "@/engine/store";
import { MobileTabBar } from "../shared/MobileTabBar";

const ASSET = "/figma/mobile-payment-success";
const fmt = (n: number) => n.toFixed(2);

/** Elapsed sim ticks as the frames' hh:mm:ss clock; a tick is one dispatched event. */
const clock = (ticks: number) => {
  const h = Math.floor(ticks / 3600);
  const m = Math.floor((ticks % 3600) / 60);
  return [h, m, ticks % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

/** The frames' spoon mark in the app's maroon, bobbing while it waits. */
function Spoon() {
  return (
    <svg viewBox="0 0 24 56" className="h-14 w-6 animate-pulse" aria-hidden>
      <ellipse cx="12" cy="14" rx="9" ry="12" style={{ fill: "var(--mobile-primary)" }} />
      <rect x="10" y="24" width="4" height="30" rx="2" style={{ fill: "var(--mobile-primary)" }} />
    </svg>
  );
}

/** Figma 2099:11310: "Checking your orders…" before the bill appears; moves on by itself. */
export function BillLoadingScreen() {
  const dispatch = useSim((s) => s.dispatch);
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: "sim/navigate", mobile: "bill" }), 1400);
    return () => clearTimeout(t);
  }, [dispatch]);

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="flex flex-1 flex-col items-center justify-center gap-24 pb-10">
        <Spoon />
        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl leading-8 font-semibold text-[#24242e]">Checking your orders...</p>
          <p className="text-base leading-6 text-[#7b7d8d]">please wait...</p>
        </div>
      </div>
      <MobileTabBar active="bill" badge="bill" />
    </div>
  );
}

function TableCard({ label, amount, details }: { label: string; amount: number; details?: { time: string; orderId: string } }) {
  return (
    <div className="flex w-[343px] flex-col items-center">
      <div className="flex w-full flex-col items-center gap-5 rounded-t-xl bg-[#24242e] pb-6 shadow-[0px_4px_54px_-5px_rgba(7,7,7,0.15)]">
        <div className="flex items-center">
          <Image src={`${ASSET}/table-pill-left.svg`} alt="" width={28} height={25} />
          <div className="flex items-center gap-2 border-b-[1.5px] border-[#00b25f] bg-white/5 px-8 py-2.5">
            <Image src={`${ASSET}/table-icon.svg`} alt="" width={24} height={24} />
            <span className="text-base leading-6 font-bold text-white">{label}</span>
          </div>
          <Image src={`${ASSET}/table-pill-right.svg`} alt="" width={28} height={25} />
        </div>
        <div className="flex flex-col items-center gap-4 text-[#f9fafc]">
          <div className="flex items-center gap-1">
            <span className="text-base leading-4">SGD</span>
            <span className="text-[32px] leading-10 font-bold">{fmt(amount)}</span>
          </div>
          {details ? (
            <>
              <p className="text-base leading-6 font-bold">Table time • {details.time}</p>
              <div className="h-px w-[311px] bg-white/15" />
              <div className="flex w-full items-center justify-center gap-2 px-4">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs leading-5 tracking-wide text-[#7b7d8d] uppercase">Order ID</span>
                  <span className="text-base leading-6 font-bold text-[#dfdfe8]">{details.orderId}</span>
                </div>
                <div className="h-7 w-px bg-white/15" />
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs leading-5 tracking-wide text-[#7b7d8d] uppercase">Payment Details</span>
                  <span className="text-sm leading-6 font-bold whitespace-nowrap text-[#dfdfe8]">Debit/Credit Card</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** "My Order" receipt with the customer's share and what they paid, Figma 2099:11328 / 2099:11464. */
function PaidReceipt() {
  const r = useSim((s) => s.customer.lastPartial);
  const [all, setAll] = useState(false);
  if (!r) return null;
  const service = Math.round(r.items * 0.05 * 100) / 100;
  const gst = r.grand - r.items - service;
  const lines = all ? r.lines : r.lines.slice(0, 1);
  const row = (k: string, v: string, muted = true) => (
    <div className={cn("flex items-center justify-between text-sm leading-5", muted ? "text-[#7b7d8d]" : "font-bold text-[#4a4857]")}>
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
  return (
    <div className="flex w-[343px] flex-col overflow-hidden rounded-lg shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
      <div className="bg-white px-4 pt-5 pb-2">
        <p className="text-lg leading-6 font-bold text-[#24242e]">My Order</p>
        <p className="text-xs leading-5 text-[#7b7d8d]">Table: {r.tableLabel}</p>
      </div>
      <div className="flex flex-col gap-2 bg-white px-4 py-3">
        {lines.map((l) => (
          <div key={l.lineId} className="flex items-start gap-4 text-sm">
            <p className="flex-1 text-[#24242e]">{l.name}</p>
            <span className="text-[#7b7d8d]">x {l.qty}</span>
            <span className="w-20 text-right font-bold text-[#4a4857]">SGD {fmt(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        {r.lines.length > 1 ? (
          <button onClick={() => setAll((a) => !a)} className="self-center border-t border-dashed border-[#e4e4eb] pt-2 text-sm text-[#4a4857] underline decoration-dashed underline-offset-4">
            {all ? "Show fewer" : "Show All Items"}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 bg-white px-4 pt-3 pb-4">
        {row("Item Total", `SGD ${fmt(r.items)}`, false)}
        {row("Service Charge", `+ SGD ${fmt(service)}`)}
        {row("GST 9%", `+ SGD ${fmt(gst)}`)}
        <div className="mt-1 border-t border-[#e4e4eb] pt-2">{row("Grand Total", `SGD ${fmt(r.grand)}`, false)}</div>
        <div className="mt-1 border-t border-dotted border-[#c3c4cf] pt-2">
          {row("Your share", `SGD ${fmt(r.share)}`)}
          {row("Platform Fee", `+ SGD ${fmt(r.fee)}`)}
        </div>
        <div className="mt-1 flex items-center justify-between text-lg leading-6 font-bold text-[#24242e]">
          <span>You Paid</span>
          <span>SGD {fmt(r.share + r.fee)}</span>
        </div>
      </div>
    </div>
  );
}

/** Figma 2099:11328: "Partial payment is in progress…", then on to the success screen by itself. */
export function PaymentProcessingScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const r = useSim((s) => s.customer.lastPartial);
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: "sim/navigate", mobile: "payment-partial" }), 2400);
    return () => clearTimeout(t);
  }, [dispatch]);

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 bg-white px-6 pt-8 pb-6">
          <Spoon />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl leading-7 font-bold text-[#24242e]">Partial payment is in progress...</p>
            <p className="text-xs leading-4 text-[#24242e]">don&apos;t press back or close this tab, please wait</p>
          </div>
          <div className="flex size-[72px] items-center justify-center rounded-2xl bg-[#f4f4f6] text-center text-[10px] leading-3 font-bold text-(--mobile-primary)">
            TS
            <br />
            CAFE
          </div>
          <p className="text-base leading-6 font-semibold text-[#24242e]">TS Cafe South Av</p>
        </div>
        <div className="flex flex-col items-center gap-5 px-4 pb-8">
          <div className="-mt-1">
            {r ? <TableCard label={r.tableLabel} amount={r.share + r.fee} /> : null}
          </div>
          <PaidReceipt />
        </div>
      </div>
    </div>
  );
}

/** Figma 2099:11464: partial payment done, with the balance still to pay. */
export function PaymentPartialScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const r = useSim((s) => s.customer.lastPartial);
  const tick = useSim((s) => s.tick);
  const [sent, setSent] = useState(false);

  if (!r) {
    return (
      <div className={cn(figtree.className, "flex size-full items-center justify-center bg-[#e6e7ed] p-6 text-center text-sm text-[#7b7d8d]")}>
        No partial payment yet.
      </div>
    );
  }
  const balanceDue = r.balance + platformFee(r.balance);

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 bg-white px-6 pt-8 pb-5 text-center">
          <div className="relative size-[59px]">
            <Image src={`${ASSET}/check.gif`} alt="" fill unoptimized className="object-contain" />
          </div>
          <p className="text-[18px] leading-6 font-bold tracking-[-0.5px] text-[#00b25f]">Partial Payment Successful!</p>
          <p className="max-w-[300px] text-xs leading-4 text-[#24242e]">
            You have paid partial payment of your bill, Please show this screen to our floor staff.
          </p>
          <div className="flex size-14 items-center justify-center rounded-xl bg-[#f4f4f6] text-center text-[9px] leading-3 font-bold text-(--mobile-primary)">
            TS
            <br />
            CAFE
          </div>
        </div>

        <div className="flex flex-col items-center bg-[#00b25f] pt-2.5">
          <div
            className="h-3 w-full bg-white"
            style={{ maskImage: "radial-gradient(circle at 10px 0, transparent 9px, #000 10px)", maskSize: "20px 100%", WebkitMaskImage: "radial-gradient(circle at 10px 0, transparent 9px, #000 10px)", WebkitMaskSize: "20px 100%" }}
          />
          <p className="pt-1 pb-3 text-sm leading-5 font-bold text-white">TS Cafe South Av</p>
        </div>

        <div className="-mt-px flex flex-col items-center gap-5 bg-[#e6e7ed] pb-8">
          <div className="-mt-1 flex w-[343px] flex-col items-center">
            <TableCard label={r.tableLabel} amount={r.share + r.fee} details={{ time: clock(Math.max(0, tick - r.tick)), orderId: r.orderId.replace("PAY-", "") }} />
            <div className="flex w-[311px] items-center justify-center rounded-b-xl bg-(--mobile-primary) pt-4 pb-2">
              <p className="text-xs leading-4 font-bold tracking-[2.16px] text-white uppercase">Partially Paid</p>
            </div>
          </div>

          <div className="flex w-[343px] flex-col items-center gap-3">
            <p className="text-sm leading-5 text-[#24242e]">Would you like to pay left amount?</p>
            <button
              onClick={() => dispatch({ type: "sim/navigate", mobile: "bill" })}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-(--mobile-primary) bg-transparent text-[15px] leading-6 font-bold text-(--mobile-primary) transition active:scale-[0.98]"
            >
              Pay Balance&nbsp; SGD {fmt(balanceDue)}
            </button>
            <button
              onClick={() => setSent(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-(--mobile-primary) text-[15px] leading-6 font-bold text-white transition active:scale-[0.98]"
            >
              {sent ? "Bill sent to your email" : "Send Your Bill to Email"}
            </button>
          </div>

          <PaidReceipt />

          <div className="flex flex-col items-center gap-1 pt-2 text-center text-xs leading-5 text-[#7b7d8d]">
            <p className="font-bold text-[#4a4857]">TS Cafe South Av</p>
            <p>ts.cafesouth.av@email.com</p>
            <p>+65 3119 2890</p>
          </div>
        </div>
      </div>
    </div>
  );
}
