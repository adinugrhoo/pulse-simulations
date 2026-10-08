"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { currency, type Table } from "@/sim/types";
import { CloseIcon, Sheet } from "./PaidTableSheets";

const ASSET = "/figma/tablet-open-table";

type Country = { name: string; flag: string; code: string };

const COUNTRIES: Country[] = [
  { name: "Singapore", flag: "🇸🇬", code: "+65" },
  { name: "Malaysia", flag: "🇲🇾", code: "+60" },
  { name: "Indonesia", flag: "🇮🇩", code: "+62" },
  { name: "Australia", flag: "🇦🇺", code: "+61" },
  { name: "Taiwan", flag: "🇹🇼", code: "+886" },
  { name: "Afghanistan", flag: "🇦🇫", code: "+93" },
  { name: "Algeria", flag: "🇩🇿", code: "+213" },
  { name: "India", flag: "🇮🇳", code: "+91" },
  { name: "Japan", flag: "🇯🇵", code: "+81" },
  { name: "Thailand", flag: "🇹🇭", code: "+66" },
  { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "United States", flag: "🇺🇸", code: "+1" },
];
/** The first five are the waiter's usual countries and sit under "Selected countries". */
const PINNED = 5;

const PAX = [1, 2, 3, 4, 5, 6, 7, 8];

const field = "rounded-xl border border-[#3d3d3d] px-3 py-4 text-sm leading-none";

/** Figma 2563:13719 / 2553:13369: pick a phone country code, searchable by name or code. */
function CountrySheet({
  selected,
  onPick,
  onClose,
}: {
  selected: Country;
  onPick: (c: Country) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const searching = q.length > 0;
  const results = useMemo(
    () => COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.includes(q)),
    [q],
  );
  const pinned = searching ? [] : COUNTRIES.slice(0, PINNED);
  const rest = searching ? results : COUNTRIES.slice(PINNED);

  const row = (c: Country) => {
    const isSelected = c.code === selected.code && c.name === selected.name;
    return (
      <button
        key={c.name}
        type="button"
        onClick={() => onPick(c)}
        className={cn(
          "flex w-full items-center justify-between border-b border-[#3d3d3d] px-[30px] py-[18px] text-left transition",
          isSelected ? "bg-[#433a31]" : "bg-[#101213] hover:bg-white/5",
        )}
      >
        <div className="flex items-center gap-2.5">
          <Image
            src={`${ASSET}/${isSelected ? "check-selected" : "radio-empty"}.svg`}
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
          <span className="text-base leading-none">{c.flag}</span>
          <span className="text-base leading-none text-white">{c.name}</span>
        </div>
        <span className="text-base leading-none text-white">{c.code}</span>
      </button>
    );
  };

  return (
    <Sheet width={460} height={776} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-white">Country Code</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <label className="absolute top-[130px] left-[30px] flex w-[400px] items-center gap-2.5 rounded-xl border border-[#3d3d3d] px-3 py-4">
        <Image src={`${ASSET}/search.svg`} alt="" width={24} height={24} className="size-6 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country name/ country code"
          className="min-w-px flex-1 bg-transparent text-sm leading-none text-white outline-none placeholder:text-[#3d3d3d]"
        />
      </label>

      <div className="absolute top-[210px] right-0 bottom-0 left-0 overflow-y-auto">
        {pinned.length ? (
          <>
            <p className="px-[30px] pb-[16px] text-sm leading-none text-[#9d9d9d]">Selected countries</p>
            {pinned.map(row)}
          </>
        ) : null}
        <p className={cn("px-[30px] pb-[16px] text-sm leading-none text-[#9d9d9d]", pinned.length && "pt-6")}>
          {searching ? "Country searched for" : "All countries"}
        </p>
        <div className="border-t border-[#3d3d3d]">
          {rest.length ? rest.map(row) : <p className="px-[30px] py-4 text-sm text-[#8f8f8f]">No country found.</p>}
        </div>
      </div>
    </Sheet>
  );
}

/**
 * Figma 2066:3724: the waiter opens a vacant table. Pax, then the guest's phone (with country
 * code) and name; Confirm unlocks once all three are filled. Picking the country code swaps
 * in the country sheet (2563:13719).
 */
export function OpenTableFlow({
  table,
  mode = "open",
  lastSession,
  onClose,
  onConfirm,
}: {
  table: Table;
  /** Figma 2025:2022: a table that just closed shows who paid there last above the pax picker. */
  lastSession?: { ref: string; paidBill: number; minutesAgo: number };
  /** "add-guest" drops the pax picker and retitles the sheet; the guest still needs phone and name. */
  mode?: "open" | "add-guest";
  onClose: () => void;
  onConfirm: (guest: { guests: number; guestName: string; phone: string }) => void;
}) {
  const adding = mode === "add-guest";
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [pickingCountry, setPickingCountry] = useState(false);
  const [pax, setPax] = useState<number | null>(null);
  const [custom, setCustom] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const digits = phone.replace(/\D/g, "");
  const ready = (adding || (pax !== null && pax > 0)) && digits.length >= 7 && name.trim().length > 0;

  if (pickingCountry) {
    return (
      <CountrySheet
        selected={country}
        onPick={(c) => {
          setCountry(c);
          setPickingCountry(false);
        }}
        onClose={() => setPickingCountry(false)}
      />
    );
  }

  const confirm = () => {
    if (!ready || (!adding && pax === null)) return;
    onConfirm({ guests: adding ? 0 : (pax ?? 0), guestName: name.trim(), phone: `${country.code} ${phone.trim()}` });
  };

  return (
    <Sheet width={460} height={adding ? 476 : lastSession ? 770 : 706} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">{adding ? "Add guest" : table.label}</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      {lastSession && !adding ? (
        <div className="absolute top-[120px] left-[30px] flex w-[400px] items-center gap-2.5">
          <div
            className="flex h-12 min-w-px flex-1 items-center justify-between rounded-xl border border-[#141f18] px-4 text-base leading-none text-[#fff6e4]"
            style={{
              backgroundImage:
                "linear-gradient(142deg, rgb(68, 123, 86) 4%, rgb(38, 53, 43) 19%, rgb(18, 23, 20) 82.6%)",
            }}
          >
            <span className="font-medium whitespace-nowrap">
              {lastSession.ref} • {currency(lastSession.paidBill)}
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              {lastSession.minutesAgo > 0 ? `${lastSession.minutesAgo}min` : "Just now"}
              <Image src="/figma/tablet-order-detail/chevron-updown.svg" alt="" width={14} height={14} className="size-[14px]" />
            </span>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#141f18] bg-[#121714]" aria-label="Previous session history">
            <Image src="/figma/tablet-order-detail/refresh.svg" alt="" width={20} height={20} className="size-5" />
          </div>
        </div>
      ) : null}

      <div className={cn("absolute left-[30px] flex w-[400px] flex-col gap-5", lastSession && !adding ? "top-[188px]" : "top-[130px]")}>
        {adding ? null : (
        <div className="flex flex-col gap-5">
          <p className="text-lg leading-none font-semibold text-[#cdcdcd]">Select pax</p>
          <div className="grid grid-cols-4 gap-2">
            {PAX.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setPax(n);
                  setCustom(false);
                }}
                className={cn(
                  "flex items-center justify-center rounded-xl border px-3 py-3.5 text-sm leading-none transition",
                  pax === n && !custom
                    ? "border-[#f5dfa8] bg-[#433a31] text-[#fff8eb]"
                    : "border-[#3d3d3d] text-[#cacaca] hover:bg-white/5",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {custom ? (
            <input
              autoFocus
              type="number"
              min={1}
              value={pax ?? ""}
              onChange={(e) => setPax(e.target.value ? Math.max(0, Number(e.target.value)) : null)}
              placeholder="Number of guests"
              className="w-full rounded-xl border border-[#f5dfa8] bg-[#433a31] px-3 py-3.5 text-center text-sm leading-none text-[#fff8eb] outline-none placeholder:text-[#9d9d9d]"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustom(true);
                setPax(null);
              }}
              className="-mt-3 flex w-full items-center justify-center rounded-xl border border-[#3d3d3d] px-3 py-3.5 text-sm leading-none text-[#cacaca] transition hover:bg-white/5"
            >
              Custom pax
            </button>
          )}
        </div>
        )}

        <div className="flex flex-col gap-5">
          <p className="text-lg leading-none font-semibold text-[#cdcdcd]">Guest info</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              <p className="text-sm leading-none text-[#9ea7b6]">Phone number</p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPickingCountry(true)}
                  className={cn(field, "flex shrink-0 items-center gap-2.5 text-[#cdcdcd] transition hover:bg-white/5")}
                >
                  <span className="whitespace-nowrap">
                    {country.flag} {country.code}
                  </span>
                  <Image src={`${ASSET}/chevron-down.svg`} alt="" width={14} height={14} className="size-[14px]" />
                </button>
                <input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="8080 xxxx"
                  className={cn(field, "min-w-px flex-1 bg-transparent text-[#fff8eb] outline-none placeholder:text-[#474747]")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-sm leading-none text-[#9ea7b6]">Guest Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g Alex albon..."
                className={cn(field, "w-full bg-transparent text-[#fff8eb] outline-none placeholder:text-[#474747]")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 flex h-[94px] w-[460px] items-center justify-center bg-[#0c0c0b]">
        <button
          type="button"
          onClick={confirm}
          disabled={!ready}
          className={cn(
            "flex w-[400px] items-center justify-center rounded-xl border p-4 transition",
            ready ? "border-[#e8bc6b] hover:brightness-110" : "border-[#5a4827]",
          )}
          style={
            ready
              ? { backgroundImage: "linear-gradient(85.8deg, rgb(170, 127, 30) 0%, rgb(144, 105, 14) 52%, rgb(170, 130, 37) 99.8%)" }
              : undefined
          }
        >
          <span className={cn("text-sm leading-none font-bold whitespace-nowrap", ready ? "text-[#ffffef]" : "text-[#666]")}>
            {adding ? "Add guest" : "Confirm and Print QR"}
          </span>
        </button>
      </div>
    </Sheet>
  );
}
