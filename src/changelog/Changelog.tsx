"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { getTheme } from "@/config/phases";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { PosTokensOverride } from "@/screens/tablet/pos/items";
import { GLASS } from "@/stage/glass";
import { CHANGELOG, type ChangeKind, type ChangelogEntry, type DesignChange } from "./entries";

const anchor = (version: string) => version.replace(/\./g, "-");

const KIND: Record<ChangeKind, { label: string; tone: string }> = {
  added: { label: "Added", tone: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25" },
  changed: { label: "Changed", tone: "bg-sky-500/10 text-sky-300 ring-sky-500/25" },
  fixed: { label: "Fixed", tone: "bg-amber-500/10 text-amber-300 ring-amber-500/25" },
  removed: { label: "Removed", tone: "bg-rose-500/10 text-rose-300 ring-rose-500/25" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthOf = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

/** The previews are real POS components: pin them to the Pulse (Dark) tokens. */
const PULSE_POS = getTheme("2.0", "dark").tablet.tokens.pos;

function Preview({ label, tone, children }: { label: string; tone: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className={cn("size-1.5 rounded-full", tone)} />
        <span className="text-xs font-semibold text-neutral-300">{label}</span>
      </div>
      <div inert className={cn("flex min-h-[180px] items-center justify-center overflow-x-auto bg-[#111] p-5 text-white", figtree.className)}>
        {children}
      </div>
    </div>
  );
}

function DesignCard({ change }: { change: DesignChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-neutral-100">
            {change.component}
            {!change.before ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25">New</span>
            ) : null}
          </p>
          <p className="text-[13px] text-neutral-400">{change.where}</p>
        </div>
        {change.story ? (
          <Link
            href={`/design-system#${change.story}`}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
          >
            Open in Design System <span aria-hidden>↗</span>
          </Link>
        ) : null}
      </div>
      <div className={cn("grid gap-3", change.before ? "grid-cols-[repeat(auto-fit,minmax(340px,1fr))]" : "grid-cols-1")}>
        {change.before ? (
          <Preview label="Before" tone="bg-rose-400">
            {change.before}
          </Preview>
        ) : null}
        <Preview label={change.before ? "After" : "Now"} tone="bg-emerald-500">
          {change.after}
        </Preview>
      </div>
      <p className="text-sm leading-relaxed text-neutral-400">{change.note}</p>
    </div>
  );
}

function Heading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="group flex scroll-mt-32 items-center gap-2 text-lg font-semibold text-neutral-100">
      <a href={`#${id}`} aria-hidden className="-ml-6 w-4 text-neutral-600 opacity-0 transition group-hover:opacity-100">
        #
      </a>
      {children}
    </h3>
  );
}

const SCOPE_ROWS: { key: keyof ChangelogEntry["scope"]; label: string }[] = [
  { key: "phase", label: "Phase" },
  { key: "theme", label: "Theme" },
  { key: "payment", label: "Payment option" },
  { key: "qr", label: "QR option" },
];

function Entry({ entry }: { entry: ChangelogEntry }) {
  const id = anchor(entry.version);
  const kinds = (Object.keys(KIND) as ChangeKind[]).filter((k) => entry.changes.some((c) => c.kind === k));
  return (
    <article id={id} data-entry={id} className="flex scroll-mt-32 flex-col gap-7 border-b border-white/10 pb-14">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="rounded-md bg-[#fcdfa2] px-2 py-0.5 font-mono text-xs font-semibold text-neutral-950">{entry.version}</span>
          {entry.status === "unreleased" ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/25">Unreleased</span>
          ) : (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25">Released</span>
          )}
          <span className="text-neutral-400">{prettyDate(entry.date)}</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400">
            {entry.source.label} <code className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-xs text-neutral-200">{entry.source.value}</code>
          </span>
        </div>
        <h2 className="group flex items-center gap-2 text-[28px] leading-tight font-semibold tracking-tight text-white">
          <a href={`#${id}`} aria-hidden className="-ml-7 w-5 text-2xl text-neutral-600 opacity-0 transition group-hover:opacity-100">
            #
          </a>
          {entry.title}
        </h2>
        <p className="text-[17px] leading-relaxed text-neutral-300">{entry.summary}</p>
      </header>

      <section className="flex flex-col gap-3">
        <Heading id={`${id}-scope`}>Scope</Heading>
        <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] sm:grid-cols-4">
          {SCOPE_ROWS.map((r, i) => {
            const value = entry.scope[r.key];
            const none = value === "—";
            return (
              <div key={r.key} className={cn("flex flex-col gap-1.5 p-3.5", i > 0 && "border-l border-white/10")}>
                <dt className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">{r.label}</dt>
                <dd className={cn("text-sm leading-snug font-medium", none ? "text-neutral-500" : "text-neutral-100")}>
                  {none ? "No change" : value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <Heading id={`${id}-changes`}>What changed</Heading>
        {kinds.map((k) => (
          <div key={k} className="flex flex-col gap-3">
            <span className={cn("w-fit rounded-md px-2 py-0.5 text-xs font-semibold ring-1", KIND[k].tone)}>{KIND[k].label}</span>
            {/* fixed area column: every badge starts and every description starts on the same line */}
            <ul className="flex flex-col gap-2.5">
              {entry.changes
                .filter((c) => c.kind === k)
                .map((c) => (
                  <li key={c.text} className="grid grid-cols-[76px_1fr] items-start gap-3 text-[15px] leading-relaxed text-neutral-300">
                    <span className="mt-[3px] flex h-[22px] w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-[11px] font-medium text-neutral-400">
                      {c.area}
                    </span>
                    <span>{c.text}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      {entry.design?.length ? (
        <section className="flex flex-col gap-4">
          <Heading id={`${id}-design`}>Design changes</Heading>
          <p className="-mt-2 text-sm text-neutral-400">Live previews of the components, on the Pulse (Dark) theme.</p>
          <div className="flex flex-col gap-5">
            {entry.design.map((d) => (
              <DesignCard key={d.component} change={d} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

/**
 * Docs-style changelog (GitBook-like, dark): versions on a rail at the left that follows
 * the scroll and unfolds the active version's sections, the entries beside it. One entry per PR.
 */
export function Changelog() {
  const entries = CHANGELOG;
  const [active, setActive] = useState(anchor(CHANGELOG[0].version));

  // scrollspy: the entry crossing the upper part of the viewport is the active one
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-entry]")];
    const io = new IntersectionObserver(
      (seen) => {
        const hit = seen.filter((s) => s.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive((hit.target as HTMLElement).dataset.entry!);
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [entries]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActive(id.split("-").slice(0, 3).join("-"));
  };

  const months = [...new Set(entries.map((e) => monthOf(e.date)))];
  const headerRef = useRef<HTMLElement>(null);
  const [headerH, setHeaderH] = useState(96);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <PosTokensOverride value={PULSE_POS}>
      {/* body is overflow:hidden for the stage, so the page scrolls inside its own box */}
      <div className="h-dvh overflow-y-auto bg-neutral-950 text-neutral-100">
        <header ref={headerRef} className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] items-center gap-5 px-6 py-5">
            <Link
              href="/"
              aria-label="Back to the prototype"
              className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-neutral-100 transition hover:scale-105 active:scale-95", GLASS)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-white">Changelog</h1>
              <p className="text-sm text-neutral-400">
                Every PR to the Pulse app, the customer mobile and the payment terminal: the phase, theme, payment and QR option it touches, what changed, and a before and after for any component whose design moved.
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1280px] gap-12 px-6">
          {/* version rail; the active version unfolds its sections */}
          {/* the header's height varies with how the description wraps: follow it */}
          <aside
            className="sticky hidden w-[270px] shrink-0 overflow-y-auto py-8 lg:block"
            style={{ top: headerH, height: `calc(100dvh - ${headerH}px)` }}
          >
            {months.map((m) => (
              <div key={m} className="mb-6">
                <p className="mb-3 text-xs font-semibold tracking-wide text-neutral-400 uppercase">{m}</p>
                <ol className="relative">
                  <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-px bg-white/10" />
                  {entries
                    .filter((e) => monthOf(e.date) === m)
                    .map((e) => {
                      const id = anchor(e.version);
                      const on = id === active;
                      return (
                        <li key={e.version}>
                          <button type="button" onClick={() => go(id)} className="group relative flex w-full gap-3 rounded-lg py-2 pr-2 text-left">
                            <span
                              className={cn(
                                "relative z-10 mt-[5px] size-[11px] shrink-0 rounded-full ring-4 ring-neutral-950 transition",
                                e.status === "unreleased"
                                  ? "border-2 border-[#e8bc6b] bg-neutral-950"
                                  : on
                                    ? "bg-[#e8bc6b]"
                                    : "bg-neutral-600 group-hover:bg-neutral-400",
                              )}
                            />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className={cn("flex items-center gap-2 font-mono text-[13px] font-semibold", on ? "text-[#fcdfa2]" : "text-neutral-200")}>
                                {e.version}
                                <span className="font-sans text-[11px] font-normal text-neutral-500">{prettyDate(e.date)}</span>
                              </span>
                              <span className={cn("truncate text-[13px]", on ? "text-neutral-100" : "text-neutral-500 group-hover:text-neutral-300")}>
                                {e.title}
                              </span>
                            </span>
                          </button>
                          {on ? (
                            <ul className="mb-1 ml-[23px] border-l border-white/10">
                              {[
                                { id: `${id}-scope`, label: "Scope" },
                                { id: `${id}-changes`, label: "What changed" },
                                ...(e.design?.length ? [{ id: `${id}-design`, label: "Design changes" }] : []),
                              ].map((sec) => (
                                <li key={sec.id}>
                                  <button
                                    type="button"
                                    onClick={() => go(sec.id)}
                                    className="block w-full py-1 pl-3 text-left text-[13px] text-neutral-500 transition hover:text-neutral-200"
                                  >
                                    {sec.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })}
                </ol>
              </div>
            ))}
          </aside>

          {/* entries */}
          <main className="min-w-0 flex-1 py-10">
            <div className="mx-auto flex max-w-[860px] flex-col gap-14">
              {entries.map((e) => (
                <Entry key={e.version} entry={e} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </PosTokensOverride>
  );
}
