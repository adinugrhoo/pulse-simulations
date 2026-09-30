"use client";

import Image from "next/image";
import { useMemo } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { cartTotal } from "@/sim/reducer";
import { useSim } from "@/sim/store";
import { MENU_CATALOG, dishImageUrl, type CatalogDish } from "@/sim/menuCatalog";

const ASSET = "/figma/mobile-cart";

const fmt = (n: number) => `SGD ${n.toFixed(2)}`;

/** Figma tags the 2nd suggestion "For You" and the 4th "Trending"; kept positional so it is deterministic. */
const TAGS: Record<number, { label: string; className: string }> = {
  1: { label: "For You", className: "bg-[#6c31cf]" },
  3: { label: "Trending", className: "bg-[#351d2f]" },
};

/** Section heading with the 4px rule running down its left edge. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full items-center gap-2.5 px-4 pt-4">
      <p className="text-base leading-6 font-bold tracking-[-0.5px] whitespace-nowrap text-[#24242e]">{children}</p>
      <div className="absolute top-4 left-0 h-6 w-1 rounded-r bg-[#43263c]" />
    </div>
  );
}

/** One row of the perforated tear line between the order block and the bill block. */
function PerforationRow() {
  return (
    <div className="flex w-full items-start">
      <Image src={`${ASSET}/notch-left.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
      <div className="min-w-px flex-1 self-stretch bg-white" />
      <Image src={`${ASSET}/notch-right.svg`} alt="" width={18} height={16} className="h-4 w-[18px] shrink-0" />
    </div>
  );
}

/**
 * Figma: Pulse, node 2099:5710 ("Order Cart") — the receipt-shaped cart. Scalloped
 * top and bottom edges, My Order block, a perforated tear line, then the bill
 * summary; the only footer action is Confirm Order. The source file's payment-method
 * row and SMS opt-in are not in this frame and are gone from this build too.
 *
 * Source primary is orange (#ff6b00); the mobile design system here is home's maroon
 * (#43263c, see MenuScreen), so tinted assets were re-exported in that ramp. Dishes,
 * names and prices are the real `MENU_CATALOG` the home screen renders.
 */
export function CartScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const cart = useSim((s) => s.customer.cart);

  const cartItemIds = useMemo(() => new Set(cart.map((l) => l.itemId)), [cart]);
  const suggestions = useMemo(
    () => MENU_CATALOG.filter((d) => !cartItemIds.has(d.id)).slice(0, 4),
    [cartItemIds],
  );
  const recentlyViewed = useMemo(
    () => MENU_CATALOG.filter((d) => !cartItemIds.has(d.id)).slice(4, 7),
    [cartItemIds],
  );

  const subtotal = cartTotal(cart);
  const serviceCharge = subtotal * 0.05;
  const tax = subtotal * 0.09;
  const total = subtotal + serviceCharge + tax;

  const back = () => dispatch({ type: "sim/navigate", mobile: "menu" });
  const addDish = (dish: CatalogDish) =>
    dispatch({ type: "customer/add-to-cart", line: { itemId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1 } });
  const inc = (lineId: string) => dispatch({ type: "customer/increment-cart-line", lineId });
  const dec = (lineId: string) => dispatch({ type: "customer/decrement-cart-line", lineId });
  const confirmOrder = () => dispatch({ type: "customer/submit-order" });

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-[#f0f2f5]")}>
      {/* header */}
      <div className="relative z-20 flex h-[60px] shrink-0 items-center gap-4 bg-white px-4 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.06)]">
        <button onClick={back} className="size-7 shrink-0" aria-label="Back">
          <Image src={`${ASSET}/back-arrow.svg`} alt="" width={28} height={28} className="size-7" />
        </button>
        <p className="w-[255px] text-center text-[18px] leading-[1.35] font-bold tracking-[-0.4px] text-[#333]">
          Order Cart
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-sm text-[#7b7d8d]">Your cart is empty.</p>
            <button onClick={back} className="rounded-lg bg-[#43263c] px-4 py-2 text-sm font-bold text-white">
              Browse the menu
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-6 pb-8">
            {/* perfect addition strip */}
            {suggestions.length > 0 ? (
              <div className="flex w-full flex-col items-center bg-white">
                <SectionTitle>Perfect addition to your cart</SectionTitle>
                <div className="flex w-full items-start gap-4 overflow-x-auto px-4 pt-3 pb-4">
                  {suggestions.map((d, i) => {
                    const tag = TAGS[i];
                    return (
                      <div key={d.id} className="relative flex shrink-0 flex-col items-start gap-2 rounded-xl">
                        <div className="relative size-[92px] overflow-hidden rounded-[10px] bg-[#f0f2f5]">
                          <Image src={dishImageUrl(d.image)} alt={d.name} fill className="object-cover" />
                        </div>
                        <div className="flex w-[92px] flex-col items-center gap-1 text-sm">
                          <p className="line-clamp-1 w-full leading-5 text-[#24242e]">{d.name}</p>
                          <p className="w-full leading-5 font-bold text-[#4a4857]">{fmt(d.price)}</p>
                        </div>
                        <button
                          onClick={() => addDish(d)}
                          aria-label={`Add ${d.name}`}
                          className="absolute top-[56px] left-[56.5px] flex items-center rounded-[50px] border border-[#dfdfe8] bg-white p-1 shadow-[0px_2px_3.5px_rgba(7,7,7,0.05)]"
                        >
                          <Image src={`${ASSET}/add-circle.svg`} alt="" width={20} height={20} className="size-5" />
                        </button>
                        {tag ? (
                          <div
                            className={cn(
                              "absolute top-1 -left-1 flex items-center justify-center rounded-tl-md rounded-tr-md rounded-br-md px-2 py-1",
                              tag.className,
                            )}
                          >
                            <span className="text-[10px] leading-4 font-bold whitespace-nowrap text-white">
                              {tag.label}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* receipt: scalloped top, order block, tear line, bill block, scalloped bottom */}
            <div className="flex w-full flex-col items-center px-4">
              <div className="flex w-[343px] flex-col items-start">
                <Image
                  src={`${ASSET}/scallop.svg`}
                  alt=""
                  width={343}
                  height={16}
                  className="h-4 w-[343px] -scale-y-100"
                />

                <div className="flex w-full items-start gap-2 bg-white px-4 pt-5 pb-2">
                  <Image src={`${ASSET}/basket.svg`} alt="" width={24} height={24} className="size-6 shrink-0" />
                  <p className="min-w-px flex-1 text-[22px] leading-7 font-bold tracking-[-0.5px] text-[#24242e]">
                    My Order
                  </p>
                </div>

                <div className="flex w-full flex-col items-start gap-5 bg-white px-4 pt-6 pb-4">
                  {cart.map((line) => {
                    const dish = MENU_CATALOG.find((d) => d.id === line.itemId);
                    return (
                      <div key={line.lineId} className="flex w-full flex-col items-start gap-4">
                        <div className="flex w-full flex-col items-start gap-3">
                          <div className="flex w-full items-start gap-4">
                            <div className="flex min-w-px flex-1 flex-col items-start gap-1">
                              <p className="w-full text-sm leading-5 text-[#24242e]">{line.name}</p>
                              {dish?.tags?.length ? (
                                <p className="text-sm leading-4 text-[#7b7d8d]">{dish.tags.join(" · ")}</p>
                              ) : null}
                            </div>
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-[#f0f2f5]">
                              {dish ? (
                                <Image
                                  src={dishImageUrl(dish.image)}
                                  alt={line.name}
                                  fill
                                  className="rounded-xl object-cover"
                                />
                              ) : null}
                            </div>
                          </div>

                          <div className="flex w-full items-center gap-2.5">
                            <p className="text-sm leading-5 font-bold whitespace-nowrap text-[#4a4857]">
                              {fmt(line.unitPrice)}
                            </p>
                            <div className="flex min-w-px flex-1 items-center justify-end gap-3">
                              {/* the sim has no per-item customisation, so Edit renders but does nothing */}
                              <div className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[#e6e7ed] bg-white px-3 py-2">
                                <Image src={`${ASSET}/edit.svg`} alt="" width={16} height={16} className="size-4" />
                                <span className="text-sm leading-5 font-bold whitespace-nowrap text-[#4a4857]">
                                  Edit
                                </span>
                              </div>
                              <div className="flex h-8 w-24 items-center justify-center gap-2.5 rounded-lg border border-[#dfdfe8] bg-white p-2.5">
                                <button
                                  onClick={() => dec(line.lineId)}
                                  aria-label="Remove one"
                                  className="flex w-6 shrink-0 items-center justify-center rounded-full py-0.5"
                                >
                                  <Image src={`${ASSET}/delete.svg`} alt="" width={16} height={16} className="size-4 shrink-0" />
                                </button>
                                <span className="min-w-px flex-1 text-center text-xs leading-5 font-bold text-[#43263c]">
                                  {line.qty}
                                </span>
                                <button
                                  onClick={() => inc(line.lineId)}
                                  aria-label="Add one"
                                  className="flex w-6 shrink-0 items-center justify-center rounded-full py-0.5"
                                >
                                  <Image src={`${ASSET}/plus.svg`} alt="" width={16} height={16} className="size-4 shrink-0" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="h-px w-full border-b border-dashed border-[#e4e4eb]" />
                      </div>
                    );
                  })}

                  <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex w-full items-center justify-between">
                      <p className="text-sm leading-5 whitespace-nowrap text-[#4a4857]">Want to add more items?</p>
                      <button
                        onClick={back}
                        className="flex h-8 items-center justify-center rounded-lg border border-[#e6e7ed] bg-white px-3 py-2"
                      >
                        <span className="text-sm leading-5 font-bold whitespace-nowrap text-[#4a4857]">Add More</span>
                      </button>
                    </div>
                    <div className="h-px w-full border-b border-dashed border-[#dfdfe8]" />
                  </div>

                  <div className="flex w-full items-center rounded-xl border border-[#ececec] bg-[#f9fafc] p-3">
                    <div className="flex min-w-px flex-1 items-center gap-1">
                      <Image
                        src={`${ASSET}/special-request.svg`}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0"
                      />
                      <p className="min-w-px flex-1 text-sm leading-5 font-bold text-[#4a4857]">Add Special Request</p>
                      <Image
                        src={`${ASSET}/chevron-down-16.svg`}
                        alt=""
                        width={16}
                        height={16}
                        className="size-4 shrink-0 -rotate-90"
                      />
                    </div>
                  </div>
                </div>

                {/* voucher */}
                <div className="flex w-full items-start bg-white pt-2 pb-3">
                  <div className="relative flex min-w-px flex-1 items-center gap-1.5 self-stretch overflow-hidden bg-[#f8f4f7] px-4 py-3.5">
                    <div className="flex min-w-px flex-1 items-center gap-2">
                      <Image src={`${ASSET}/voucher.svg`} alt="" width={36} height={36} className="size-9 shrink-0" />
                      <p className="min-w-px flex-1 text-base leading-5 font-bold text-[#4a4857]">Apply Voucher</p>
                    </div>
                    <Image
                      src={`${ASSET}/chevron-down-20.svg`}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 -rotate-90"
                    />
                    <div className="absolute top-1/2 left-0 h-7 w-1 -translate-y-1/2 rounded-r bg-[#43263c]" />
                  </div>
                </div>

                {/* tear line */}
                <div className="flex w-[343px] flex-col items-start gap-px">
                  <PerforationRow />
                  <PerforationRow />
                </div>

                {/* bill summary */}
                <div className="flex w-[343px] flex-col items-center drop-shadow-[0px_6px_5.5px_rgba(7,7,7,0.13)]">
                  <div className="flex w-full flex-col items-center justify-center gap-2.5 bg-white px-4 py-3">
                    <div className="flex w-[311px] flex-col items-start gap-1">
                      <div className="flex w-full items-center justify-between">
                        <p className="text-base leading-6 font-bold whitespace-nowrap text-[#4a4857]">Subtotal</p>
                        <p className="text-base leading-6 font-bold whitespace-nowrap text-[#4a4857]">
                          {fmt(subtotal)}
                        </p>
                      </div>
                      <div className="flex w-full items-center justify-between">
                        <p className="text-sm leading-5 whitespace-nowrap text-[#7b7d8d]">Service charge</p>
                        <p className="text-base leading-6 whitespace-nowrap text-[#7b7d8d]">+{fmt(serviceCharge)}</p>
                      </div>
                      <div className="flex w-full items-center justify-between">
                        <p className="text-sm leading-5 whitespace-nowrap text-[#7b7d8d]">Tax</p>
                        <p className="text-base leading-6 whitespace-nowrap text-[#7b7d8d]">+{fmt(tax)}</p>
                      </div>
                    </div>
                    <div className="relative h-0 w-full">
                      <Image src={`${ASSET}/divider.svg`} alt="" fill className="object-fill" />
                    </div>
                    <div className="flex w-full items-start justify-between">
                      <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">Total Payable</p>
                      <p className="text-[18px] leading-6 font-bold whitespace-nowrap text-[#24242e]">{fmt(total)}</p>
                    </div>
                  </div>
                  <Image src={`${ASSET}/scallop.svg`} alt="" width={343} height={16} className="h-4 w-[343px]" />
                </div>
              </div>
            </div>

            {/* recently viewed */}
            {recentlyViewed.length > 0 ? (
              <div className="flex w-full flex-col items-start gap-3 overflow-hidden bg-white pt-2 pb-5">
                <SectionTitle>Recently Viewed Items</SectionTitle>
                <div className="flex w-full items-start gap-3 overflow-x-auto px-4">
                  {recentlyViewed.map((d) => (
                    <div
                      key={d.id}
                      className="flex w-[203px] shrink-0 items-start gap-2 rounded-xl border border-[#dfdfe8] bg-white p-2"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#f0f2f5]">
                        <Image src={dishImageUrl(d.image)} alt={d.name} fill className="object-cover" />
                      </div>
                      <div className="flex min-w-px flex-1 flex-col items-end gap-2">
                        <div className="flex w-full flex-col items-end gap-1">
                          <p className="line-clamp-1 w-full text-sm leading-5 text-[#24242e]">{d.name}</p>
                          <p className="w-full text-sm leading-5 font-bold text-[#4a4857]">{fmt(d.price)}</p>
                        </div>
                        <button
                          onClick={() => addDish(d)}
                          className="flex w-full items-center justify-center rounded border border-[#dfdfe8] bg-white py-1 pr-3 pl-4"
                        >
                          <span className="text-sm leading-5 font-bold whitespace-nowrap text-[#43263c]">ADD</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* confirm CTA — the only footer action in this frame */}
      {cart.length > 0 ? (
        <div className="shrink-0 rounded-t-3xl bg-white p-4 drop-shadow-[0px_6px_10.5px_rgba(7,7,7,0.1)]">
          <button
            onClick={confirmOrder}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#43263c] px-2.5 py-3.5 text-base leading-6 font-bold text-white"
          >
            Confirm Order
          </button>
        </div>
      ) : null}
    </div>
  );
}
