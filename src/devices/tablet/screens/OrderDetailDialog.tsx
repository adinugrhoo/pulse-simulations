"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { currency } from "@/sim/types";
import { useSim } from "@/sim/store";
import { MENU_CATALOG, dishImageUrl, type CatalogDish } from "@/sim/menuCatalog";

const ASSET = "/figma/tablet-order-detail";

/**
 * Gradients from the Figma node. The export hands the *first* stop a position that
 * sits after the second one; CSS would clamp the rest up to it and paint a solid gold
 * wedge over half the card. Figma renders that first stop at the origin, so it is
 * pinned to 0% here and every later stop is kept verbatim — a tight gold corner
 * falling away to near-black, which is what the frame actually shows.
 */
const GRAD_PULSE_SUMMARY =
  "linear-gradient(108.70679079093213deg, rgb(224, 192, 120) 0%, rgb(92, 82, 57) 4.2572%, rgb(38, 36, 31) 19.074%, rgb(25, 25, 25) 82.58%)";
const GRAD_GUEST_SUMMARY =
  "linear-gradient(119.91386405320843deg, rgb(224, 192, 120) 0%, rgb(92, 82, 57) 4.2572%, rgb(38, 36, 31) 19.074%, rgb(25, 25, 25) 82.58%)";
const GRAD_GOLD_ROW =
  "linear-gradient(90deg, rgb(224, 192, 120) 0%, rgb(92, 82, 57) 11.86%, rgb(38, 36, 31) 29.617%, rgb(25, 25, 25) 100%)";
const GRAD_PURPLE_ROW =
  "linear-gradient(90deg, rgb(95, 44, 191) 0%, rgb(95, 44, 191) 11.86%, rgb(59, 22, 128) 29.617%, rgb(25, 25, 25) 100%)";
const GRAD_BALANCE =
  "linear-gradient(-72.45536113588904deg, rgb(224, 192, 120) 0%, rgb(92, 82, 57) 8.9481%, rgb(38, 36, 31) 12.71%, rgb(25, 25, 25) 78.205%)";

/**
 * Guest CRM copy, verbatim from Figma node 2098:2517. The sim has no guest-history
 * or ML service behind it, so this is the design's own profiling payload; only the
 * guest's name is swapped for the one the table is actually seated under.
 */
const GUEST_PROFILE = {
  rating: "4.6",
  lastVisit: "12 days ago",
  visitCount: "4x",
  avgSpend: "SGD50",
  phone: "+65 8576 XXXX",
  customerId: "#ID-93948010123",
  pulseSummary: (name: string) =>
    `${name} usually spends over SGD35 on his meals, showcasing his love for exquisite French toast. For tonight's dining experience, a delightful Escargot dish could take center stage, beautifully paired with fresh pastries and seasonal specialties, all complemented by a selection of thoughtful wines.`,
  guestSummary: (name: string) =>
    `${name} usually spends more than SGD35 at Paris style cuisine restaurants.`,
} as const;

/** Figma prints 75% on every recommendation card — there is no scoring model to read. */
const MATCH_PCT = 75;
/** Design-fidelity fallback for the two lead cards until the sim has real reorder history. */
const SEEDED_REORDERS = [4, 4];

type Stat = { icon: string; label: string };

function StatItem({ icon, label }: Stat) {
  return (
    <div className="flex items-center gap-1">
      <Image src={`${ASSET}/${icon}.svg`} alt="" width={14} height={14} className="size-[14px]" />
      <span className="text-sm leading-none whitespace-nowrap text-white">{label}</span>
    </div>
  );
}

/** Gold-gradient insight row used for the Top 1% / birthday chips. */
function InsightRow({
  gradient,
  icon,
  children,
}: {
  gradient: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex w-full items-center gap-2 rounded-lg border border-[rgba(118,99,64,0.1)] px-3 py-2"
      style={{ backgroundImage: gradient }}
    >
      {icon ? (
        <Image src={`${ASSET}/${icon}.svg`} alt="" width={14} height={14} className="size-[14px] shrink-0" />
      ) : null}
      <p className="min-w-px flex-1 text-sm leading-none text-[#afaca2]">{children}</p>
    </div>
  );
}

function DishCard({
  dish,
  reorders,
  onAdd,
}: {
  dish: CatalogDish;
  reorders: number;
  onAdd: () => void;
}) {
  const [primaryTag, ...restTags] = dish.tags ?? [];

  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative flex h-[131px] w-full items-center gap-3 rounded-[18px] border border-[rgba(118,99,64,0.1)] p-2 text-left transition hover:brightness-125"
      style={{ backgroundImage: GRAD_GOLD_ROW }}
    >
      <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-[18px]">
        <Image src={dishImageUrl(dish.image)} alt={dish.name} fill className="object-cover" />
      </div>

      <div className="flex h-full min-w-px flex-1 flex-col items-start justify-between pt-5 pb-1">
        <div className="flex w-full flex-col items-start gap-2">
          <p className="w-full text-sm leading-[1.1] break-words text-[#fcdfa2]">{dish.name}</p>
          {dish.description ? (
            <p className="w-[276px] text-xs leading-[1.15] font-light text-[#afaca2]">{dish.description}</p>
          ) : null}
        </div>
        <div className="flex w-full items-center justify-between pr-3">
          <p className="text-xs leading-none font-bold whitespace-nowrap text-white">{currency(dish.price)}</p>
          <div className="flex items-center gap-2">
            {primaryTag ? (
              <div className="flex items-center gap-1">
                <div className="flex size-[14px] items-center justify-center overflow-hidden rounded-[25px] bg-[#dc0a22]">
                  <Image src={`${ASSET}/chili.svg`} alt="" width={8} height={6} className="h-[5.39px] w-[7.583px]" />
                </div>
                <span className="text-xs whitespace-nowrap text-[#afaca2]">{primaryTag}</span>
                {restTags.length ? (
                  <span className="text-[10px] font-bold whitespace-nowrap text-[#afaca2]">+{restTags.length}</span>
                ) : null}
              </div>
            ) : null}
            {dish.kcal ? (
              <p className="text-right text-xs whitespace-nowrap text-[#afaca2]">
                <span className="text-white">{dish.kcal}</span> kCal
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* match / reorder ribbons hang one pixel above the card edge, per Figma */}
      <div className="absolute top-[-1px] left-[109px] flex items-center justify-center rounded-b-md bg-[#00abb6] px-2 py-[5px]">
        <span className="text-[10px] leading-[1.2] font-bold whitespace-nowrap text-white">{MATCH_PCT}% Match</span>
      </div>
      {reorders > 0 ? (
        <div className="absolute top-[-1px] left-[180px] flex items-center justify-center rounded-b-md bg-[#6c31cf] px-2 py-[5px]">
          <span className="text-[10px] leading-[1.2] font-bold whitespace-nowrap text-white">{reorders}x Reorder</span>
        </div>
      ) : null}
    </button>
  );
}

/**
 * Figma: Pulse, node 2098:2517 — the tablet order-detail popup. A 1240×760 dialog
 * (close button + 1182×760 panel) sitting on a dimmed floor plan, i.e. nearly the
 * full 1280×800 tablet. Three columns: guest profiling (left), dish recommendations
 * (middle), table + order items (right), with the balance bar spanning the bottom.
 *
 * Guest profiling copy is the design's; the table, order lines, balance and every
 * action are live sim state. Recommendation cards carry the mobile menu catalog
 * (src/sim/menuCatalog.ts) so both devices quote the same dishes, prices and photos.
 */
export function OrderDetailDialog({ tableId, onClose }: { tableId: string; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dispatch = useSim((s) => s.dispatch);
  const table = useSim((s) => s.tables.find((t) => t.id === tableId));
  const orders = useSim((s) => s.orders);
  const waiterCart = useSim((s) => s.waiter.cart);
  const customerName = useSim((s) => s.customer.guestName);

  const orderLines = useMemo(
    () =>
      orders
        .filter((o) => o.tableId === tableId && o.status !== "rejected" && o.status !== "paid")
        .flatMap((o) => o.lines),
    [orders, tableId],
  );
  const orderedIds = useMemo(() => new Set(orderLines.map((l) => l.itemId)), [orderLines]);

  /** Every catalog dish not already on the table, so the strip mirrors the mobile menu. */
  const recommendations = useMemo(
    () => MENU_CATALOG.filter((d) => !orderedIds.has(d.id)),
    [orderedIds],
  );

  /** Real reorder history across the floor; seeded for the lead cards while it is empty. */
  const reorderCount = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => o.lines.forEach((l) => counts.set(l.itemId, (counts.get(l.itemId) ?? 0) + l.qty)));
    return counts;
  }, [orders]);

  const close = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!table) return null;

  const guestName = table.guestName ?? customerName ?? "Ash";
  const initial = guestName.slice(0, 1).toUpperCase();
  const pendingCount = waiterCart.reduce((n, l) => n + l.qty, 0);
  const balance = table.totalBill ?? 0;
  const isPaid = table.status === "billed";

  const addDish = (dish: CatalogDish) =>
    dispatch({
      type: "waiter/add-to-cart",
      tableId,
      line: { itemId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1 },
    });
  const addOrder = () => dispatch({ type: "waiter/submit-order", tableId });
  const closeTable = () => dispatch({ type: "waiter/settle-bill", tableId, amount: balance });

  return (
    <div className={cn(figtree.className, "absolute inset-0 z-40")}>
      <button
        aria-label="Close order detail"
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/70 transition-opacity duration-200",
          show ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "absolute top-5 left-5 flex items-start gap-3 transition duration-200 ease-out",
          show ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
      >
        {/* close affordance sits outside the panel, per the Figma frame */}
        <button
          onClick={close}
          aria-label="Close"
          className="relative size-[46px] shrink-0 overflow-hidden rounded-full bg-[#101213]"
        >
          <Image
            src={`${ASSET}/close.svg`}
            alt=""
            width={24}
            height={24}
            className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2"
          />
        </button>

        <div className="relative h-[760px] w-[1182px] shrink-0 overflow-hidden rounded-[24px] bg-[#101213]">
          {/* ------------------------- guest profiling ------------------------ */}
          <div className="absolute top-2 left-2 h-[650px] w-[360px] overflow-x-clip overflow-y-auto">
            <div className="flex w-[360px] flex-col items-start gap-4 rounded-tl-[20px] bg-[#17181a] p-5">
              <div className="flex w-full flex-col items-start gap-3.5">
                <p className="w-full text-2xl leading-none font-bold break-words text-[#fcdfa2]">Guest list</p>

                <div className="flex w-full flex-col items-start gap-2">
                  <div className="flex w-[320px] items-center justify-center rounded-lg bg-[#1b1b1a] py-3">
                    <div className="flex w-[276px] items-center justify-between">
                      <StatItem icon="star" label={GUEST_PROFILE.rating} />
                      <StatItem icon="calendar" label={GUEST_PROFILE.lastVisit} />
                      <StatItem icon="reorder" label={GUEST_PROFILE.visitCount} />
                      <StatItem icon="money-bag" label={GUEST_PROFILE.avgSpend} />
                    </div>
                  </div>

                  <div
                    className="flex w-full flex-col items-start gap-2 rounded-lg border border-[rgba(118,99,64,0.1)] p-3"
                    style={{ backgroundImage: GRAD_PULSE_SUMMARY }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Image src={`${ASSET}/sparkle.svg`} alt="" width={16} height={16} className="size-4" />
                      <p className="text-base leading-none font-medium whitespace-nowrap text-[#fcdfa2]">
                        Pulse Summary
                      </p>
                    </div>
                    <p className="w-full text-sm leading-[1.2] break-words text-[#afaca2]">
                      {GUEST_PROFILE.pulseSummary(guestName)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full items-center justify-between">
                <p className="text-base leading-none font-semibold whitespace-nowrap text-[#cdcdcd]">Guest list</p>
                <div className="relative mx-2 h-px min-w-px flex-1">
                  <Image src={`${ASSET}/divider.svg`} alt="" fill className="object-fill" />
                </div>
                <button type="button" className="flex items-center gap-0.5">
                  <Image src={`${ASSET}/plus-small.svg`} alt="" width={14} height={14} className="size-[14px]" />
                  <span className="text-base leading-none whitespace-nowrap text-[#fcdfa2]">Add</span>
                </button>
              </div>

              <div className="flex w-full flex-col items-start gap-3">
                <div className="flex w-full items-center">
                  <div className="relative size-[46px] shrink-0 overflow-hidden rounded-full border-2 border-[#74581d]">
                    <div className="absolute top-1 left-1 flex size-[38px] items-center justify-center overflow-hidden rounded-full bg-[#fff8eb] shadow-[3.304px_0px_8.261px_6.609px_rgba(58,58,58,0.15)]">
                      <span className="text-base leading-none font-bold text-[#74581d]">{initial}</span>
                    </div>
                  </div>
                </div>

                <div className="flex w-[320px] flex-col items-start gap-4 overflow-hidden rounded-2xl border border-[rgba(118,99,64,0.1)] bg-[#21201d] p-5">
                  <div className="flex w-full items-center gap-2">
                    <div className="flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff8eb] shadow-[4px_0px_10px_8px_rgba(58,58,58,0.15)]">
                      <span className="text-xl leading-none font-bold text-[#74581d]">{initial}</span>
                    </div>
                    <div className="flex w-[133px] flex-col items-start gap-1 leading-none break-words">
                      <p className="w-full text-2xl font-bold text-[#fff8eb]">{guestName}</p>
                      <p className="w-full text-sm text-[#646667]">{GUEST_PROFILE.phone}</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col items-start gap-1.5">
                    <div
                      className="flex w-full flex-col items-start gap-2 rounded-lg border border-[rgba(118,99,64,0.1)] p-3.5"
                      style={{ backgroundImage: GRAD_GUEST_SUMMARY }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Image src={`${ASSET}/sparkle.svg`} alt="" width={16} height={16} className="size-4" />
                        <p className="text-base leading-none font-medium whitespace-nowrap text-[#fcdfa2]">
                          Guest Summary
                        </p>
                      </div>
                      <p className="w-full text-sm leading-[1.2] break-words text-[#afaca2]">
                        {GUEST_PROFILE.guestSummary(guestName)}
                      </p>
                    </div>

                    <div
                      className="flex w-full items-center rounded-lg border border-[rgba(118,99,64,0.1)] px-3 py-2"
                      style={{ backgroundImage: GRAD_PURPLE_ROW }}
                    >
                      <p className="min-w-px flex-1 text-sm leading-none text-white">Winback SMS • June 10th</p>
                    </div>

                    <InsightRow gradient={GRAD_GOLD_ROW}>
                      <span className="font-bold text-[#f5dfa8]">Top 1%</span> of your customer surprise visitor
                    </InsightRow>

                    <InsightRow gradient={GRAD_GOLD_ROW} icon="cake">
                      <span className="font-bold text-[#f5dfa8]">Today</span> is the customer&rsquo;s birthday
                    </InsightRow>
                  </div>

                  <button
                    type="button"
                    className="flex items-center justify-center rounded-xl border border-[#2f2d2b] px-4 py-3.5"
                  >
                    <span className="text-sm leading-none font-semibold whitespace-nowrap text-[#cdcdcd]">
                      Show more
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------- dish recommendations ---------------------- */}
          <div className="absolute top-2 left-1/2 flex h-[650px] w-[446px] -translate-x-1/2 flex-col items-start bg-[#17181a]">
            <div className="flex w-full shrink-0 items-center border-b-2 border-[#1c1c1c] bg-[#17181a] px-5 pt-6">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-start gap-1">
                  <Image src={`${ASSET}/sparkle-tab.svg`} alt="" width={16} height={16} className="size-4" />
                  <p className="text-base leading-none font-semibold whitespace-nowrap text-[#f5dfa8]">
                    Dish Recommendation
                  </p>
                </div>
                <div className="h-0.5 w-[200px] rounded-full bg-[#f5dfa8]" />
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col items-start overflow-y-auto bg-[#17181a] p-5">
              <div className="flex w-[406px] flex-col items-start gap-2">
                {recommendations.map((dish, i) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    reorders={reorderCount.get(dish.id) ?? SEEDED_REORDERS[i] ?? 0}
                    onAdd={() => addDish(dish)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ----------------------- table + order items ---------------------- */}
          <div className="absolute top-2 left-[814px] flex h-[650px] w-[360px] flex-col overflow-hidden rounded-tr-2xl bg-[#17181a]">
            <div className="flex w-full shrink-0 flex-col items-start gap-3.5 px-6 pt-6 pb-3">
              <div className="flex w-full items-center justify-between">
                <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{table.label}</p>
                <p className="text-sm leading-none whitespace-nowrap text-[#646667]">{GUEST_PROFILE.customerId}</p>
              </div>
              <div className="flex w-full items-center justify-center rounded-lg bg-[#1b1b1a] p-3">
                <div className="flex items-center gap-4">
                  <StatItem icon="person" label={`${table.guests ?? 1} pax`} />
                  <StatItem icon="clock" label={`${table.seatedMinutes ?? 0}m`} />
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start gap-3 overflow-y-auto p-6">
              <div className="flex w-full items-center justify-between">
                <p className="text-base leading-none font-semibold whitespace-nowrap text-[#cdcdcd]">Order items</p>
                <button type="button" aria-label="Refresh order items">
                  <Image src={`${ASSET}/refresh.svg`} alt="" width={16} height={16} className="size-4" />
                </button>
              </div>

              {orderLines.length === 0 && waiterCart.length === 0 ? (
                <p className="text-sm leading-[1.2] text-[#646667]">No items ordered yet.</p>
              ) : (
                <div className="flex w-full flex-col items-start gap-2">
                  {orderLines.map((line) => (
                    <div key={line.lineId} className="flex w-full items-center justify-between gap-3">
                      <p className="min-w-px flex-1 text-sm leading-[1.2] text-[#fff8eb]">
                        {line.name} <span className="text-[#646667]">×{line.qty}</span>
                      </p>
                      <p className="text-sm leading-none font-bold whitespace-nowrap text-[#fcdfa2]">
                        {currency(line.unitPrice * line.qty)}
                      </p>
                    </div>
                  ))}
                  {waiterCart.map((line) => (
                    <div key={line.lineId} className="flex w-full items-center justify-between gap-3 opacity-60">
                      <p className="min-w-px flex-1 text-sm leading-[1.2] text-[#fff8eb]">
                        {line.name} <span className="text-[#646667]">×{line.qty}</span>
                      </p>
                      <span className="rounded-full bg-[#433a31] px-2 py-1 text-[10px] leading-none font-semibold text-[#fff8eb]">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-[#1c1c1c] px-6 py-4">
              <button
                type="button"
                disabled
                className="flex items-center justify-center rounded-xl bg-[#3a3a3a] px-4 py-3.5"
              >
                <span className="text-sm leading-none font-semibold whitespace-nowrap text-[#939393]">
                  Reduce Item / Void
                </span>
              </button>
              <button
                onClick={addOrder}
                disabled={pendingCount === 0}
                className="flex items-center justify-center gap-1 rounded-xl border border-[#2f2d2b] bg-[#101213] px-4 py-3.5 disabled:opacity-50"
              >
                <Image src={`${ASSET}/plus.svg`} alt="" width={14} height={14} className="size-[14px]" />
                <span className="text-sm leading-none font-semibold whitespace-nowrap text-[#fff8eb]">
                  Add Order{pendingCount > 0 ? ` (${pendingCount})` : ""}
                </span>
              </button>
            </div>
          </div>

          {/* --------------------------- balance bar -------------------------- */}
          <div className="absolute top-[656px] left-1/2 flex w-[1166px] -translate-x-1/2 items-center justify-end rounded-b-2xl bg-[#1b1b1a] px-6 py-4">
            <div className="flex w-[1118px] items-center justify-between">
              <div className="flex items-center">
                <div
                  className="flex items-center rounded-2xl border border-[rgba(118,99,64,0.1)] py-2.5 pr-2 pl-[18px]"
                  style={{ backgroundImage: GRAD_BALANCE }}
                >
                  <div className="flex items-center gap-2 pr-1">
                    <div className="flex flex-col items-start gap-2">
                      <p className="text-sm leading-none whitespace-nowrap text-[#fcdfa2]">Balance</p>
                      <p className="text-right text-xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">
                        {currency(balance)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#433a31] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#fff8eb]">
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                    <Image
                      src={`${ASSET}/chevron-updown.svg`}
                      alt=""
                      width={14}
                      height={14}
                      className="size-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex w-[332px] items-center gap-2.5">
                <button
                  type="button"
                  className="flex w-[102px] items-center justify-center gap-1.5 rounded-xl border border-[#6e5e41] bg-[#1b1b1b] px-3 py-4"
                >
                  <Image src={`${ASSET}/printer.svg`} alt="" width={14} height={14} className="size-[14px]" />
                  <span className="text-sm leading-none font-bold whitespace-nowrap text-[#fff8eb]">Receipt</span>
                </button>
                <button
                  onClick={closeTable}
                  disabled={isPaid}
                  className="flex min-w-px flex-1 items-center justify-center rounded-xl border border-[rgba(170,44,30,0.3)] bg-[rgba(219,46,26,0.3)] p-4 disabled:opacity-40"
                >
                  <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">Close Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
