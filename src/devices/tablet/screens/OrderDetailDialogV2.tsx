"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { currency } from "@/sim/types";
import { useSim } from "@/sim/store";
import { OpenTableFlow } from "./OpenTableSheets";
import { CashPaymentSheet, CollectPaymentSheet, PaymentConfirmedSheet, pressKey } from "./CollectPaymentSheets";
import { ConfirmCloseSheet, PaymentSummarySheet } from "./PaidTableSheets";
import { MENU_CATALOG, dishImageUrl, type CatalogDish } from "@/sim/menuCatalog";

const ASSET = "/figma/tablet-order-detail";

/**
 * Gold gradients. The Figma export pins a solid gold corner that falls to near-black in a
 * few hard steps, which leaves visible banding lines inside the cards. Here the gold is
 * a low-opacity wash (peak 0.2) that eases to fully transparent over many stops, so it
 * blends into whatever card sits behind it with no residual edge.
 */
const goldFade = (angle: string) =>
  `linear-gradient(${angle}, rgba(224, 192, 120, 0.2) 0%, rgba(224, 192, 120, 0.15) 8%, rgba(224, 192, 120, 0.1) 20%, rgba(224, 192, 120, 0.05) 38%, rgba(224, 192, 120, 0.02) 60%, rgba(224, 192, 120, 0) 100%)`;
/**
 * Gradient fill that also covers the 1px border. With the default padding-box origin and
 * repeat, the border strip gets the next tile, whose start is the opaque gold edge: that was
 * the thin vertical gold line down the cards' sides.
 */
const fill = (backgroundImage: string): React.CSSProperties => ({
  backgroundImage,
  backgroundOrigin: "border-box",
  backgroundRepeat: "no-repeat",
});
const GRAD_PULSE_SUMMARY = goldFade("108.7deg");
const GRAD_GUEST_SUMMARY = goldFade("119.9deg");
const GRAD_GOLD_ROW = goldFade("90deg");
const GRAD_BALANCE = goldFade("-72.5deg");
/** Figma 2915:17029 partial-paid bill card, on the same soft gold wash as the other cards. */
const GRAD_PARTIAL = goldFade("-73.53deg");
const GRAD_ADD =
  "linear-gradient(86.6deg, rgba(170, 127, 30, 0.3) 0%, rgba(144, 105, 14, 0.3) 52%, rgba(170, 130, 37, 0.3) 99.8%)";
const GRAD_PAY = "linear-gradient(85.8deg, rgb(170, 127, 30) 0%, rgb(144, 105, 14) 52%, rgb(170, 130, 37) 99.8%)";

const TASTE_PROFILE = ["Paris", "Pastry", "Sweet", "Wines"];

type GuestView = "all" | "guest";

/** "80" -> "1h 20m", "45" -> "45m" */
const formatSeated = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

function VisitProfile() {
  return (
    <div className="flex w-full flex-col items-start gap-3">
      <p className="w-full text-sm leading-none font-semibold text-[#cdcdcd]">Visit profile</p>
      <div className="flex w-full flex-col items-start gap-3">
        {[
          { icon: "calendar", label: GUEST_PROFILE.lastVisit },
          { icon: "reorder", label: "4 times" },
          { icon: "money-bag", label: "Usual spend SGD35.00" },
        ].map((row) => (
          <div key={row.icon} className="flex items-center gap-1">
            <Image src={`${ASSET}/${row.icon}.svg`} alt="" width={14} height={14} className="size-[14px]" />
            <span className="text-sm leading-none whitespace-nowrap text-[#fcdfa2]">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestAvatar({
  selected,
  label,
  onClick,
  children,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition",
        selected ? "border-[#74581d]" : "border-[#2f2d2b] hover:brightness-110",
      )}
    >
      <span
        className={cn(
          "flex size-[38px] items-center justify-center overflow-hidden rounded-full shadow-[3.304px_0px_8.261px_6.609px_rgba(58,58,58,0.15)]",
          selected ? "bg-[#f5dfa8]" : "bg-[#fff8eb]",
        )}
      >
        {children}
      </span>
    </button>
  );
}

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
      style={fill(gradient)}
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
  /** Confirming the stepper sends `qty` of the dish straight to the table's order items. */
  onAdd: (qty: number) => void;
}) {
  const [primaryTag, ...restTags] = dish.tags ?? [];
  /** 0 shows the Add to Order button; tapping it opens the − qty + ✓ stepper. */
  const [qty, setQty] = useState(0);

  return (
    <div
      className="relative flex w-full items-start gap-3 rounded-[18px] border border-[rgba(118,99,64,0.1)] p-2 text-left"
      style={fill(GRAD_GOLD_ROW)}
    >
      <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-[18px]">
        <Image src={dishImageUrl(dish.image)} alt={dish.name} fill className="object-cover" />
      </div>

      <div className="flex min-w-px flex-1 flex-col items-end gap-2 pt-5 pb-1">
        <div className="flex w-full flex-col items-start gap-2">
          <p className="w-full text-sm leading-[1.1] break-words text-[#fcdfa2]">{dish.name}</p>
          {dish.description ? (
            <p className="w-full text-xs leading-[1.15] font-light text-[#afaca2]">{dish.description}</p>
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
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => setQty(1)}
            className="flex h-9 w-[140px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#e8bc6b] p-4 transition hover:brightness-125"
            style={{ backgroundImage: GRAD_ADD }}
          >
            <Image src={`${ASSET}/plus.svg`} alt="" width={14} height={14} className="size-[14px]" />
            <span className="text-sm leading-none font-bold whitespace-nowrap text-[#fff8eb]">Add to Order</span>
          </button>
        ) : (
          <div className="flex h-9 shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label={`Decrease ${dish.name}`}
              onClick={() => setQty(qty - 1)}
              className="flex size-9 items-center justify-center rounded-lg border border-[#3a3a3a] transition hover:bg-white/5"
            >
              <span className="h-[1.5px] w-3 rounded-full bg-[#fff8eb]" />
            </button>
            <span className="w-6 text-center text-sm leading-none font-bold text-[#fff8eb] tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label={`Increase ${dish.name}`}
              onClick={() => setQty(qty + 1)}
              className="flex size-9 items-center justify-center rounded-lg border border-[#3a3a3a] transition hover:bg-white/5"
            >
              <Image src={`${ASSET}/plus.svg`} alt="" width={14} height={14} className="size-[14px]" />
            </button>
            <button
              type="button"
              aria-label={`Confirm ${qty} ${dish.name}`}
              onClick={() => {
                onAdd(qty);
                setQty(0);
              }}
              className="flex size-9 items-center justify-center rounded-lg border border-[#e8bc6b] transition hover:brightness-110"
              style={{ backgroundImage: GRAD_PAY }}
            >
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="#fff8eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8.5l3.2 3L13 4.5" />
              </svg>
            </button>
          </div>
        )}
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
    </div>
  );
}

/**
 * Phase 2.0 variant, Figma node 2864:13166. Same guest profiling, but the dish
 * recommendation column shrinks to 380px, the order/bill column widens to 426px and
 * carries the Total bill / Paid bill / Balance card, and the action buttons move to the
 * bottom bar (Reduce / Add Order left, Receipt / Pay Bill right).
 *
 * Original Phase 1.0 doc, Figma node 2098:2517 — the tablet order-detail popup. A 1240×760 dialog
 * (close button + 1182×760 panel) sitting on a dimmed floor plan, i.e. nearly the
 * full 1280×800 tablet. Three columns: guest profiling (left), dish recommendations
 * (middle), table + order items (right), with the balance bar spanning the bottom.
 *
 * Guest profiling copy is the design's; the table, order lines, balance and every
 * action are live sim state. Recommendation cards carry the mobile menu catalog
 * (src/sim/menuCatalog.ts) so both devices quote the same dishes, prices and photos.
 */
export function OrderDetailDialogV2({ tableId, onClose }: { tableId: string; onClose: () => void }) {
  const [show, setShow] = useState(false);
  /** Default is the table-wide Pulse Summary; tapping a guest avatar swaps in that person's card. */
  const [view, setView] = useState<GuestView>("all");
  const [addingGuest, setAddingGuest] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  /** Pay Bill flow: pick a method, key in the cash handed over, then the receipt. */
  const [payStep, setPayStep] = useState<"method" | "cash" | "confirmed" | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const dispatch = useSim((s) => s.dispatch);
  const table = useSim((s) => s.tables.find((t) => t.id === tableId));
  const orders = useSim((s) => s.orders);
  const waiterCart = useSim((s) => s.waiter.cart);
  const customerName = useSim((s) => s.customer.guestName);

  const isPaid = table?.status === "billed";
  /** A paid table still lists what was paid for; otherwise only the open (unsettled) orders. Dishes only: the seeded service charge line is not shown. */
  const orderLines = useMemo(
    () =>
      orders
        .filter((o) => o.tableId === tableId && o.status !== "rejected" && (isPaid || o.status !== "paid"))
        .flatMap((o) => o.lines)
        .filter((l) => l.itemId !== "svc"),
    [orders, tableId, isPaid],
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
  /** A freshly opened table: nothing ordered, nothing owed, so the only way out is to close it. */
  const noOrders = orderLines.length === 0 && waiterCart.length === 0 && !isPaid && table.status !== "partial";
  const noItems = orderLines.length === 0 && waiterCart.length === 0;
  const paidBill = table.paidBill ?? 0;
  const balance = table.status === "partial" ? (table.balance ?? 0) : isPaid ? 0 : (table.totalBill ?? 0);
  const totalBill = isPaid ? paidBill : paidBill + balance;
  const statusLabel = isPaid ? "Paid" : table.status === "partial" ? "Partial Paid" : "Unpaid";
  const statusTone = table.status === "partial" ? "bg-[#18686d]" : "bg-[#433a31]";

  /** The ✓ on a recommendation card fires the order right away, so the dish lands in Order items. */
  const addDish = (dish: CatalogDish, qty: number) => {
    dispatch({
      type: "waiter/add-to-cart",
      tableId,
      line: { itemId: dish.id, name: dish.name, unitPrice: dish.price, qty },
    });
    dispatch({ type: "waiter/submit-order", tableId });
  };
  const openPos = () => dispatch({ type: "waiter/open-pos", tableId });
  const closeTable = () => dispatch({ type: "waiter/close-table", tableId });
  const payBill = () => {
    setCashAmount("");
    setPayStep("method");
  };
  const confirmCash = () => {
    // the receipt keeps the bill it was settled against, so capture it before the table flips to paid
    dispatch({ type: "waiter/settle-bill", tableId, amount: totalBill, method: "Cash", tendered: Number(cashAmount) || totalBill });
    setPayStep("confirmed");
  };

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
          <div className="absolute top-2 left-2 h-[670px] w-[360px] overflow-x-clip overflow-y-auto">
            <div className="flex min-h-full w-[360px] flex-col items-start rounded-tl-[20px] bg-[#17181a] p-[26px]">
              <div className="flex w-full items-center justify-between">
                <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Guest list</p>
                <button
                  type="button"
                  onClick={() => setAddingGuest(true)}
                  className="-mr-2 flex items-center gap-0.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
                >
                  <Image src={`${ASSET}/plus-small.svg`} alt="" width={14} height={14} className="size-[14px]" />
                  <span className="text-base leading-none whitespace-nowrap text-[#fcdfa2]">Add</span>
                </button>
              </div>

              <div className="mt-2 flex w-full flex-col items-start gap-3">
                <div className="relative h-px w-full">
                  <Image src={`${ASSET}/divider.svg`} alt="" fill className="object-fill" />
                </div>
                <div className="flex h-[46px] w-full items-center gap-1">
                  <GuestAvatar selected={view === "all"} label="All guests" onClick={() => setView("all")}>
                    <Image src={`${ASSET}/all-guest.svg`} alt="" width={16} height={16} className="size-4" />
                  </GuestAvatar>
                  <GuestAvatar selected={view === "guest"} label={guestName} onClick={() => setView("guest")}>
                    <span className="text-base leading-none font-bold text-[#74581d]">{initial}</span>
                  </GuestAvatar>
                </div>

                <div className="flex w-full flex-col items-start gap-4 overflow-hidden rounded-2xl border border-[rgba(118,99,64,0.1)] bg-[#21201d] p-5">
                  <div className="flex w-full items-center gap-2">
                    <div className="flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff8eb] shadow-[4px_0px_10px_8px_rgba(58,58,58,0.15)]">
                      {view === "all" ? (
                        <Image src={`${ASSET}/all-guest.svg`} alt="" width={16} height={16} className="size-4" />
                      ) : (
                        <span className="text-xl leading-none font-bold text-[#74581d]">{initial}</span>
                      )}
                    </div>
                    <div className="flex w-[133px] flex-col items-start gap-1 leading-none break-words">
                      <p className="w-full text-2xl font-bold text-[#fff8eb]">{view === "all" ? "All Guest" : guestName}</p>
                      {view === "guest" ? (
                        <p className="w-full text-sm text-[#646667]">{table.phone ?? GUEST_PROFILE.phone}</p>
                      ) : null}
                    </div>
                  </div>

                  {view === "all" ? (
                    <div
                      className="flex w-full flex-col items-start gap-2 rounded-lg border border-[rgba(118,99,64,0.1)] p-3"
                      style={fill(GRAD_PULSE_SUMMARY)}
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
                  ) : (
                    <div className="flex w-full flex-col items-start gap-1.5">
                      <div
                        className="flex w-full flex-col items-start gap-2 rounded-lg border border-[rgba(118,99,64,0.1)] p-3.5"
                        style={fill(GRAD_GUEST_SUMMARY)}
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
                      <InsightRow gradient={GRAD_GOLD_ROW}>
                        <span className="font-bold text-[#f5dfa8]">Top 1%</span> of your customer surprise visitor
                      </InsightRow>
                    </div>
                  )}

                  <div className="flex w-full flex-col items-start gap-5">
                    <VisitProfile />
                    {view === "guest" ? (
                      <div className="flex w-full flex-col items-start gap-3">
                        <p className="w-full text-sm leading-none font-semibold text-[#cdcdcd]">Taste profile</p>
                        <div className="flex w-full flex-wrap items-center gap-1">
                          {TASTE_PROFILE.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-[#1b1b1a] px-3 py-2 text-sm leading-none whitespace-nowrap text-[#afaca2]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------------- dish recommendations ---------------------- */}
          <div className="absolute top-2 left-[368px] flex h-[670px] w-[446px] flex-col items-start bg-[#17181a]">
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
                {MENU_CATALOG.map((dish, i) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    reorders={reorderCount.get(dish.id) ?? SEEDED_REORDERS[i] ?? 0}
                    onAdd={(qty) => addDish(dish, qty)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ----------------------- table + order items ---------------------- */}
          <div className="absolute top-2 left-[814px] flex h-[670px] w-[360px] flex-col overflow-hidden rounded-tr-2xl bg-[#17181a]">
            <div className="flex w-full shrink-0 flex-col items-start gap-3.5 px-5 pt-5 pb-3">
              <div className="flex w-full items-center justify-between">
                <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{table.label}</p>
                <p className="text-sm leading-none whitespace-nowrap text-[#646667]">{GUEST_PROFILE.customerId}</p>
              </div>
              <div className="flex w-full items-center justify-center rounded-lg bg-[#1b1b1a] p-3">
                <div className="flex items-center gap-4">
                  <StatItem icon="person" label={`${table.guests ?? 1} pax`} />
                  <StatItem icon="clock" label={formatSeated(table.seatedMinutes ?? 0)} />
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start gap-6 overflow-y-auto p-5">
              <div className="flex w-full items-center justify-between">
                <p className="text-base leading-none font-semibold whitespace-nowrap text-[#cdcdcd]">Order items</p>
                <button type="button" aria-label="Refresh order items">
                  <Image src={`${ASSET}/refresh.svg`} alt="" width={16} height={16} className="size-4" />
                </button>
              </div>

              {orderLines.length === 0 && waiterCart.length === 0 ? (
                <p className="text-sm leading-[1.2] text-[#646667]">No items ordered yet.</p>
              ) : (
                <>
                  {orderLines.map((line) => (
                    <div key={line.lineId} className="flex w-full flex-col items-start gap-3">
                      <div className="flex w-full items-center justify-between text-sm leading-none text-[#8f8f8f]">
                        <p className="w-[192px] overflow-hidden text-ellipsis whitespace-nowrap">{line.name}</p>
                        <div className="flex w-[100px] items-center justify-between whitespace-nowrap">
                          <p>x{line.qty}</p>
                          <p>{currency(line.unitPrice * line.qty)}</p>
                        </div>
                      </div>
                      {line.notes ? (
                        <p className="w-full rounded-lg bg-[#1b1b1a] p-2 text-xs leading-[1.3] text-[#9f9f9f]">
                          &ldquo;{line.notes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  ))}
                  {waiterCart.map((line) => (
                    <div
                      key={line.lineId}
                      className="flex w-full items-center justify-between text-sm leading-none text-[#8f8f8f] opacity-60"
                    >
                      <p className="w-[192px] overflow-hidden text-ellipsis whitespace-nowrap">{line.name}</p>
                      <div className="flex w-[100px] items-center justify-between whitespace-nowrap">
                        <p>x{line.qty}</p>
                        <span className="rounded-full bg-[#433a31] px-2 py-1 text-[10px] leading-none font-semibold text-[#fff8eb]">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Open payment summary"
              onClick={() => setSummaryOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSummaryOpen(true);
                }
              }}
              className="w-full shrink-0 cursor-pointer transition hover:brightness-125 active:brightness-95"
            >
            {table.status === "partial" ? (
              <div className="flex w-full shrink-0 flex-col items-start justify-center gap-4 p-3" style={fill(GRAD_PARTIAL)}>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Image src={`${ASSET}/tips.svg`} alt="" width={14} height={14} className="size-[14px]" />
                      <p className="text-sm leading-none whitespace-nowrap text-[#afaca2]">Total tips</p>
                    </div>
                    <p className="text-right text-sm leading-none font-semibold whitespace-nowrap text-[#cdcdcd]">
                      {currency(table.tips ?? 0)}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#fff8eb]", statusTone)}>
                    {statusLabel}
                  </span>
                </div>
                <Image src={`${ASSET}/bill-divider.svg`} alt="" width={336} height={1} className="h-px w-[336px]" />
                <div className="flex w-full items-center gap-2 px-1">
                  <div className="flex min-w-px flex-1 items-center gap-6">
                    <div className="flex h-[42px] flex-col items-start justify-between whitespace-nowrap">
                      <p className="text-sm leading-none text-[#cdcdcd]">Total bill</p>
                      <p className="text-base leading-none text-[#cdcdcd]">{currency(totalBill)}</p>
                    </div>
                    <div className="flex h-[42px] flex-col items-start justify-between whitespace-nowrap">
                      <p className="text-sm leading-none text-[#cdcdcd]">Paid bill</p>
                      <p className="text-base leading-none text-[#8eecae]">-{currency(paidBill)}</p>
                    </div>
                    <div className="flex h-[42px] flex-col items-start justify-between whitespace-nowrap">
                      <p className="text-sm leading-none text-[#fcdfa2]">Balance</p>
                      <p className="text-base leading-none font-bold text-[#fcdfa2]">{currency(balance)}</p>
                    </div>
                  </div>
                  <Image src={`${ASSET}/chevron-updown.svg`} alt="" width={14} height={14} className="size-[14px]" />
                </div>
              </div>
            ) : (
            <div className="flex w-full shrink-0 items-center p-2" style={fill(GRAD_BALANCE)}>
              <div className="flex min-w-px flex-1 items-center justify-between px-1">
                <div className="flex flex-col items-start gap-2 whitespace-nowrap">
                  <p className="text-sm leading-none text-[#fcdfa2]">Total bill</p>
                  <p className="text-xl leading-none font-bold text-[#fcdfa2]">{currency(totalBill)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#fff8eb]", statusTone)}>
                    {statusLabel}
                  </span>
                  <Image src={`${ASSET}/chevron-updown.svg`} alt="" width={14} height={14} className="size-[14px]" />
                </div>
              </div>
            </div>
            )}
            </div>
          </div>

          {/* --------------------------- action bar --------------------------- */}
          <div className="absolute top-[678px] left-2 flex h-[74px] w-[1166px] items-center justify-between rounded-b-2xl bg-[#1b1b1a] px-6 py-4">
            <div className="flex w-[332px] items-center gap-2.5">
              {noOrders ? (
                <button
                  onClick={() => setConfirmingClose(true)}
                  className="flex min-w-px flex-1 items-center justify-center rounded-xl border border-[rgba(170,44,30,0.3)] bg-[rgba(219,46,26,0.3)] p-4 transition hover:brightness-125"
                >
                  <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">Close Table</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={payBill}
                    disabled={isPaid}
                    className="flex min-w-px flex-1 items-center justify-center rounded-xl border border-[#e8bc6b] p-4 transition hover:brightness-110 disabled:opacity-40"
                    style={fill(GRAD_PAY)}
                  >
                    <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">Pay Bill</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-[102px] items-center justify-center gap-1.5 rounded-xl border border-[#6e5e41] bg-[#1b1b1b] px-3 py-4"
                  >
                    <Image src={`${ASSET}/printer.svg`} alt="" width={14} height={14} className="size-[14px]" />
                    <span className="text-sm leading-none font-bold whitespace-nowrap text-[#fff8eb]">Receipt</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={noItems}
                className="flex w-[160px] items-center justify-center rounded-xl border border-[#6e5e41] bg-[#1b1b1b] px-3 py-4 transition hover:brightness-125 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#3a3a3a] disabled:hover:brightness-100"
              >
                <span className={cn("text-sm leading-none font-semibold whitespace-nowrap", noItems ? "text-[#939393]" : "text-[#cdcdcd]")}>
                  Reduce Item / Void
                </span>
              </button>
              <button
                onClick={openPos}
                className="flex w-[120px] items-center justify-center gap-1.5 rounded-xl border border-[#6e5e41] bg-[#1b1b1b] px-3 py-4 transition hover:brightness-125"
              >
                <Image src={`${ASSET}/plus.svg`} alt="" width={14} height={14} className="size-[14px]" />
                <span className="text-sm leading-none font-bold whitespace-nowrap text-[#fff8eb]">
                  Add Order{pendingCount > 0 ? ` (${pendingCount})` : ""}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {addingGuest ? (
        <OpenTableFlow table={table} mode="add-guest" onClose={() => setAddingGuest(false)} onConfirm={() => setAddingGuest(false)} />
      ) : null}
      {summaryOpen ? (
        <PaymentSummarySheet
          table={table}
          statusLabel={statusLabel}
          statusTone={statusTone}
          orderCount={new Set(orders.filter((o) => o.tableId === tableId && o.status !== "rejected").map((o) => o.id)).size}
          dishCount={orderLines.reduce((n, l) => n + l.qty, 0)}
          seated={formatSeated(table.seatedMinutes ?? 0)}
          itemsTotal={totalBill}
          onClose={() => setSummaryOpen(false)}
        />
      ) : null}
      {payStep === "method" ? (
        <CollectPaymentSheet total={totalBill} onClose={() => setPayStep(null)} onCash={() => setPayStep("cash")} />
      ) : null}
      {payStep === "cash" ? (
        <CashPaymentSheet
          total={totalBill}
          amount={cashAmount}
          onKey={(k) => setCashAmount((a) => pressKey(a, k))}
          onClose={() => setPayStep(null)}
          onConfirm={confirmCash}
        />
      ) : null}
      {payStep === "confirmed" ? (
        <PaymentConfirmedSheet total={totalBill} tendered={Number(cashAmount) || totalBill} onClose={close} />
      ) : null}
      {confirmingClose ? (
        <ConfirmCloseSheet table={table} onDismiss={() => setConfirmingClose(false)} onConfirm={closeTable} />
      ) : null}
    </div>
  );
}
