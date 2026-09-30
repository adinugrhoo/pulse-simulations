"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { currency, type Table } from "@/sim/types";
import { useSim } from "@/sim/store";
import type { TabletScreenId } from "@/sim/screens";
import { OrderDetailDialog } from "./OrderDetailDialog";

const formatSeated = (minutes = 0) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const FILTERS = ["All", "Allocate", "Vacant"] as const;
type Filter = (typeof FILTERS)[number];

const matchesFilter = (table: Table, filter: Filter) => {
  if (filter === "All") return true;
  if (filter === "Allocate") {
    return table.status === "allocated" || table.status === "occupied" || table.status === "partial" || table.status === "billed";
  }
  return table.status === "vacant";
};

/** SGD-formatted total/balance row inside a table card — brown for owed, green for settled. */
function BillRow({ label, amount, tone }: { label: string; amount: number; tone: "owed" | "paid" }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between rounded-lg p-2.5 text-sm leading-none",
        tone === "paid" ? "bg-[#37774d] text-[#fff6e4]" : "bg-[#433a31] text-[#fcdfa2]",
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold">{currency(amount)}</span>
    </div>
  );
}

function TableCard({ table, onOpenOrderDetail }: { table: Table; onOpenOrderDetail: () => void }) {
  const dispatch = useSim((s) => s.dispatch);
  const isPaid = table.status === "billed";
  const isPartial = table.status === "partial";
  const isActive = table.status === "occupied" || table.status === "partial" || table.status === "billed";

  /** Blink a few times right after `paidAtTick` changes — i.e. right after a full payment lands. */
  const [blinking, setBlinking] = useState(false);
  const lastPaidTick = useRef(table.paidAtTick);
  useEffect(() => {
    if (table.paidAtTick === undefined || table.paidAtTick === lastPaidTick.current) return;
    lastPaidTick.current = table.paidAtTick;
    setBlinking(true);
    const timer = setTimeout(() => setBlinking(false), 1900);
    return () => clearTimeout(timer);
  }, [table.paidAtTick]);

  /** Any seated table opens the order-detail dialog; `waiter/select-table` keeps the
   *  tablet on `tables` (see triggers.ts) so the dialog renders over the floor plan. */
  const onClick = () => {
    if (!isActive) return;
    dispatch({ type: "waiter/select-table", tableId: table.id });
    onOpenOrderDetail();
  };

  if (!isActive) {
    return (
      <button
        onClick={onClick}
        className="flex h-[200px] w-[232px] flex-col items-center justify-center rounded-[20px] border-2 border-[#3a3a3a] p-3.5 transition hover:border-[#57574f]"
      >
        <p className="w-full text-center text-2xl leading-none font-bold text-[#fff8eb]">
          {table.label}
        </p>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-[200px] w-[232px] flex-col items-start rounded-[20px] border-2 border-[#fff8eb] p-4 text-left transition hover:brightness-110",
        isPaid ? "bg-[#275336]" : "bg-[#1b1b1b]",
        blinking && "animate-table-paid-blink",
      )}
    >
      <div className="flex h-full w-full flex-1 flex-col items-start justify-between">
        <div className="flex w-full flex-col items-start gap-3">
          <p className="w-full text-sm leading-none font-semibold text-[#fff6e4]">{table.label}</p>
          <div className="flex w-[133px] flex-col items-start gap-1">
            <p className="w-full text-2xl leading-none font-bold text-[#fff8eb]">
              {table.guestName ?? "Guest"}
            </p>
            <div className="flex items-start gap-1">
              <div className="flex items-center gap-1.5 p-0.5">
                <Image src="/figma/tablet-tables/person.svg" alt="" width={14} height={14} />
                <span className="text-sm leading-none text-[#fff8eb]">{table.guests ?? 1}</span>
              </div>
              <div className="flex items-center gap-1.5 p-0.5">
                <Image
                  src={`/figma/tablet-tables/clock-${isPaid ? "green" : "dark"}.svg`}
                  alt=""
                  width={14}
                  height={14}
                />
                <span className="text-sm leading-none text-[#fff8eb]">
                  {formatSeated(table.seatedMinutes)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isPartial ? (
          <div className="flex w-full flex-col items-start gap-1">
            <BillRow label="Balance" amount={table.balance ?? 0} tone="owed" />
            <BillRow label="Paid Bill" amount={table.paidBill ?? 0} tone="paid" />
          </div>
        ) : (
          <BillRow
            label={isPaid ? "Paid Bill" : "Total Bill"}
            amount={(isPaid ? table.paidBill : table.totalBill) ?? 0}
            tone={isPaid ? "paid" : "owed"}
          />
        )}
      </div>
    </button>
  );
}

const TABS: { id: TabletScreenId; label: string; icon: string }[] = [
  { id: "tables", label: "Table", icon: "nav-table" },
  { id: "orders", label: "Order", icon: "nav-order" },
  { id: "settings", label: "Settings", icon: "nav-settings" },
];

/** Figma: Pulse, node 1802:11665 ("Frame" — the table floor grid). */
export function TablesScreen() {
  const tables = useSim((s) => s.tables);
  const screen = useSim((s) => s.screens.tablet);
  const setScreen = useSim((s) => s.setScreen);
  const [filter, setFilter] = useState<Filter>("All");
  const [openTableId, setOpenTableId] = useState<string | null>(null);

  const visible = useMemo(() => tables.filter((t) => matchesFilter(t, filter)), [tables, filter]);

  return (
    <div
      className={cn(figtree.className, "relative size-full text-white")}
      style={{ backgroundImage: "linear-gradient(122deg, #2d2d2d 0%, #07090a 100%)" }}
    >
      {/* segmented filter */}
      <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 p-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-3 text-sm leading-none font-medium transition",
              filter === f ? "bg-[#fff8eb] font-bold text-[#2c2c2c]" : "text-[#cdcdcd] hover:text-white",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* search / history */}
      <div className="absolute top-6 left-[1144px] flex items-center gap-2">
        <button className="flex size-[54px] items-center justify-center rounded-full bg-white/10">
          <Image src="/figma/tablet-tables/search.svg" alt="Search" width={20} height={20} />
        </button>
        <button className="flex size-[54px] items-center justify-center rounded-full bg-white/10">
          <Image src="/figma/tablet-tables/history.svg" alt="History" width={20} height={20} />
        </button>
      </div>

      {/* table grid */}
      <div className="absolute top-[102px] left-5 grid w-[1240px] grid-cols-5 gap-5">
        {visible.map((table) => (
          <TableCard key={table.id} table={table} onOpenOrderDetail={() => setOpenTableId(table.id)} />
        ))}
      </div>

      {/* bottom tab bar */}
      <div className="absolute bottom-0 left-1/2 flex w-[1280px] -translate-x-1/2 items-center justify-center bg-[#151515]">
        {TABS.map((tab) => {
          const active = tab.id === screen;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(undefined, tab.id)}
              className="flex h-full w-[140px] flex-col items-center justify-center gap-3 pb-3"
            >
              <div className={cn("h-0.5 w-8 rounded-full", active && "w-16 bg-[#f5dfa8]")} />
              <div className="flex flex-col items-center gap-1">
                <Image src={`/figma/tablet-tables/${tab.icon}.svg`} alt="" width={24} height={24} />
                <span
                  className={cn(
                    "text-sm leading-none",
                    active ? "font-semibold text-[#f5dfa8]" : "text-[#8f8f8f]",
                  )}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {openTableId ? (
        <OrderDetailDialog tableId={openTableId} onClose={() => setOpenTableId(null)} />
      ) : null}
    </div>
  );
}
