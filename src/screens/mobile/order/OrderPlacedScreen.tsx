"use client";

import { grandTotal as grandTotalOf } from "@/engine/bill";
import Image from "next/image";
import { useMemo } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { useSim } from "@/engine/store";

const ASSET = "/figma/mobile-order-placed";
const CART_ASSET = "/figma/mobile-cart";

const fmt = (n: number) => n.toFixed(2);

/** One row of the perforated tear line between the item list and the totals. */
function PerforationRow() {
  return (
    <div className="flex w-full items-start">
      <Image src={`${CART_ASSET}/notch-left.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
      <div className="min-w-px flex-1 self-stretch bg-white" />
      <Image src={`${CART_ASSET}/notch-right.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
    </div>
  );
}

/**
 * Figma: Pulse, node 2099:7980 — the confirmation shown once the customer taps
 * Confirm Order in the cart. Green success wave, the dark table/queue card, the
 * three-step "pay at your table later" explainer, the order summary, then the two
 * footer actions: View & Pay Bill and Continue Ordering.
 *
 * The explainer card is a single exported PNG — the source composes it from ~60
 * vector fragments, and re-authoring those adds nothing here. It is the one asset
 * that still carries the source file's orange; everything else is re-exported in
 * the mobile design system's maroon (#43263c).
 *
 * Dropped: the Figma frame's Discount line and its restaurant contact / social
 * footer. The sim has no discount model and no venue record, so both would be
 * invented data.
 */
export function OrderPlacedScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const tableId = useSim((s) => s.customer.tableId);
  const tableLabel = useSim((s) => s.tables.find((t) => t.id === s.customer.tableId)?.label ?? "Table");
  const allOrders = useSim((s) => s.orders);

  /** The order this screen confirms: the newest one still open on this table. */
  const order = useMemo(
    () => allOrders.find((o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid"),
    [allOrders, tableId],
  );
  const openLines = useMemo(
    () =>
      allOrders
        .filter((o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid")
        .flatMap((o) => o.lines),
    [allOrders, tableId],
  );

  const itemTotal = openLines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const serviceCharge = itemTotal * 0.05;
  const tax = itemTotal * 0.09;
  const grandTotal = grandTotalOf(itemTotal);

  const queueNumber = order ? String(1000 + (order.placedAtTick % 9000)) : "—";

  const viewBill = () => dispatch({ type: "customer/request-bill" });
  const continueOrdering = () => dispatch({ type: "sim/navigate", mobile: "menu" });

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#e6e7ed]")}>
      <div className="relative flex-1 overflow-x-clip overflow-y-auto">
        {/* white-to-transparent wash behind the message, then the green wave */}
        <div className="pointer-events-none absolute top-0 left-0 h-[406px] w-full bg-gradient-to-b from-white from-[31.752%] to-white/0" />
        <div className="pointer-events-none absolute top-[162px] left-1/2 h-[200px] w-[375px] -translate-x-1/2">
          <Image src={`${ASSET}/wave-bg.svg`} alt="" fill className="object-fill" />
        </div>

        <div className="relative flex flex-col items-center gap-4 pb-10">
          <div className="flex flex-col items-center gap-10">
            <div className="flex h-[147px] flex-col items-center gap-3 pb-5">
              <div className="relative size-20">
                <div className="absolute top-1/2 left-1/2 size-[59px] -translate-x-1/2 -translate-y-1/2">
                  <Image
                    src={`${ASSET}/success.gif`}
                    alt=""
                    width={51}
                    height={51}
                    unoptimized
                    className="absolute top-1 left-1 size-[51px] object-cover"
                  />
                </div>
              </div>
              <div className="flex w-[343px] flex-col items-center gap-1 px-[21px]">
                <p className="w-[272px] text-center text-[18px] leading-6 font-bold tracking-[-0.5px] text-[#00b25f]">
                  Your order has been successfully sent to the kitchen!
                </p>
              </div>
            </div>

            {/* table / order id / queue card */}
            <div className="flex w-[311px] flex-col items-center gap-5 overflow-hidden rounded-xl bg-[#24242e] pb-6 shadow-[0px_4px_54px_-5px_rgba(7,7,7,0.15)]">
              <div className="pointer-events-none absolute" />
              <div className="flex items-start">
                <Image src={`${ASSET}/pill-left.svg`} alt="" width={28} height={25} className="h-[25px] w-7" />
                <div className="flex items-center gap-2 rounded-b-[21px] border-b-[1.5px] border-[#00b25f] bg-white/5 px-8 py-2.5">
                  <Image src={`${ASSET}/table-icon.svg`} alt="" width={24} height={24} className="size-6" />
                  <p className="text-base leading-6 font-bold whitespace-nowrap text-white">{tableLabel}</p>
                </div>
                <Image src={`${ASSET}/pill-right.svg`} alt="" width={28} height={25} className="h-[25px] w-7" />
              </div>

              <div className="flex w-[311px] items-center justify-center gap-2 px-4">
                <div className="flex min-w-px flex-1 flex-col items-center justify-center gap-1">
                  <p className="text-xs leading-5 whitespace-nowrap text-[#7b7d8d] uppercase">Order ID</p>
                  <p className="text-base leading-6 font-bold whitespace-nowrap text-[#dfdfe8]">{order?.id ?? "—"}</p>
                </div>
                <div className="relative h-7 w-px">
                  <Image src={`${ASSET}/divider-v.svg`} alt="" fill className="object-fill" />
                </div>
                <div className="flex min-w-px flex-1 flex-col items-center justify-center gap-1">
                  <p className="text-xs leading-5 whitespace-nowrap text-[#7b7d8d] uppercase">Queue Number</p>
                  <p className="text-base leading-6 font-bold whitespace-nowrap text-[#dfdfe8]">{queueNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* three-step explainer — single exported bitmap, see file comment */}
          <div className="relative h-[180px] w-[338px] overflow-hidden rounded-lg bg-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]">
            <Image src={`${ASSET}/steps.png`} alt="No need to leave your seat — pay online at your table later" fill className="object-cover" />
          </div>

          {/* order summary */}
          <div className="flex w-[343px] flex-col items-center drop-shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
            <div className="flex w-full items-start gap-0.5 rounded-t-lg bg-white px-4 pt-5 pb-2">
              <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">My Order</p>
            </div>

            {openLines.map((line) => (
              <div key={line.lineId} className="flex w-full flex-col items-start bg-white px-4 py-3">
                <div className="flex w-[311px] items-start gap-4">
                  <p className="min-w-px flex-1 text-sm leading-5 text-[#24242e]">{line.name}</p>
                  <p className="text-sm leading-6 whitespace-nowrap text-[#7b7d8d]">x {line.qty}</p>
                  <p className="flex w-20 justify-end gap-0.5 text-sm leading-6 whitespace-nowrap">
                    <span className="text-[#7b7d8d]">SGD</span>
                    <span className="font-bold text-[#4a4857]">{fmt(line.unitPrice * line.qty)}</span>
                  </p>
                </div>
              </div>
            ))}

            <div className="flex w-full flex-col items-start gap-px">
              <PerforationRow />
              <PerforationRow />
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-2.5 bg-white px-4 py-3">
              <div className="flex w-[311px] items-center justify-between">
                <p className="text-sm leading-5 font-bold whitespace-nowrap text-[#4a4857]">Item Total</p>
                <p className="flex gap-0.5 text-sm leading-6 whitespace-nowrap">
                  <span className="text-[#7b7d8d]">SGD</span>
                  <span className="font-bold text-[#4a4857]">{fmt(itemTotal)}</span>
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-0.5">
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm leading-5 whitespace-nowrap text-[#7b7d8d]">Service Charge</p>
                  <p className="flex gap-0.5 text-sm leading-6 whitespace-nowrap text-[#7b7d8d]">
                    <span>+ SGD</span>
                    <span className="font-bold">{fmt(serviceCharge)}</span>
                  </p>
                </div>
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm leading-5 whitespace-nowrap text-[#7b7d8d]">Tax</p>
                  <p className="flex gap-0.5 text-sm leading-6 whitespace-nowrap text-[#7b7d8d]">
                    <span>+ SGD</span>
                    <span className="font-bold">{fmt(tax)}</span>
                  </p>
                </div>
              </div>
              <div className="relative h-0 w-full">
                <Image src={`${CART_ASSET}/divider.svg`} alt="" fill className="object-fill" />
              </div>
              <div className="flex w-full items-start justify-between">
                <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">Grand Total</p>
                <p className="flex gap-0.5 text-[18px] leading-6 whitespace-nowrap text-[#24242e]">
                  <span>SGD</span>
                  <span className="font-bold">{fmt(grandTotal)}</span>
                </p>
              </div>

              <div className="flex w-full flex-col items-start px-3.5">
                <div className="relative h-4 w-full">
                  <Image
                    src={`${ASSET}/divider-dashed.svg`}
                    alt=""
                    width={311}
                    height={1}
                    className="absolute top-0 left-px h-px w-[311px]"
                  />
                </div>
                <div className="flex items-center gap-[22px]">
                  <p className="w-[257px] text-xs leading-5 font-bold text-[#4a4857]">Pay at your table later</p>
                  <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-[#f0f2f5]">
                    <Image src={`${ASSET}/money-icon.svg`} alt="" width={24} height={24} className="size-6" />
                  </div>
                </div>
              </div>
            </div>

            <Image
              src={`${CART_ASSET}/scallop.svg`}
              alt=""
              width={343}
              height={16}
              className="h-4 w-[343px]"
            />
          </div>
        </div>
      </div>

      {/* footer actions */}
      <div className="flex shrink-0 flex-col gap-2.5 rounded-t-xl bg-white p-4">
        <button
          onClick={viewBill}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-(--mobile-primary) px-2.5 py-3.5 text-base leading-6 font-bold text-(--mobile-primary)"
        >
          View &amp; Pay Bill
        </button>
        <button
          onClick={continueOrdering}
          className="flex h-12 w-full items-center justify-center rounded-lg bg-(--mobile-primary) px-4 py-3.5 text-base leading-6 font-bold text-white"
        >
          Continue Ordering
        </button>
      </div>
    </div>
  );
}
