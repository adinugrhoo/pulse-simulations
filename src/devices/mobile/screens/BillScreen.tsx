"use client";

import { grandTotal as grandTotalOf, platformFee } from "@/sim/bill";
import Image from "next/image";
import { useMemo, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { useSim } from "@/sim/store";
import { MobileTabBar } from "../MobileTabBar";
import type { SplitPlan } from "@/sim/types";
import { ChooseSplitSheet, SplitBillSheet } from "./SplitSheets";

const ASSET = "/figma/mobile-bill-v2";
const CART_ASSET = "/figma/mobile-cart";

const fmt = (n: number) => n.toFixed(2);

/**
 * Elapsed sim ticks rendered as the frame's hh:mm:ss "Order Time" clock. A tick is one
 * dispatched event, not a wall-clock second — the sim has no clock, by design.
 */
const elapsed = (ticks: number) => {
  const h = Math.floor(ticks / 3600);
  const m = Math.floor((ticks % 3600) / 60);
  const s = ticks % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

function PerforationRow() {
  return (
    <div className="flex w-full items-start">
      <Image src={`${CART_ASSET}/notch-left.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
      <div className="min-w-px flex-1 self-stretch bg-white" />
      <Image src={`${CART_ASSET}/notch-right.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
    </div>
  );
}

function AmountRow({
  label,
  amount,
  prefix = "SGD",
  muted,
  children,
}: {
  label: string;
  amount: number;
  prefix?: string;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex w-[196px] items-center gap-1">
        <p className={cn("text-sm leading-5 whitespace-nowrap", muted ? "text-[#7b7d8d]" : "font-bold text-[#4a4857]")}>
          {label}
        </p>
        {children}
      </div>
      <p className={cn("flex gap-0.5 text-[15px] leading-6 whitespace-nowrap", muted && "text-[#7b7d8d]")}>
        <span className={cn(!muted && "text-[#7b7d8d]")}>{prefix}</span>
        <span className={cn("font-bold", !muted && "text-[#4a4857]")}>{fmt(amount)}</span>
      </p>
    </div>
  );
}

/**
 * Figma: Pulse, node 2099:6002 ("View Bill") — where "View & Pay Bill" lands, from
 * either the confirmation screen or the bottom tab bar. Receipt card with a live
 * order clock, the split-bill prompt, the Pay CTA, and the tab bar with VIEW AND PAY
 * BILL active.
 *
 * Source primary is orange (#ff6b00); tinted assets are re-exported in the mobile
 * design system's maroon (#43263c). The frame's GST is 10% and it adds a platform
 * fee — this sim has charged 5% service + 9% GST since the first screen, so those
 * rates are kept and the platform fee is left out rather than silently changing
 * every total. The frame's tipping card is not built: its emoji assets are ~3 MB
 * each, its amounts are in AED, and the sim has no tip in its domain model.
 */
export function BillScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const tick = useSim((s) => s.tick);
  const tableId = useSim((s) => s.customer.tableId);
  const tableLabel = useSim((s) => s.tables.find((t) => t.id === s.customer.tableId)?.label ?? "Table");
  const allOrders = useSim((s) => s.orders);
  const phase = useSim((s) => s.phase);
  const split = useSim((s) => s.customer.split);
  const table = useSim((s) => s.tables.find((t) => t.id === s.customer.tableId));
  /** Phase 2.0 split flow: which sheet is up, and which split type the second one opens on. */
  const [sheet, setSheet] = useState<"choose" | "split" | null>(null);
  const [mode, setMode] = useState<SplitPlan["mode"]>("equal");

  const orders = useMemo(
    () => allOrders.filter((o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid"),
    [allOrders, tableId],
  );

  const lines = orders.flatMap((o) => o.lines);
  const itemTotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const serviceCharge = itemTotal * 0.05;
  const gst = itemTotal * 0.09;
  const grandTotal = grandTotalOf(itemTotal);

  const splitting = phase === "2.0";
  /** Someone already paid their share: what is left is the balance. */
  const partial = splitting && table?.status === "partial";
  const paidSoFar = partial ? (table?.paidBill ?? 0) : 0;
  const balance = partial ? (table?.balance ?? 0) : 0;
  const total = partial ? paidSoFar + balance : grandTotal;
  /** What this customer pays now: their split share, the balance, or the whole bill. */
  const base = split ? split.share : partial ? balance : grandTotal;
  const fee = split || partial ? platformFee(base) : 0;
  const payable = base + fee;
  const partWay = Boolean(split) && base < grandTotal - 0.005;

  /** Ticks since the earliest open order on this table — the frame's running order clock. */
  const firstTick = orders.length ? Math.min(...orders.map((o) => o.placedAtTick)) : tick;

  const refresh = () => dispatch({ type: "sim/navigate", mobile: "bill" });
  const payBill = () => dispatch({ type: partWay ? "customer/pay-share" : "customer/pay-bill" });

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <div className="flex flex-col items-start gap-5">
          {/* receipt */}
          <div className="flex w-[343px] flex-col items-center drop-shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
            <Image
              src={`${ASSET}/scallop-top.svg`}
              alt=""
              width={343}
              height={16}
              className="h-4 w-[343px]"
            />

            <div className="flex w-full items-start gap-0.5 bg-white px-4 pt-5 pb-2">
              <div className="flex min-w-px flex-1 flex-col items-start gap-0.5">
                <p className="w-full text-[18px] leading-6 font-bold text-[#24242e]">My Order</p>
                <p className="flex gap-1 text-xs leading-5 whitespace-nowrap text-[#7b7d8d]">
                  <span>Table:</span>
                  <span>{tableLabel}</span>
                </p>
                <p className="flex gap-1 text-xs leading-5 whitespace-nowrap text-[#7b7d8d]">
                  <span>Order Time:</span>
                  <span>{elapsed(Math.max(0, tick - firstTick))}</span>
                </p>
              </div>
              <button onClick={refresh} aria-label="Refresh bill" className="relative size-6 shrink-0">
                <Image
                  src={`${ASSET}/refresh-ring.svg`}
                  alt=""
                  width={16}
                  height={16}
                  className="absolute top-1 left-1 size-4"
                />
                <Image
                  src={`${ASSET}/refresh-arrow.svg`}
                  alt=""
                  width={7}
                  height={7}
                  className="absolute top-[1.15px] left-[6.22px] h-[6.731px] w-[6.731px]"
                />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="w-full bg-white px-4 py-6">
                <p className="text-sm text-[#9a9cab]">No items on this table&apos;s bill yet.</p>
              </div>
            ) : (
              lines.map((line) => (
                <div key={line.lineId} className="flex w-full flex-col items-center gap-1 bg-white px-4 py-3">
                  <div className="flex w-[311px] items-center gap-4">
                    <p className="min-w-px flex-1 text-[15px] leading-6 text-[#4a4857]">{line.name}</p>
                    <p className="text-[15px] leading-6 whitespace-nowrap text-[#7b7d8d]">x {line.qty}</p>
                    <p className="flex w-20 justify-end gap-0.5 text-[15px] leading-6 whitespace-nowrap">
                      <span className="text-[#7b7d8d]">SGD</span>
                      <span className="font-bold text-[#4a4857]">{fmt(line.unitPrice * line.qty)}</span>
                    </p>
                  </div>
                </div>
              ))
            )}

            <div className="flex w-full flex-col items-start gap-px">
              <PerforationRow />
              <PerforationRow />
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-2.5 bg-white px-4 py-3">
              <div className="w-[311px]">
                <AmountRow label="Item Total" amount={itemTotal} />
              </div>
              <div className="flex w-[311px] flex-col items-start gap-0.5">
                <AmountRow label="Service Charge" amount={serviceCharge} prefix="+ SGD" muted />
                <AmountRow label="GST 9%" amount={gst} prefix="+ SGD" muted>
                  <Image src={`${ASSET}/info.svg`} alt="" width={16} height={16} className="size-4 shrink-0" />
                </AmountRow>
              </div>
              <div className="relative h-0 w-full">
                <Image src={`${ASSET}/total-divider.svg`} alt="" fill className="object-fill" />
              </div>
              <div className="flex w-full items-start justify-between">
                <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">Grand Total</p>
                <p className="flex items-start gap-0.5 whitespace-nowrap text-[#24242e]">
                  <span className="text-[15px] leading-6">SGD</span>
                  <span className="text-[18px] leading-6 font-bold">{fmt(total)}</span>
                </p>
              </div>

              {split || partial ? (
                <>
                  <div className="h-px w-full border-t border-dotted border-[#c3c4cf]" />
                  <div className="flex w-[311px] flex-col items-start gap-0.5">
                    {partial ? <AmountRow label="Paid" amount={paidSoFar} muted /> : null}
                    <AmountRow label={partial ? "Balance" : "Your share"} amount={base} muted />
                    <AmountRow label="Platform fee" amount={fee} prefix="+ SGD" muted>
                      <Image src={`${ASSET}/info.svg`} alt="" width={16} height={16} className="size-4 shrink-0" />
                      <span className="text-xs text-[#7b7d8d] underline decoration-dotted underline-offset-2">(Optional)</span>
                    </AmountRow>
                  </div>
                  <div className="flex w-full items-start justify-between">
                    <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">
                      {partial ? "Balance Payable" : "Your Payable"}
                    </p>
                    <p className="flex items-start gap-0.5 whitespace-nowrap text-[#24242e]">
                      <span className="text-[15px] leading-6">SGD</span>
                      <span className="text-[18px] leading-6 font-bold">{fmt(payable)}</span>
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            <Image
              src={`${ASSET}/scallop-bottom.svg`}
              alt=""
              width={343}
              height={16}
              className="h-4 w-[343px]"
            />
          </div>

          {/* split the bill: live in Phase 2.0, inert in Phase 1.0 where the sim settles one bill */}
          {partial ? null : split ? (
            <div className="flex w-[343px] flex-col items-center gap-4 rounded-[20px] border border-white/20 bg-white px-4 py-5 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)]">
              <p className="w-full text-sm leading-5 font-bold text-[#24242e]">
                {split.mode === "equal" ? "Even Splitting Initiated" : "Custom Splitting Initiated"}
              </p>
              <div className="flex w-full items-center justify-center gap-1 rounded-xl border-b-[3px] border-[#43263c] bg-[#efe6ed] py-2.5 text-sm leading-5 text-[#24242e]">
                <span>{split.name}&apos;s Share</span>
                <span className="font-bold">SGD {fmt(split.share)}</span>
              </div>
              <button
                onClick={() => setSheet("choose")}
                className="text-sm leading-5 text-[#4a4857] underline decoration-dashed underline-offset-4"
              >
                Willing to Split Differently?
              </button>
            </div>
          ) : (
          <div className="flex w-[343px] flex-col items-center rounded-[20px] border border-white/20 bg-white px-4 py-5 drop-shadow-[0px_4px_2px_rgba(0,0,0,0.1)]">
            <div className="flex w-[311px] items-start justify-center gap-1">
              <div className="relative size-10 shrink-0 overflow-hidden">
                <Image
                  src={`${ASSET}/split-icon.svg`}
                  alt=""
                  width={41}
                  height={53}
                  className="absolute -top-1.5 -left-[3px] h-[53.147px] w-[41px]"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="w-[231px] text-sm leading-5 font-semibold text-[#24242e]">
                  Would you like to split the bill?
                </p>
                <p className="w-[231px] text-xs leading-5 text-[#7b7d8d]">Settle your bills easily with your friends</p>
              </div>
            </div>
            <div className="relative h-8 w-full">
              <Image src={`${ASSET}/split-divider.svg`} alt="" fill className="object-fill" />
            </div>
            <button
              onClick={() => splitting && setSheet("choose")}
              disabled={!splitting}
              className="flex w-full items-center justify-center rounded-xl bg-[#e6e7ed] py-2.5 text-sm leading-5 whitespace-nowrap text-[#24242e] transition enabled:active:scale-[0.98]"
            >
              Split the Bill
            </button>
          </div>
          )}
        </div>
      </div>

      <div className="shrink-0 rounded-t-3xl bg-white p-4">
        <button
          onClick={payBill}
          disabled={lines.length === 0}
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-xl bg-[#43263c] px-2.5 py-3.5 text-[15px] leading-6 font-bold text-white transition",
            lines.length === 0 && "opacity-40",
          )}
        >
          {partial ? "Pay Balance" : "Pay"}&nbsp; SGD {fmt(payable)}
        </button>
      </div>

      <MobileTabBar active="bill" badge="bill" />

      {sheet === "choose" ? (
        <ChooseSplitSheet
          onPick={(m) => {
            setMode(m);
            setSheet("split");
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet === "split" ? (
        <SplitBillSheet
          grand={grandTotal}
          initial={mode}
          onClose={() => setSheet(null)}
          onConfirm={(plan) => {
            setSheet(null);
            dispatch({ type: "customer/start-split", plan });
          }}
        />
      ) : null}
    </div>
  );
}
