"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { breakdown } from "@/sim/bill";
import { currency, type Payment, type Table } from "@/sim/types";

const ICON = "/figma/tablet-order-detail";

/** Session ID is the design's own (Figma 2723:12058); payments are the table's live ledger. */
const SESSION_ID = "#ID18236123-837213";

/** Seeded paid tables have no ledger, so they show the design's single card payment. */
const SEEDED_PAYMENT = { id: "SP-74584593-0439", method: "Visa", splitType: "Custom", time: "12:45:50" } as const;

/** Dimmed floor plus a bottom sheet that eases up, shared by both dialogs. */
export function Sheet({
  width,
  height,
  onClose,
  children,
}: {
  width: number;
  height: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={cn(figtree.className, "absolute inset-0 z-40")}>
      <button
        aria-label="Dismiss"
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/70 transition-opacity duration-200", show ? "opacity-100" : "opacity-0")}
      />
      <div
        style={{ width, height }}
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden rounded-t-[34px] bg-[#101213] text-white transition-transform duration-300 ease-out",
          show ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="absolute top-5 left-1/2 h-2 w-[50px] -translate-x-1/2 rounded-full bg-[#222]" />
        {children}
      </div>
    </div>
  );
}

export function CloseIcon({ size, onClick }: { size: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-2xl transition hover:bg-white/5"
    >
      <Image src={`${ICON}/close.svg`} alt="" width={24} height={24} className="size-6" />
    </button>
  );
}

/** Figma 2723:12058: a paid table, its payment and (when it overpaid) what to hand back. */
export function PaidTableSheet({
  table,
  onClose,
  onCloseTable,
}: {
  table: Table;
  onClose: () => void;
  onCloseTable: () => void;
}) {
  const paid = table.paidBill ?? 0;
  const overpaid = table.overpaid ?? 0;
  const guest = table.guestName ?? "Guest";

  const payments: Payment[] = table.payments?.length
    ? table.payments
    : [{ ...SEEDED_PAYMENT, amount: paid, guest }];

  return (
    <Sheet width={460} height={649} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{table.label}</p>
          <span className="rounded-full bg-[#37774d] px-2 py-1.5 text-xs leading-none font-semibold text-[#fff6e4]">
            Paid
          </span>
        </div>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <div className="absolute top-[108px] right-0 bottom-[94px] left-0 overflow-y-auto">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full items-center justify-between px-[30px] py-4 leading-none whitespace-nowrap">
            <p className="text-lg text-[#9d9d9d]">Session ID</p>
            <p className="text-base font-semibold text-[#cdcdcd]">{SESSION_ID}</p>
          </div>
          <div className="h-px w-[400px] bg-[#222]" />
          <div className="flex w-full items-center justify-between px-[30px] py-4 text-lg leading-none whitespace-nowrap">
            <p className="text-[#9d9d9d]">Total Paid Bill</p>
            <p className="text-right font-semibold text-[#8eecae]">
              {currency(paid)}
              {overpaid > 0 ? "+" : ""}
            </p>
          </div>
          {overpaid > 0 ? (
            <div className="flex w-[400px] items-center justify-center rounded-lg bg-[#4a1610] p-2">
              <p className="min-w-px flex-1 text-xs leading-[1.3] text-[#fff8eb]">
                Customer overpaid +SGD {overpaid.toFixed(2)}
              </p>
            </div>
          ) : null}
        </div>

        <p className="px-[30px] pt-6 pb-[14px] text-sm leading-none text-[#9d9d9d]">Paid bill from ({payments.length})</p>
        {payments.map((p) => {
          const rows: [string, string][] = [
            ["Split type", p.splitType],
            ["Payment ID", p.id],
            ["Payment method", p.method],
            ...(p.tendered !== undefined ? ([["Cash received", currency(p.tendered)]] as [string, string][]) : []),
            ["Time", p.time],
          ];
          return (
            <div
              key={p.id}
              className="mx-[30px] mb-4 flex flex-col gap-4 rounded-xl border border-[rgba(55,119,77,0.4)] bg-[rgba(55,119,77,0.2)] p-5 last:mb-6"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#fff8eb] shadow-[2.435px_0px_6.087px_4.87px_rgba(58,58,58,0.15)]">
                    <span className="text-sm leading-none font-bold text-[#74581d]">{p.guest.slice(0, 1).toUpperCase()}</span>
                  </div>
                  <p className="text-base leading-none font-semibold whitespace-nowrap text-[#fff8eb]">{p.guest}</p>
                  <span className="rounded-full bg-[#37774d] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#fff6e4]">
                    {p.splitType === "Full" ? "Full Paid" : "Paid"}
                  </span>
                </div>
                <p className="text-base leading-none font-semibold whitespace-nowrap text-[#fff8eb]">{currency(p.amount)}</p>
              </div>
              <div className="h-px w-full border-t border-dashed border-white/20" />
              <div className="flex w-full flex-col gap-3 text-sm leading-none text-[#cdcdcd]">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex w-full items-center justify-between">
                    <p>{k}</p>
                    <p className="whitespace-nowrap">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 flex h-[94px] w-[460px] items-center justify-center bg-[#0c0c0b]">
        <button
          type="button"
          onClick={onCloseTable}
          className="flex w-[400px] items-center justify-center rounded-xl border border-[rgba(170,44,30,0.3)] bg-[rgba(219,46,26,0.3)] p-4 transition hover:brightness-125"
        >
          <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">Close Table</span>
        </button>
      </div>
    </Sheet>
  );
}

/** Figma 2723:12116 / 2098:2968: confirm closing a table: one that overpaid (change handed back) or one with no orders. */
export function ConfirmCloseSheet({
  table,
  onDismiss,
  onConfirm,
}: {
  table: Table;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  const overpaid = table.overpaid ?? 0;

  return (
    <Sheet width={360} height={440} onClose={onDismiss}>
      <div className="absolute top-[58px] left-5 flex w-[320px] items-center justify-between">
        <p className="text-lg leading-none font-bold whitespace-nowrap text-white">Confirmation</p>
        <CloseIcon size={32} onClick={onDismiss} />
      </div>

      <div className="absolute top-[120px] left-1/2 flex w-[320px] -translate-x-1/2 items-center justify-center rounded-lg bg-[#1b1b1b] px-8 py-4">
        <p className="text-2xl leading-none font-semibold whitespace-nowrap text-[#d5d5d5]">
          {table.label.replace(/^(\D+)(\d)$/, "$1 0$2")}
        </p>
      </div>

      {overpaid > 0 ? (
        <>
          <p className="absolute top-[200px] left-[19px] text-base leading-none font-medium whitespace-nowrap text-white">
            Customer paid more than the bill
          </p>
          <p className="absolute top-[234px] left-5 w-[320px] text-sm leading-[1.2] text-[#6e6e6e]">
            Customer overpaid by <span className="font-bold text-white">SGD {overpaid.toFixed(2)}</span>. Return the
            difference to the customer manually before closing this bill.
          </p>
        </>
      ) : (
        <>
          <p className="absolute top-[200px] left-[19px] text-base leading-none font-medium whitespace-nowrap text-white">
            Are you sure to close this table?
          </p>
          <p className="absolute top-[234px] left-5 w-[320px] text-sm leading-[1.2] text-[#6e6e6e]">
            The previous customer&apos;s session will end and this table will become available right away. Make sure
            there are no orders still in progress.
          </p>
        </>
      )}

      <div className="absolute bottom-5 left-5 flex w-[320px] flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="flex h-[46px] w-full items-center justify-center rounded-xl border border-[rgba(170,44,30,0.3)] bg-[rgba(219,46,26,0.3)] p-4 transition hover:brightness-125"
        >
          <span className="text-sm leading-none font-bold whitespace-nowrap text-[#ffffef]">
            Confirm and Close the Table
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex w-full items-center justify-center rounded-xl bg-[#1b1b1b] px-3 py-4 transition hover:brightness-125"
        >
          <span className="text-sm leading-none font-bold whitespace-nowrap text-[#fff8eb]">Dismiss</span>
        </button>
      </div>
    </Sheet>
  );
}

/** Figma 2025:2138: itemised bill, what is paid and who paid it, opened from the order detail's bill card. */
export function PaymentSummarySheet({
  table,
  statusLabel,
  statusTone,
  orderCount,
  dishCount,
  seated,
  itemsTotal,
  onClose,
}: {
  table: Table;
  statusLabel: string;
  statusTone: string;
  orderCount: number;
  dishCount: number;
  /** Already formatted, e.g. "1h 30m". */
  seated: string;
  itemsTotal: number;
  onClose: () => void;
}) {
  const paid = table.paidBill ?? 0;
  const tips = table.tips ?? 0;
  const balance = table.status === "billed" ? 0 : Math.max(0, itemsTotal - paid);
  // itemsTotal is the grand total: split it back into items, service and GST, which add up to it
  const { items, service, gst } = breakdown(itemsTotal);

  /** Split what is paid between the guests at the table, first guest taking any odd cent. */
  const payers = (() => {
    if (paid <= 0) return [];
    const count = Math.max(1, Math.min(table.guests ?? 1, 4));
    const base = Math.floor((paid * 100) / count) / 100;
    const names = [table.guestName ?? "Guest", ...Array.from({ length: count - 1 }, () => "Guest")];
    return names.map((name, i) => ({
      name,
      amount: i === 0 ? Math.round((paid - base * (count - 1)) * 100) / 100 : base,
    }));
  })();

  const stats: [string, string][] = [
    ["M3 1.5h8v11l-1.33-.8-1.34.8L7 11.7l-1.33.8-1.34-.8L3 12.5v-11zM5 4.5h4M5 7h4", `${orderCount} ${orderCount === 1 ? "order ticket" : "orders ticket"}`],
    ["M2 7h10a5 5 0 0 1-10 0zM4.5 2.5c0 1 1 1 1 2M8 2c0 1 1 1 1 2", `${dishCount} ${dishCount === 1 ? "dish" : "dishes"}`],
    ["M7 1.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5zM7 4v3l2 1.25", seated],
  ];
  const rows: [string, string][] = [
    ["Items total", currency(items)],
    ["Service charge 5%", `+${currency(service)}`],
    ["GST 9%", `+${currency(gst)}`],
  ];

  const height = 440 + (tips > 0 ? 54 : 0) + (payers.length ? 190 : 0);

  return (
    <Sheet width={460} height={height} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{table.label}</p>
            <span className={cn("rounded-full px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#fff8eb]", statusTone)}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm leading-none text-[#cdcdcd]">Payment Summary</p>
        </div>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <div className="absolute top-[126px] right-0 bottom-0 left-0 overflow-y-auto pb-6">
        <div className="mx-[30px] flex items-center justify-center gap-4 rounded-lg bg-[#1b1b1a] p-3">
          {stats.map(([icon, label]) => (
            <div key={label} className="flex items-center gap-1">
              <svg viewBox="0 0 14 14" fill="none" stroke="#cdcdcd" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" className="size-[14px]" aria-hidden>
                <path d={icon} />
              </svg>
              <p className="text-sm leading-none whitespace-nowrap text-white">{label}</p>
            </div>
          ))}
        </div>

        <div className="mx-[30px] mt-[26px] flex flex-col gap-4 text-sm leading-none text-[#cdcdcd]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <p>{k}</p>
              <p className="font-semibold">{v}</p>
            </div>
          ))}
        </div>

        <div className="mx-[30px] mt-5 h-px border-t border-dashed border-white/20" />

        <div className="mx-[30px] mt-5 flex flex-col gap-4 text-base leading-none">
          <div className="flex items-center justify-between">
            <p className="text-[#cdcdcd]">Total Bill</p>
            <p className="font-semibold text-[#e4e4e4]">{currency(itemsTotal)}</p>
          </div>
          {paid > 0 ? (
            <div className="flex items-center justify-between text-[#8eecae]">
              <p>Paid Bill</p>
              <p className="font-semibold">-{currency(paid)}</p>
            </div>
          ) : null}
        </div>

        <div className="mx-[30px] mt-5 h-px border-t border-dashed border-white/20" />
        <div className="mx-[30px] flex items-center justify-between py-4 text-xl leading-none text-[#fcdfa2]">
          <p className="font-medium">Balance</p>
          <p className="font-bold">{currency(balance)}</p>
        </div>

        <div className="mx-[30px] mt-2 flex flex-col gap-2">
          {tips > 0 ? (
            <div
              className="flex items-start justify-between rounded-xl border border-[rgba(118,99,64,0.1)] p-4 text-base leading-none text-[#fcdfa2]"
              style={{ backgroundImage: "linear-gradient(145deg, rgb(92, 82, 57) 4%, rgb(38, 36, 31) 19%, rgb(25, 25, 25) 82.6%)" }}
            >
              <p className="font-medium">Total tips ({Math.max(1, payers.length)})</p>
              <p className="font-semibold">{currency(tips)}</p>
            </div>
          ) : null}

          {payers.length ? (
            <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-[rgba(55,119,77,0.4)] bg-[rgba(55,119,77,0.2)] p-5">
              <p className="text-base leading-none font-semibold whitespace-nowrap text-[#fff8eb]">
                Paid bill from ({payers.length})
              </p>
              <div className="-mr-5 flex gap-1.5 overflow-x-auto pr-5">
                {payers.map((p, i) => (
                  <div key={i} className="flex shrink-0 items-center gap-2 rounded-xl bg-[rgba(25,25,25,0.5)] px-4 py-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-[#fff8eb] shadow-[2.435px_0px_6.087px_4.87px_rgba(58,58,58,0.15)]">
                      <span className="text-xs leading-none font-bold text-[#74581d]">{p.name.slice(0, 1).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 leading-none">
                      <p className="text-sm text-[#646667]">{p.name}</p>
                      <p className="text-base font-semibold text-[#fff8eb]">{currency(p.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
