"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CHANGELOG } from "@/changelog/entries";
import { GLOBAL_CONFIG } from "@/config/global";
import { PHASES, getPhase, type PaymentMode, type QrType } from "@/config/phases";
import { useSim } from "@/engine/store";
import { cn } from "@/lib/cn";
import { useThemeConfig } from "@/theme/hooks";
import { useThemeChoice, type ScheduleClock } from "@/theme/store";
import { GLASS, GLASS_PANEL } from "../glass";
import { Popover, PopoverLayout } from "../header/Popover";
import { dirtyKeys, useMenuStore } from "@/menu/store";

type Choice<T extends string> = { id: T; label: string; description?: string; chip?: ReactNode };

const QR_TYPES: Choice<QrType>[] = [
  { id: "static", label: "Static", description: "Printed code on the table. Every scan lands on the same table." },
  { id: "dynamic", label: "Dynamic", description: "Code generated per seating. Same screens, a slightly different flow." },
];

const PAYMENT_MODES: Choice<PaymentMode>[] = [
  { id: "same-device", label: "Same device", description: "The bill is paid on the waiter's tablet." },
  { id: "terminal", label: "Terminal", description: "An Adyen payment terminal takes the customer phone's place." },
];

const SCHEDULE_CLOCKS: Choice<ScheduleClock>[] = [
  { id: "live", label: "Live clock", description: "Scheduled dishes grey out only inside their window." },
  { id: "unavailable", label: "Force unavailable", description: "Every scheduled dish shows blocked, whatever the time." },
  { id: "available", label: "Ignore schedules", description: "Scheduled dishes order like any other." },
];

/**
 * One setting. Two choices sit side by side as a segmented control (the sidebar has the
 * room, and both stay visible); more than two fold into an inline dropdown; a single one
 * is just shown.
 */
function ChoiceField<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: Choice<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  const current = choices.find((c) => c.id === value) ?? choices[0];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[13px] font-medium text-neutral-100">{label}</span>
        {current.chip}
      </div>
      {choices.length === 1 ? (
        <div className="flex h-10 items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-[13px] text-neutral-300">
          {current.label}
        </div>
      ) : choices.length === 2 ? (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
          {choices.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.id === value}
              onClick={() => onChange(c.id)}
              className={cn(
                "h-8 truncate rounded-lg px-2 text-[13px] font-medium transition",
                c.id === value
                  ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.3)]"
                  : "text-neutral-400 hover:text-neutral-100",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : (
        <Popover label={current.label} width={260}>
          {(close) => (
            <ul className="flex flex-col gap-1">
              {choices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      close();
                    }}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition",
                      c.id === value ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-neutral-100">
                      {c.label}
                      {c.chip}
                    </span>
                    {c.description ? <span className="text-[11px] leading-snug text-neutral-400">{c.description}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>
      )}
      {current.description ? <p className="px-0.5 text-[11px] leading-snug text-neutral-400">{current.description}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="px-0.5 text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">{title}</h3>
      {children}
    </section>
  );
}

const Icon = ({ d, className }: { d: string; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-[18px] shrink-0", className)}
    aria-hidden
  >
    <path d={d} />
  </svg>
);

/** Panel with its left column: "open the controls panel". */
const PANEL = "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 3v18";
const CLOSE = "M6 6l12 12M18 6L6 18";
const STUDIO = "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4";
const LAYERS = "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5";
const HISTORY = "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2";
const ARROW = "M7 17L17 7M8 7h9v9";

const navRow =
  "group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-neutral-200 transition hover:bg-white/[0.08] hover:text-white";

/**
 * Floating action button + slide-in sidebar: the simulation settings on top, the tools
 * (Menu Studio, Design System, Changelog) pinned at the bottom. Stays mounted while
 * closed so the Menu Studio and open dropdowns keep their state.
 */
export function ControlSidebar({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  // hiding the chrome (F) also folds the panel away
  const [wasHidden, setWasHidden] = useState(hidden);
  if (hidden !== wasHidden) {
    setWasHidden(hidden);
    if (hidden) setOpen(false);
  }

  const phaseId = useSim((s) => s.phase);
  const setPhase = useSim((s) => s.setPhase);
  const qrType = useSim((s) => s.qrType);
  const setQrType = useSim((s) => s.setQrType);
  const paymentMode = useSim((s) => s.paymentMode);
  const setPaymentMode = useSim((s) => s.setPaymentMode);
  const theme = useThemeConfig();
  const setTheme = useThemeChoice((s) => s.setTheme);
  const clock = useThemeChoice((s) => s.scheduleClock);
  const setClock = useThemeChoice((s) => s.setScheduleClock);

  const phase = getPhase(phaseId);
  const unsaved = useMenuStore((s) => dirtyKeys(s).length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open controls"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-[60] flex size-11 items-center justify-center rounded-full text-neutral-100 transition duration-300 hover:scale-105 active:scale-95",
          GLASS,
          (open || hidden) && "pointer-events-none scale-90 opacity-0",
        )}
      >
        <Icon d={PANEL} className="size-5" />
      </button>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[55] bg-black/25 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Simulation controls"
        inert={!open}
        className={cn(
          "fixed inset-y-3 left-3 z-[58] flex w-[312px] flex-col overflow-hidden rounded-[22px] text-neutral-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          GLASS_PANEL,
          open ? "translate-x-0" : "-translate-x-[calc(100%+24px)]",
        )}
      >
        <header className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-4">
          <div className="flex min-w-px flex-1 flex-col">
            <h1 className="text-[15px] leading-tight font-semibold">{GLOBAL_CONFIG.appName}</h1>
            <p className="text-[11px] text-neutral-400">Prototype controls</p>
          </div>
          <button
            type="button"
            aria-label="Close controls"
            onClick={() => setOpen(false)}
            className="-mr-1.5 flex size-9 items-center justify-center rounded-full text-neutral-300 transition hover:bg-white/[0.1] hover:text-white"
          >
            <Icon d={CLOSE} />
          </button>
        </header>

        <PopoverLayout value="inline">
          <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 pt-1 pb-6">
            <Section title="Simulation">
              <ChoiceField
                label="Phase"
                value={phaseId}
                onChange={setPhase}
                choices={PHASES.map((p) => ({
                  id: p.id,
                  label: p.label,
                  chip: <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1", p.tone)}>{p.chip}</span>,
                }))}
              />
              <ChoiceField
                label="Theme"
                value={theme.id}
                onChange={(id) => setTheme(phaseId, id)}
                choices={phase.themes.map((t) => ({ id: t.id, label: t.label, description: t.description }))}
              />
            </Section>

            <Section title="Flow">
              <ChoiceField label="QR type" value={qrType} onChange={setQrType} choices={QR_TYPES} />
              <ChoiceField label="Payment" value={paymentMode} onChange={setPaymentMode} choices={PAYMENT_MODES} />
              <ChoiceField label="Item schedules" value={clock} onChange={setClock} choices={SCHEDULE_CLOCKS} />
            </Section>
          </div>
        </PopoverLayout>

        <p className="flex shrink-0 items-center gap-2 border-t border-white/[0.08] px-5 py-3 text-[11px] text-neutral-400">
          <kbd className="rounded-md border border-white/15 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-neutral-200">F</kbd>
          Hide the controls for recording; press again to bring them back
        </p>

        <nav aria-label="Tools" className="shrink-0 border-t border-white/[0.08] p-2.5">
          <p className="px-3 pt-1.5 pb-2 text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Tools</p>
          <Link href="/menu-studio" className={navRow}>
            <Icon d={STUDIO} className="text-neutral-400 group-hover:text-neutral-200" />
            <span className="mr-auto">Menu Studio</span>
            {unsaved ? (
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">{unsaved} unsaved</span>
            ) : null}
          </Link>
          <Link href="/design-system" className={navRow}>
            <Icon d={LAYERS} className="text-neutral-400 group-hover:text-neutral-200" />
            <span className="mr-auto">Design System</span>
            <Icon d={ARROW} className="size-4 text-neutral-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-neutral-200" />
          </Link>
          <Link href="/changelog" className={navRow}>
            <Icon d={HISTORY} className="text-neutral-400 group-hover:text-neutral-200" />
            <span className="mr-auto">Changelog</span>
            <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
              {CHANGELOG[0].version}
            </span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
