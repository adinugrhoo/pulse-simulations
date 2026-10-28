"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { cancelSmoothScroll, smoothScrollTo } from "@/lib/smoothScroll";
import { SECTIONS } from "@/config/global";
import { useSim } from "@/engine/store";
import { currency, type Table } from "@/engine/types";
import { TabletTabBar } from "../shared/TabletTabBar";
import { OrderDetailDialogV2 } from "../order-detail/OrderDetailDialogV2";
import { OpenTableFlow } from "../sheets/OpenTableSheets";
import { ConfirmCloseSheet, PaidTableSheet } from "../sheets/PaidTableSheets";
import { SectionLegend, SectionsSidebar, type SectionCounts } from "./SectionsSidebar";
import { formatSeated } from "./TablesScreen";

const ASSET = "/figma/tablet-sections";

const OCCUPANCY = ["All", "Vacant", "Allocate"] as const;
const PAYMENT = ["All", "Paid", "Unpaid"] as const;
type Occupancy = (typeof OCCUPANCY)[number];
type Payment = (typeof PAYMENT)[number];

/** Gap between the scroll container's top edge and a section header (Figma: header at y=116, container at 102). */
const SCROLL_PAD = 14;

const isAllocated = (t: Table) => t.status !== "vacant";

const matches = (t: Table, occupancy: Occupancy, payment: Payment) => {
  if (occupancy === "Allocate" && !isAllocated(t)) return false;
  if (occupancy === "Vacant" && t.status !== "vacant") return false;
  if (payment === "Paid") return t.status === "billed";
  if (payment === "Unpaid") return t.status === "occupied" || t.status === "partial";
  return true;
};

/** Stable fake session reference, e.g. "**39238", so a table keeps the same one between renders. */
const sessionId = (t: Table) => {
  let h = 7;
  for (const ch of t.id) h = (h * 31 + ch.charCodeAt(0)) % 100000;
  return `**${String(h).padStart(5, "0")}`;
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "flex h-[38px] items-center justify-center rounded-full p-3 text-sm leading-none transition",
            o === "All" && "w-[76px]",
            value === o ? "bg-[#fff8eb] font-bold text-[#2c2c2c]" : "font-medium text-[#cdcdcd] hover:text-white",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function BillBar({ label, amount, className }: { label: string; amount: number; className: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between rounded-lg p-2.5 text-sm leading-none text-white",
        className,
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold">{currency(amount)}</span>
    </div>
  );
}

/** Figma 2893:12827 table card: navy for seated, green once paid, outlined when vacant. */
function TableCard({
  table,
  onOpenPaid,
  onOpenTable,
}: {
  table: Table;
  onOpenPaid: (tableId: string) => void;
  onOpenTable: (tableId: string) => void;
}) {
  const dispatch = useSim((s) => s.dispatch);
  const isPaid = table.status === "billed";
  const isOverpaid = isPaid && (table.overpaid ?? 0) > 0;
  const isPartial = table.status === "partial";
  const isSeated = table.status === "occupied" || isPartial || isPaid;

  const open = () => {
    if (isPaid) onOpenPaid(table.id);
    else if (isSeated) dispatch({ type: "waiter/select-table", tableId: table.id });
  };

  if (table.status === "vacant" && table.lastSession) {
    return (
      <button
        onClick={() => onOpenTable(table.id)}
        aria-label={`Open ${table.label}`}
        className="relative flex h-[200px] w-[232px] flex-col items-center justify-center rounded-[20px] border-2 border-[#3a3a3a] p-3.5 transition hover:bg-white/5"
      >
        <div className="absolute top-3.5 left-3.5 flex h-5 w-[200px] items-center justify-between text-sm text-white">
          <span>Session ID</span>
          <span>{sessionId(table)}</span>
        </div>
        <p className="w-full text-center text-2xl leading-none font-bold text-white">{table.label}</p>
        <div className="absolute top-[148px] left-3.5 w-[200px]">
          <BillBar label="Paid Bill" amount={table.lastSession.paidBill} className="bg-[#006e55]" />
        </div>
      </button>
    );
  }

  if (table.status === "allocated") {
    return (
      <div className="relative flex h-[200px] w-[232px] flex-col items-center justify-center rounded-[20px] border-2 border-[#3a3a3a] p-3.5">
        <div className="absolute top-3.5 left-3.5 flex h-5 w-[200px] items-center justify-between text-sm text-white">
          <span>Session ID</span>
          <span>{sessionId(table)}</span>
        </div>
        <p className="w-full text-center text-2xl leading-none font-bold text-white">{table.label}</p>
        <div className="absolute top-[148px] left-3.5 w-[200px]">
          <BillBar label="Paid Bill" amount={table.paidBill ?? 0} className="bg-[#006e55]" />
        </div>
      </div>
    );
  }

  if (!isSeated) {
    return (
      <button
        onClick={() => onOpenTable(table.id)}
        aria-label={`Open ${table.label}`}
        className="flex h-[200px] w-[232px] flex-col items-center justify-center rounded-[20px] border-2 border-[#3a3a3a] p-3.5 transition hover:bg-white/5"
      >
        <p className="w-full text-center text-2xl leading-none font-bold whitespace-nowrap text-white">{table.label}</p>
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className={cn(
        "flex h-[200px] w-[232px] flex-col items-start rounded-[20px] p-4 text-left transition hover:brightness-110",
        isOverpaid ? "bg-[#8d0b22]" : isPaid ? "bg-[#008b6b]" : "bg-[#917b0a]",
        // paid tables must be closed, so they keep pulsing until they are
        isOverpaid ? "animate-table-urgent-red" : isPaid && "animate-table-urgent-green",
      )}
    >
      <div className="flex h-full w-full flex-1 flex-col items-start justify-between">
        <div className="flex w-full flex-col items-start gap-3">
          <p className="flex h-5 w-full items-center text-sm leading-none whitespace-nowrap text-white">
            {table.guestName ?? "Guest"}
          </p>
          <div className="flex w-[133px] flex-col items-start gap-1">
            <p className="w-full text-2xl leading-none font-bold text-white">{table.label}</p>
            <div className="flex items-start gap-1">
              <div className="flex items-center gap-1.5 p-0.5">
                <Image src="/figma/tablet-tables/person.svg" alt="" width={14} height={14} />
                <span className="text-sm leading-none text-white">{table.guests ?? 1}</span>
              </div>
              <div className="flex items-center gap-1.5 p-0.5">
                <Image
                  src={`/figma/tablet-tables/clock-${isPaid ? "green" : "dark"}.svg`}
                  alt=""
                  width={14}
                  height={14}
                />
                <span className="text-sm leading-none text-white">{formatSeated(table.seatedMinutes)}</span>
              </div>
            </div>
          </div>
        </div>

        {isPaid ? (
          <div
            className={cn(
              "flex w-[200px] flex-col items-start gap-2.5 rounded-lg p-2.5",
              isOverpaid
                ? "animate-table-urgent-inner-red bg-[#540815]"
                : "animate-table-urgent-inner-green bg-[#006e55]",
            )}
          >
            <div className="flex w-[180px] items-center justify-between text-sm leading-none text-white">
              <span>Session ID</span>
              <span>{sessionId(table)}</span>
            </div>
            <Image
              src={`/figma/tablet-tables/divider-${isOverpaid ? "red" : "green"}.svg`}
              alt=""
              width={180}
              height={1}
              className="h-px w-full"
            />
            <div className="flex w-[180px] items-center justify-between text-sm leading-none text-white">
              <span className="font-medium">Paid Bill</span>
              <span className="font-bold">
                {currency(table.paidBill ?? 0)}
                {isOverpaid ? "+" : ""}
              </span>
            </div>
          </div>
        ) : isPartial ? (
          <div className="flex w-full flex-col items-start gap-1">
            <BillBar label="Balance" amount={table.balance ?? 0} className="bg-[#605104]" />
            <BillBar label="Paid Bill" amount={table.paidBill ?? 0} className="bg-[#006e55]" />
          </div>
        ) : (
          <BillBar label="Total Bill" amount={table.totalBill ?? 0} className="bg-[#605104]" />
        )}
      </div>
    </button>
  );
}

/**
 * Phase 2.0 floor (Figma 2861:12353): every table grouped into scrolling sections. The pill
 * top-left names the section in view and opens the sections drawer; picking a section there
 * eases the page to it. Occupancy and payment filters narrow the tables, the section legends
 * always show the full vacant / allocate split.
 */
export function TablesScreenV2() {
  const tables = useSim((s) => s.tables);
  const dispatch = useSim((s) => s.dispatch);
  /** Store-driven so the dialog is still open when the waiter comes back from the POS page. */
  const openTableId = useSim((s) => s.waiter.openTableId);

  const [occupancy, setOccupancy] = useState<Occupancy>("All");
  const [payment, setPayment] = useState<Payment>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Overpaid table being closed: its paid-bill sheet, then the confirmation. */
  const [paidSheet, setPaidSheet] = useState<{ id: string; step: "detail" | "confirm" } | null>(null);
  /** Vacant table the waiter is opening: guest form, then straight into its order detail. */
  const [openingId, setOpeningId] = useState<string | null>(null);
  const openingTable = openingId ? tables.find((t) => t.id === openingId) : undefined;
  const sheetTable = paidSheet ? tables.find((t) => t.id === paidSheet.id) : undefined;
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  /** While an eased scroll runs, the scroll-spy stays quiet so the pill does not flicker through every section it passes. */
  const autoScrolling = useRef(false);

  const bySection = useMemo(() => {
    const map = new Map<string, Table[]>();
    tables.forEach((t) => {
      if (!t.section) return;
      map.set(t.section, [...(map.get(t.section) ?? []), t]);
    });
    return map;
  }, [tables]);

  const counts = useMemo<SectionCounts>(() => {
    const out: SectionCounts = {};
    SECTIONS.forEach((s) => {
      const list = bySection.get(s.id) ?? [];
      const vacant = list.filter((t) => t.status === "vacant").length;
      out[s.id] = { vacant, allocate: list.length - vacant };
    });
    return out;
  }, [bySection]);

  const activeSection = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];

  const spy = useCallback(() => {
    const el = scrollRef.current;
    if (!el || autoScrolling.current) return;
    let current = SECTIONS[0].id;
    for (const s of SECTIONS) {
      const node = sectionRefs.current.get(s.id);
      if (node && node.offsetTop - SCROLL_PAD - 24 <= el.scrollTop) current = s.id;
    }
    setActiveId(current);
  }, []);

  const goTo = useCallback((id: string) => {
    const el = scrollRef.current;
    const node = sectionRefs.current.get(id);
    setSidebarOpen(false);
    setActiveId(id);
    if (!el || !node) return;
    autoScrolling.current = true;
    smoothScrollTo(el, node.offsetTop - SCROLL_PAD, () => {
      autoScrolling.current = false;
    });
  }, []);

  /** A wheel / touch from the user takes over from an eased scroll in flight. */
  const interrupt = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !autoScrolling.current) return;
    cancelSmoothScroll(el);
    autoScrolling.current = false;
  }, []);

  return (
    <div
      className={cn(figtree.className, "relative size-full overflow-hidden text-white")}
      style={{ backgroundColor: "#121415" }}
    >
      {/* current section + drawer toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sections"
        className="absolute top-6 left-5 z-10 flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 transition hover:bg-white/15"
      >
        <Image src={`${ASSET}/menu.svg`} alt="" width={20} height={20} className="size-5" />
        <span className="px-1 py-3 text-sm leading-none font-medium whitespace-nowrap text-white">
          {activeSection.name}
        </span>
      </button>

      {/* filters + search / history */}
      <div className="absolute top-6 right-5 z-10 flex items-center gap-3">
        <Segmented options={OCCUPANCY} value={occupancy} onChange={setOccupancy} />
        <Segmented options={PAYMENT} value={payment} onChange={setPayment} />
        <button className="flex size-[54px] items-center justify-center rounded-full bg-white/10">
          <Image src="/figma/tablet-tables/search.svg" alt="Search" width={20} height={20} />
        </button>
        <button className="flex size-[54px] items-center justify-center rounded-full bg-white/10">
          <Image src="/figma/tablet-tables/history.svg" alt="History" width={20} height={20} />
        </button>
      </div>

      {/* sections */}
      <div
        ref={scrollRef}
        onScroll={spy}
        onWheel={interrupt}
        onTouchStart={interrupt}
        className="absolute inset-x-0 top-[102px] bottom-[68px] overflow-x-hidden overflow-y-auto"
        style={{ paddingTop: SCROLL_PAD }}
      >
        {SECTIONS.map((section) => {
          const list = (bySection.get(section.id) ?? []).filter((t) => matches(t, occupancy, payment));
          return (
            <section
              key={section.id}
              ref={(node) => {
                if (node) sectionRefs.current.set(section.id, node);
                else sectionRefs.current.delete(section.id);
              }}
              className="px-5 pb-10"
            >
              <div className="flex items-center gap-5 pb-6">
                <h2 className="text-2xl leading-none font-bold whitespace-nowrap text-[#f5dfa8]">{section.name}</h2>
                <SectionLegend counts={counts[section.id]} />
                <Image
                  src={`${ASSET}/section-line.svg`}
                  alt=""
                  width={905}
                  height={1}
                  className="h-px min-w-0 flex-1 object-fill"
                />
              </div>
              {list.length ? (
                <div className="grid grid-cols-5 gap-5">
                  {list.map((table) => (
                    <TableCard key={table.id} table={table} onOpenPaid={(id) => setPaidSheet({ id, step: "detail" })}
                      onOpenTable={setOpeningId}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#8f8f8f]">No tables match this filter.</p>
              )}
            </section>
          );
        })}
        {/* lets even the last section be eased all the way to the top */}
        <div className="h-[460px]" />
      </div>

      <TabletTabBar />

      <SectionsSidebar
        open={sidebarOpen}
        activeId={activeId}
        counts={counts}
        onSelect={goTo}
        onClose={() => setSidebarOpen(false)}
      />

      {sheetTable && paidSheet?.step === "detail" ? (
        <PaidTableSheet
          table={sheetTable}
          onClose={() => setPaidSheet(null)}
          onCloseTable={() => {
            // a plain paid table closes on the tap; one that overpaid needs the change handed back first
            if ((sheetTable.overpaid ?? 0) > 0) {
              setPaidSheet({ id: sheetTable.id, step: "confirm" });
              return;
            }
            dispatch({ type: "waiter/close-table", tableId: sheetTable.id });
            setPaidSheet(null);
          }}
        />
      ) : null}
      {sheetTable && paidSheet?.step === "confirm" ? (
        <ConfirmCloseSheet
          table={sheetTable}
          onDismiss={() => setPaidSheet({ id: sheetTable.id, step: "detail" })}
          onConfirm={() => {
            dispatch({ type: "waiter/close-table", tableId: sheetTable.id });
            setPaidSheet(null);
          }}
        />
      ) : null}

      {openingTable ? (
        <OpenTableFlow
          table={openingTable}
          lastSession={
            openingTable.lastSession
              ? { ref: sessionId(openingTable), ...openingTable.lastSession }
              : undefined
          }
          onClose={() => setOpeningId(null)}
          onConfirm={(guest) => {
            dispatch({ type: "waiter/open-table", tableId: openingTable.id, ...guest });
            setOpeningId(null);
          }}
        />
      ) : null}

      {openTableId ? (
        <OrderDetailDialogV2 tableId={openTableId} onClose={() => dispatch({ type: "waiter/close-order-detail" })} />
      ) : null}
    </div>
  );
}
