"use client";

import Image from "next/image";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { useSim } from "@/sim/store";

const fmt = (n: number) => n.toFixed(2);

/**
 * Figma: SmartWeb Pro 2025 H2, node 1193:3590 ("Order Confirmation"), repurposed
 * as the payment-success receipt. Trimmed from the source: the "email receipt"
 * capture box and the footer contact/social-links block — decorative for this
 * simulation, not load-bearing for the pay-bill scenario.
 */
export function PaymentSuccessScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const receipt = useSim((s) => s.customer.lastReceipt);

  const continueOrdering = () => dispatch({ type: "sim/navigate", mobile: "menu" });

  if (!receipt) {
    return (
      <div className={cn(figtree.className, "flex size-full items-center justify-center bg-[#e6e7ed] p-6 text-center text-sm text-[#7b7d8d]")}>
        No payment yet — pay a bill from the Bill screen first.
      </div>
    );
  }

  const serviceCharge = receipt.amount * 0.05;
  const gst = receipt.amount * 0.09;
  const grandTotal = receipt.amount + serviceCharge + gst;

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 px-4 pt-10 pb-8">
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="relative size-[59px]">
              <Image src="/figma/mobile-payment-success/check.gif" alt="" fill unoptimized className="object-contain" />
            </div>
            <p className="max-w-[272px] text-center text-[18px] leading-6 font-bold tracking-[-0.5px] text-[#00b25f]">
              Your bill has been successfully paid!
            </p>
          </div>

          {/* receipt ticket */}
          <div className="flex w-[343px] flex-col items-center">
            <div className="flex flex-col items-center gap-5 rounded-t-xl bg-[#24242e] pb-6 shadow-[0px_4px_54px_-5px_rgba(7,7,7,0.15)]">
              <div className="flex items-center">
                <Image src="/figma/mobile-payment-success/table-pill-left.svg" alt="" width={28} height={25} />
                <div className="flex items-center gap-2 border-b-[1.5px] border-[#00b25f] bg-white/5 px-8 py-2.5">
                  <Image src="/figma/mobile-payment-success/table-icon.svg" alt="" width={24} height={24} />
                  <span className="text-base leading-6 font-bold text-white">{receipt.tableLabel}</span>
                </div>
                <Image src="/figma/mobile-payment-success/table-pill-right.svg" alt="" width={28} height={25} />
              </div>

              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-1 text-[#f9fafc]">
                  <span className="text-base leading-4">SGD</span>
                  <span className="text-[32px] leading-[64px] font-bold">{fmt(receipt.amount)}</span>
                </div>
                <div className="h-px w-[311px] bg-white/15" />
                <div className="flex w-full items-center justify-center gap-2 px-4">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs leading-5 tracking-wide text-[#7b7d8d] uppercase">Order ID</span>
                    <span className="text-base leading-6 font-bold text-[#dfdfe8]">{receipt.orderId}</span>
                  </div>
                  <div className="h-7 w-px bg-white/15" />
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs leading-5 tracking-wide text-[#7b7d8d] uppercase">Queue Number</span>
                    <span className="text-base leading-6 font-bold text-[#dfdfe8]">{receipt.queueNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-[311px] items-center justify-center rounded-b-xl bg-[#00b25f] pt-5 pb-2">
              <p className="text-xs leading-4 font-bold tracking-[2.16px] text-white uppercase">
                Payment Status: Paid
              </p>
            </div>
          </div>

          {/* my order + breakdown */}
          <div className="flex w-[343px] flex-col overflow-hidden rounded-lg shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
            <div className="bg-white px-4 pt-5 pb-2">
              <p className="text-lg leading-6 font-bold text-[#24242e]">My Order</p>
            </div>
            <div className="flex flex-col gap-2 bg-white px-4 py-3">
              {receipt.lines.length === 0 ? (
                <p className="text-sm text-[#9a9cab]">No line items recorded for this payment.</p>
              ) : (
                receipt.lines.map((l) => (
                  <div key={l.lineId} className="flex items-start gap-4 text-sm">
                    <p className="flex-1 text-[#24242e]">{l.name}</p>
                    <span className="text-[#7b7d8d]">x {l.qty}</span>
                    <span className="w-16 text-right font-bold text-[#4a4857]">
                      SGD {fmt(l.unitPrice * l.qty)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-col gap-2 bg-white px-4 pt-3 pb-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#4a4857]">Item Total</span>
                <span className="font-bold text-[#4a4857]">SGD {fmt(receipt.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-[#7b7d8d]">
                <span>Service Charge</span>
                <span>+ SGD {fmt(serviceCharge)}</span>
              </div>
              <div className="flex items-center justify-between text-[#7b7d8d]">
                <span>GST 9%</span>
                <span>+ SGD {fmt(gst)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-[#e4e4eb] pt-2">
                <span className="text-lg font-bold text-[#24242e]">Grand Total</span>
                <span className="text-lg font-bold text-[#24242e]">SGD {fmt(grandTotal)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 border-t border-dashed border-[#e4e4eb] pt-3">
                <Image src="/figma/mobile-payment-success/cash-icon.svg" alt="" width={20} height={20} />
                <span className="text-xs leading-4 font-bold text-[#4a4857]">Paid via Cards/Wallets/FPX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 rounded-t-3xl bg-white p-4 shadow-[0px_6px_10.5px_rgba(7,7,7,0.1)]">
        <button
          onClick={continueOrdering}
          className="flex h-12 w-full items-center justify-center rounded-lg bg-[#43263c] text-lg font-bold text-white"
        >
          Continue Ordering
        </button>
      </div>
    </div>
  );
}
