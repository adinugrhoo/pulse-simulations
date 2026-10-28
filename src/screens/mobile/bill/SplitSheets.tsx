"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { SplitPlan } from "@/engine/types";

const fmt = (n: number) => n.toFixed(2);
const cents = (n: number) => Math.round(n * 100) / 100;

/** Theme primary (see the theme's mobile/tokens.ts). */
const PRIMARY = "var(--mobile-primary)";

/** Bottom sheet over the bill: dimmed backdrop, handle, slides up. Figma 2099:10695 / 2099:10888. */
function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        aria-label="Dismiss"
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/55 transition-opacity duration-200", show ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "relative flex max-h-full flex-col rounded-t-3xl bg-white transition-transform duration-300 ease-out",
          show ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#d0d1db]" />
        {children}
      </div>
    </div>
  );
}

/** Pie wedges in the app's maroon. */
export function PieIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="17" style={{ fill: PRIMARY }} opacity="0.55" />
      <path d="M20 20V3a17 17 0 0 1 14.7 8.5z" style={{ fill: PRIMARY }} />
      <path d="M20 20l14.7-8.5A17 17 0 0 1 20 37z" style={{ fill: PRIMARY }} opacity="0.8" />
      <path d="M20 20V3M20 20l14.7-8.5M20 20L5.3 28.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/** Receipt with a pencil in the app's maroon. */
export function CustomIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M7 6h24v28l-3-2-3 2-3-2-3 2-3-2-3 2-3-2-3 2z" style={{ fill: PRIMARY }} opacity="0.25" />
      <path d="M12 14h14M12 20h10M12 26h8" style={{ stroke: PRIMARY }} strokeWidth="2" strokeLinecap="round" />
      <path d="M26 30l1-5 9-9 4 4-9 9z" style={{ fill: PRIMARY }} />
    </svg>
  );
}

/** Figma 2099:10695: how would like to split? */
export function ChooseSplitSheet({
  onPick,
  onClose,
}: {
  onPick: (mode: SplitPlan["mode"]) => void;
  onClose: () => void;
}) {
  const options = [
    { mode: "equal" as const, title: "Equally Split", sub: "Evenly split the bill among everyone", icon: <PieIcon className="size-10" /> },
    { mode: "custom" as const, title: "Custom Split", sub: "Split the bill the way you want", icon: <CustomIcon className="size-10" /> },
  ];
  return (
    <BottomSheet onClose={onClose}>
      <p className="px-4 py-4 text-lg leading-6 font-bold text-[#24242e]">How would like to split?</p>
      <div className="flex flex-col gap-3 px-4 pt-1 pb-6">
        {options.map((o) => (
          <button
            key={o.mode}
            onClick={() => onPick(o.mode)}
            className="flex items-center gap-4 rounded-xl bg-[#f4f4f6] px-4 py-5 text-left transition active:scale-[0.98]"
          >
            {o.icon}
            <span className="h-10 w-px bg-[#d9dae3]" />
            <span className="flex min-w-px flex-1 flex-col gap-1">
              <span className="text-base leading-6 font-bold text-[#24242e]">{o.title}</span>
              <span className="text-xs leading-4 text-[#7b7d8d]">{o.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const box = "flex size-[52px] shrink-0 items-center justify-center rounded-xl border border-[#e4e4eb] bg-white transition active:scale-95 disabled:opacity-40";
  return (
    <div className="flex items-center gap-3">
      <button aria-label={`Decrease ${label}`} className={box} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <span className="h-0.5 w-4 rounded-full" style={{ background: value <= min ? "#c3c4cf" : PRIMARY }} />
      </button>
      <div className="flex h-[52px] min-w-px flex-1 items-center justify-center rounded-xl bg-[#e8e8ee] text-lg font-bold text-[#24242e] tabular-nums">
        {value}
      </div>
      <button aria-label={`Increase ${label}`} className={box} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <span className="relative size-4">
          <span className="absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-full" style={{ background: PRIMARY }} />
          <span className="absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-full" style={{ background: PRIMARY }} />
        </span>
      </button>
    </div>
  );
}

/** Figma 2099:10888: split the bill equally between people, or by a custom amount. */
export function SplitBillSheet({
  grand,
  initial,
  onConfirm,
  onClose,
}: {
  grand: number;
  initial?: SplitPlan["mode"];
  onConfirm: (plan: SplitPlan) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<SplitPlan["mode"]>(initial ?? "equal");
  const [people, setPeople] = useState(2);
  const [many, setMany] = useState(false);
  const [payingFor, setPayingFor] = useState(2);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const each = cents(grand / people);
  const count = many ? Math.min(payingFor, people - 1) : 1;
  const customAmount = Math.min(grand, Math.max(0, Number(amount) || 0));
  const share = mode === "equal" ? cents(Math.min(grand, each * count)) : cents(customAmount);
  const ready = name.trim().length > 0 && share > 0;

  const setPeopleCount = (n: number) => {
    setPeople(n);
    setPayingFor((p) => Math.min(p, Math.max(1, n - 1)));
  };

  const tab = (id: SplitPlan["mode"], label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setMode(id)}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm leading-5 transition",
        mode === id ? "border-b-[3px] bg-white font-semibold text-[#24242e]" : "bg-[#eeeef2] text-[#4a4857]",
      )}
      style={mode === id ? { borderBottomColor: PRIMARY } : undefined}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <BottomSheet onClose={onClose}>
      <p className="px-4 py-4 text-lg leading-6 font-bold text-[#24242e]">Split Bill</p>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto bg-white">
        <div className="flex gap-3 px-4">
          {tab("equal", "Equally Split", <PieIcon className="size-5" />)}
          {tab("custom", "Custom Split", <CustomIcon className="size-5" />)}
        </div>

        <div className="mx-4 flex flex-col items-center gap-4 rounded-2xl bg-[#f4f4f6] p-4">
          {mode === "equal" ? (
            <>
              <p className="text-sm leading-5 font-bold text-[#24242e]">Number of people on table</p>
              <div className="w-full">
                <Stepper value={people} min={2} max={20} onChange={setPeopleCount} label="people" />
              </div>
              <p className="text-sm leading-5 text-[#7b7d8d]">
                Each person paying: <span className="font-bold">SGD {fmt(each)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-5 font-bold text-[#24242e]">Amount you want to pay</p>
              <label className="flex h-[52px] w-full items-center gap-2 rounded-xl border border-[#e4e4eb] bg-white px-3">
                <span className="text-sm text-[#7b7d8d]">SGD</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder={`0.00 - ${fmt(grand)}`}
                  className="min-w-px flex-1 bg-transparent text-base text-[#24242e] outline-none placeholder:text-[#9a9cab]"
                />
              </label>
              <p className="text-sm leading-5 text-[#7b7d8d]">
                Left for others: <span className="font-bold">SGD {fmt(cents(grand - share))}</span>
              </p>
            </>
          )}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Your Name*"
            className="h-[52px] w-full rounded-xl border border-[#e4e4eb] bg-white px-3 text-base text-[#24242e] outline-none placeholder:text-[#7b7d8d]"
          />

          {mode === "equal" ? (
            <>
              <div className="flex w-full items-center gap-2">
                <span className="h-px flex-1 border-t border-dotted border-[#c3c4cf]" />
                <button
                  onClick={() => setMany((m) => !m)}
                  aria-pressed={many}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs leading-5 text-[#24242e] transition",
                    many ? "bg-[#ead9e4]" : "bg-[#e8e8ee]",
                  )}
                >
                  <svg viewBox="0 0 16 16" className="size-4" style={{ fill: PRIMARY }} aria-hidden>
                    <circle cx="5.5" cy="5" r="2.2" />
                    <circle cx="11" cy="5.6" r="1.8" opacity="0.7" />
                    <path d="M1.5 13c0-2.4 1.8-4 4-4s4 1.6 4 4zM10 13c0-1.3-.4-2.3-1-3 .6-.4 1.2-.6 2-.6 1.9 0 3.5 1.3 3.5 3.6z" />
                  </svg>
                  I&apos;m paying for multiple people
                </button>
                <span className="h-px flex-1 border-t border-dotted border-[#c3c4cf]" />
              </div>
              {many ? (
                <div className="flex w-full flex-col gap-2">
                  <p className="text-center text-xs leading-4 text-[#7b7d8d]">People you are paying for</p>
                  <Stepper value={count} min={1} max={Math.max(1, people - 1)} onChange={setPayingFor} label="people paid for" />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <p className="text-center text-sm leading-5 text-[#24242e]">
          You&apos;re paying <span className="text-[#7b7d8d]">SGD</span> <span className="font-bold">{fmt(share)}</span>
          <span className="text-[#7b7d8d]">/{fmt(grand)}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 px-4 pt-4 pb-6">
        <button
          disabled={!ready}
          onClick={() =>
            onConfirm({
              mode,
              people: mode === "equal" ? people : 1,
              payingFor: mode === "equal" ? count : 1,
              name: name.trim(),
              share,
            })
          }
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-xl text-[15px] leading-6 font-bold text-white transition",
            ready ? "bg-(--mobile-primary)" : "bg-(--mobile-primary) opacity-40",
          )}
        >
          Confirm
        </button>
        <button
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="flex items-center gap-2 text-sm leading-5 font-semibold text-[#24242e] underline decoration-dotted underline-offset-4"
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" style={{ stroke: PRIMARY }} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 4H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3M11 3h6v6M17 3l-8 8" />
          </svg>
          {copied ? "Link copied" : "Share Payment Link"}
        </button>
      </div>
    </BottomSheet>
  );
}
