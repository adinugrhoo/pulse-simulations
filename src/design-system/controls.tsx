"use client";

import { cn } from "@/lib/cn";

/** Values a story's controls can hold. */
export type Args = Record<string, string | number | boolean>;

type Option = { value: string; label: string };

type Base = {
  key: string;
  label: string;
  /** State the sim never reaches yet: rendered with a "proposed" tag. */
  proposed?: boolean;
  hint?: string;
  /** Hide the control while it has no effect (e.g. stock count unless stock is low). */
  when?: (args: Args) => boolean;
};

export type Control = Base &
  (
    | { type: "toggle" }
    | { type: "select"; options: Option[] }
    | { type: "segment"; options: Option[] }
    | { type: "number"; min: number; max: number }
  );

export const ProposedTag = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "rounded bg-fuchsia-500/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-fuchsia-300 uppercase ring-1 ring-fuchsia-500/30",
      className,
    )}
  >
    Proposed
  </span>
);

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
        on ? "border-emerald-400/40 bg-emerald-500" : "border-white/10 bg-white/[0.12]",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform",
          on && "translate-x-4",
        )}
      />
    </button>
  );
}

/** Segmented control, as the prototype sidebar's two-choice settings. */
function Segment({ value, options, onChange }: { value: string; options: Option[]; onChange: (v: string) => void }) {
  return (
    <div
      role="radiogroup"
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 truncate rounded-lg px-2 text-[13px] font-medium transition",
            value === o.value
              ? "bg-white/[0.16] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.3)]"
              : "text-neutral-400 hover:text-neutral-100",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const StepIcon = ({ plus }: { plus?: boolean }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="size-3.5" aria-hidden>
    <path d={plus ? "M3 8h10M8 3v10" : "M3 8h10"} />
  </svg>
);

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "flex size-7 items-center justify-center rounded-lg text-neutral-300 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-white/[0.08] bg-black/20 p-0.5">
      <button type="button" aria-label="Decrease" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <StepIcon />
      </button>
      <span className="min-w-7 text-center text-[13px] font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <StepIcon plus />
      </button>
    </div>
  );
}

/**
 * One control, laid out as a setting in the prototype sidebar: label (and hint) on top with
 * a wide widget under it; toggles and steppers sit at the right of the label instead.
 */
export function ControlRow({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: Args[string];
  onChange: (v: Args[string]) => void;
}) {
  const inline = control.type === "toggle" || control.type === "number";
  const label = (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[13px] leading-tight font-medium text-neutral-100">{control.label}</span>
      {control.hint ? <span className="text-[11px] leading-snug text-neutral-400">{control.hint}</span> : null}
    </div>
  );
  if (inline)
    return (
      <div className="flex items-start justify-between gap-4">
        {label}
        {control.type === "toggle" ? (
          <Toggle on={Boolean(value)} onChange={onChange} label={control.label} />
        ) : (
          <Stepper value={Number(value)} min={control.min} max={control.max} onChange={onChange} />
        )}
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      {label}
      {control.type === "segment" ? (
        <Segment value={String(value)} options={control.options} onChange={onChange} />
      ) : (
        <div className="relative">
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full appearance-none truncate rounded-xl border border-white/[0.08] bg-white/[0.06] pr-9 pl-3.5 text-[13px] text-neutral-100 outline-none transition hover:bg-white/[0.1] focus:border-white/25"
          >
            {control.options.map((o) => (
              <option key={o.value} value={o.value} className="bg-neutral-900">
                {o.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-neutral-400"
            aria-hidden
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      )}
    </div>
  );
}

export { Segment };
