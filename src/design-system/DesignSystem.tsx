"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { getPhase, getTheme } from "@/config/phases";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { layerKey } from "@/menu/layers";
import { resolveMenu } from "@/menu/resolve";
import { composedAt, useMenuStore } from "@/menu/store";
import type { Dish } from "@/menu/types";
import { sendPosHandoff } from "@/screens/tablet/pos/handoff";
import { PosTokensOverride } from "@/screens/tablet/pos/items";
import type { PosTokens } from "@/theme/tokens";
import { GLASS, GLASS_PANEL } from "@/stage/glass";
import { ControlRow, ProposedTag, Segment, type Args } from "./controls";
import { PAGES, PosPagePreview, type PageStory } from "./pages";
import { buildStories, type Story, type UseCase } from "./stories";

/** The design system covers the Phase 2 native ordering POS. */
const PHASE = "2.0";

const surfaceClass = (story: Story, t: PosTokens) =>
  story.surface === "page" ? t.page : story.surface === "bucket" ? cn(t.bucket, t.ink) : "bg-[#111] text-white";

/** Dishes on the POS categories, in order, without repeats. */
const posDishes = (themeId: string): Dish[] => {
  const menu = resolveMenu(composedAt(useMenuStore.getState(), layerKey(PHASE, themeId)));
  const seen = new Set<string>();
  return menu.tablet
    .flatMap((c) => c.dishes)
    .filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
};

function UseCaseCard({
  story,
  useCase,
  args,
  dishes,
  surface,
  active,
  onPick,
}: {
  story: Story;
  useCase: UseCase;
  args: Args;
  dishes: Dish[];
  surface: string;
  active: boolean;
  onPick: () => void;
}) {
  return (
    // a div: the previews are buttons themselves
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onPick();
      }}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition",
        useCase.tall && "col-span-full",
        active ? "border-white/40 ring-1 ring-white/20" : "border-white/10 hover:border-white/25",
      )}
    >
      {/* preview only: clicks load the case into the playground */}
      <div inert
        className={cn(
          // flex-1: in a grid row with taller cards the surface still runs down to the caption
          "pointer-events-none flex flex-1 justify-center p-5",
          useCase.tall ? "min-h-[370px] items-start" : "min-h-[150px] items-center",
          figtree.className,
          surface,
        )}
      >
        {story.render(args, { dishes, set: () => {} })}
      </div>
      <div className="flex shrink-0 flex-col gap-1 border-t border-white/10 bg-neutral-950 px-4 py-3">
        <span className="flex items-center justify-between gap-2 text-sm font-semibold text-neutral-100">
          {useCase.name}
          {useCase.proposed ? <ProposedTag /> : null}
        </span>
        <span className="text-[13px] leading-snug text-neutral-400">{useCase.note}</span>
      </div>
    </div>
  );
}

/** Breadcrumb paths: where a component or page sits in native ordering. */
function Placements({ paths }: { paths: string[][] }) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Placement</h3>
      <ul className="flex flex-col gap-1">
        {paths.map((path) => (
          <li key={path.join(">")} className="flex flex-wrap items-center gap-1.5 text-[13px]">
            {path.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                {i > 0 ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-3 text-neutral-600" aria-hidden>
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                ) : null}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5",
                    i === path.length - 1 ? "bg-[#fcdfa2]/10 font-medium text-[#fcdfa2]" : "text-neutral-300",
                  )}
                >
                  {step}
                </span>
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

const caseAnchor = (name: string) => `case-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** Shrinks a fixed-size page to the canvas width (never past 1:1), so it never scrolls sideways. */
function FitFrame({ size, children }: { size: PageStory["size"]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / size.width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size.width]);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: size.height * scale }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

const headerButton =
  "flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-medium text-neutral-300 transition hover:border-white/25 hover:text-white";

/**
 * A page's use cases stacked, each the live POS page on its own sim, scaled to the canvas.
 * Reset remounts one case; a theme change remounts them all. Open in prototype carries
 * the case into the prototype, full size, in a new tab.
 */
function PageCases({ page, themeId, filter }: { page: PageStory; themeId: string; filter: "all" | "existing" | "proposed" }) {
  const menu = useMemo(() => resolveMenu(composedAt(useMenuStore.getState(), layerKey(PHASE, themeId))), [themeId]);
  const [runs, setRuns] = useState<Record<string, number>>({});
  const cases = page.useCases.filter((c) => filter === "all" || (filter === "proposed") === Boolean(c.proposed));
  if (!cases.length) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-500">
        No {filter} use cases for {page.name}.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-12">
      {cases.map((c, i) => (
        <article key={c.name} id={caseAnchor(c.name)} className="flex scroll-mt-6 flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-neutral-100">
                <span className="font-mono text-xs text-neutral-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {c.name}
                {c.proposed ? <ProposedTag /> : null}
              </span>
              <span className="text-[13px] leading-snug text-neutral-400">{c.note}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRuns((r) => ({ ...r, [c.name]: (r[c.name] ?? 0) + 1 }))}
                className={headerButton}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
                Reset
              </button>
              <button type="button" onClick={() => sendPosHandoff({ themeId, ...c.setup(menu) })} className={headerButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden>
                  <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
                Open in prototype
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#07090c] shadow-[0_0_0_1px_rgba(0,0,0,0.4)]">
            <FitFrame size={page.size}>
              <PosPagePreview
                key={`${themeId}:${runs[c.name] ?? 0}`}
                menu={menu}
                setup={c.setup(menu)}
                size={page.size}
              />
            </FitFrame>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Storybook-style explorer for the POS item components. Left: component nav. Centre: a
 * live playground and every use case side by side. Right: controls for each prop and
 * state. Renders the real components from `screens/tablet/pos/items.tsx`. The Pages tab
 * renders whole POS pages, full size, one per use case.
 */
export function DesignSystem() {
  const phase = getPhase(PHASE);
  const [themeId, setThemeId] = useState(phase.defaultTheme);
  const dishes = useMemo(() => posDishes(themeId), [themeId]);
  const stories = useMemo(() => buildStories(dishes), [dishes]);

  const [storyId, setStoryId] = useState(stories[0].id);
  const story = stories.find((s) => s.id === storyId) ?? stories[0];
  const [args, setArgs] = useState<Args>(story.defaults);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "existing" | "proposed">("all");
  const [mode, setMode] = useState<"components" | "pages">("components");
  const [pageId, setPageId] = useState(PAGES[0].id);
  const page = PAGES.find((p) => p.id === pageId) ?? PAGES[0];

  // deep link: /design-system#components/bucket-line, #pages/main-page (bare #bucket-line still works)
  useEffect(() => {
    const fromHash = () => {
      const [head, tail] = window.location.hash.slice(1).split("/");
      if (head === "pages") {
        setMode("pages");
        if (PAGES.some((p) => p.id === tail)) setPageId(tail);
        return;
      }
      const next = stories.find((s) => s.id === (head === "components" ? tail : head));
      if (head === "components") setMode("components");
      if (next) {
        setMode("components");
        setStoryId(next.id);
        setArgs(next.defaults);
        setActiveCase(null);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // stories only change with the theme; the hash is read once and on change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tokens = getTheme(PHASE, themeId).tablet.tokens.pos;
  const surface = surfaceClass(story, tokens);
  const set = (patch: Args) => {
    setArgs((a) => ({ ...a, ...patch }));
    setActiveCase(null);
  };
  const openStory = (s: Story) => {
    window.history.replaceState(null, "", `#components/${s.id}`);
    setStoryId(s.id);
    setArgs(s.defaults);
    setActiveCase(null);
  };

  const openPage = (p: PageStory) => {
    window.history.replaceState(null, "", `#pages/${p.id}`);
    setPageId(p.id);
  };
  const switchMode = (next: string) => {
    if (next === "pages") openPage(page);
    else openStory(story);
    setMode(next as typeof mode);
  };

  const pages = mode === "pages";
  const nav = pages
    ? PAGES.map((p) => ({ id: p.id, name: p.name, group: p.group, count: p.useCases.length, open: () => openPage(p) }))
    : stories.map((s) => ({ id: s.id, name: s.name, group: s.group, count: s.useCases.length, open: () => openStory(s) }));
  const currentId = pages ? page.id : story.id;
  const groups = [...new Set(nav.map((n) => n.group))];
  const head = pages
    ? { name: page.name, figma: page.figma, usage: page.usage, placements: page.placements }
    : { name: story.name, figma: story.figma, usage: story.usage, placements: story.placements };
  const sections = [
    { key: "existing", title: "Existing", note: "In the live POS today.", cases: story.useCases.filter((c) => !c.proposed) },
    { key: "proposed", title: "Proposed", note: "Not in the live POS yet.", cases: story.useCases.filter((c) => c.proposed) },
  ].filter((s) => s.cases.length && (filter === "all" || filter === s.key));
  const visible = story.controls.filter((c) => !c.when || c.when(args));
  const existing = visible.filter((c) => !c.proposed);
  const proposed = visible.filter((c) => c.proposed);

  const reset = () => {
    setArgs(story.defaults);
    setActiveCase(null);
  };
  const sectionTitle = "px-3 text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase";

  return (
    <PosTokensOverride value={tokens}>
      <div className="flex h-dvh w-full gap-0 overflow-x-auto overflow-y-hidden bg-[radial-gradient(ellipse_at_top,#262219,#141414_55%)] text-neutral-100">
        {/* nav: same glass panel, rows and section titles as the prototype's sidebar */}
        <aside className={cn("m-3 mr-0 flex w-[264px] shrink-0 flex-col overflow-hidden rounded-[22px]", GLASS_PANEL)}>
          <header className="flex items-center gap-3 px-4 pt-4 pb-5">
            <Link
              href="/"
              aria-label="Back to the prototype"
              className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-100 transition hover:scale-105 active:scale-95", GLASS)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex min-w-0 flex-col">
              <h1 className="text-[15px] leading-tight font-semibold">Design System</h1>
              <p className="truncate text-[11px] text-neutral-400">Native ordering POS · {phase.label}</p>
            </div>
          </header>
          <div className="px-3 pb-4">
            <Segment
              value={mode}
              onChange={switchMode}
              options={[
                { value: "components", label: "Components" },
                { value: "pages", label: "Pages" },
              ]}
            />
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2.5 pb-4">
            {groups.map((g) => (
              <section key={g} className="flex flex-col gap-1">
                <h2 className={cn(sectionTitle, "pb-1")}>{g}</h2>
                {nav
                  .filter((n) => n.group === g)
                  .map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={n.open}
                      className={cn(
                        "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[13px] font-medium transition",
                        n.id === currentId ? "bg-white/[0.12] text-white" : "text-neutral-300 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{n.name}</span>
                      <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 tabular-nums">
                        {n.count}
                      </span>
                    </button>
                  ))}
              </section>
            ))}
          </nav>
        </aside>

        {/* canvas */}
        <main className="flex min-w-[520px] flex-1 flex-col overflow-y-auto">
          <header className="flex flex-wrap items-start justify-between gap-4 px-8 pt-7 pb-6">
            <div className="flex max-w-2xl flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-[26px] leading-tight font-semibold tracking-tight text-white">{head.name}</h2>
                {head.figma ? (
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-neutral-400">Figma {head.figma}</span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-neutral-400">{head.usage}</p>
              <Placements paths={head.placements} />
            </div>
            <div className="flex w-[300px] flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Theme</span>
              <Segment value={themeId} options={phase.themes.map((t) => ({ value: t.id, label: t.label }))} onChange={setThemeId} />
            </div>
          </header>

          {pages ? (
            <section className="flex flex-col gap-6 px-8 pb-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">
                  Use cases <span className="text-neutral-600">{page.useCases.length}</span>
                  <span className="ml-2 font-normal tracking-normal normal-case text-neutral-500">
                    {page.size.width}×{page.size.height}, scaled to fit, live and interactive
                  </span>
                </h3>
                <div className="w-[320px]">
                  <Segment
                    value={filter}
                    onChange={(v) => setFilter(v as typeof filter)}
                    options={[
                      { value: "all", label: "All" },
                      { value: "existing", label: "Existing" },
                      { value: "proposed", label: "Proposed" },
                    ]}
                  />
                </div>
              </div>
              <PageCases page={page} themeId={themeId} filter={filter} />
            </section>
          ) : (
          <>
          <section className="flex flex-col gap-3 px-8">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Playground</h3>
              <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[11px] text-neutral-300">Interactive</span>
            </div>
            {/* a dotted canvas reads as a workspace you can poke at; cool near-black so it stands
                apart from the warm page and the glass panels, and the dark POS cards still show */}
            <div
              className={cn(
                "flex min-h-[448px] items-center justify-center rounded-2xl border border-white/15 bg-[#07090c] bg-[radial-gradient(circle,rgba(148,163,184,0.22)_1px,transparent_1.3px)] [background-size:18px_18px] p-10 text-neutral-100 shadow-[inset_0_0_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.4)]",
                figtree.className,
              )}
            >
              {story.render(args, { dishes, set })}
            </div>
          </section>

          <section className="flex flex-col gap-6 px-8 pt-10 pb-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">
                Use cases <span className="text-neutral-600">{story.useCases.length}</span>
              </h3>
              <div className="w-[320px]">
                <Segment
                  value={filter}
                  onChange={(v) => setFilter(v as typeof filter)}
                  options={[
                    { value: "all", label: "All" },
                    { value: "existing", label: "Existing" },
                    { value: "proposed", label: "Proposed" },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col gap-14">
              {sections.length ? (
                sections.map((sec) => (
                  <div key={sec.key} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                      {sec.key === "proposed" ? (
                        <ProposedTag />
                      ) : (
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase ring-1 ring-emerald-500/30">
                          Existing
                        </span>
                      )}
                      <span className="text-sm font-medium text-neutral-200">{sec.cases.length} cases</span>
                      <span className="text-[13px] text-neutral-500">{sec.note}</span>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                      {sec.cases.map((c) => (
                        <UseCaseCard
                          key={c.name}
                          story={story}
                          useCase={c}
                          args={{ ...story.defaults, ...c.args }}
                          dishes={dishes}
                          surface={surface}
                          active={activeCase === c.name}
                          onPick={() => {
                            setArgs({ ...story.defaults, ...c.args });
                            setActiveCase(c.name);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-500">
                  No {filter} use cases for {story.name}.
                </p>
              )}
            </div>
          </section>
          </>
          )}
        </main>

        {/* right panel: controls for a component, a use-case index for a page */}
        {pages ? (
          <aside className={cn("m-3 ml-0 flex w-[312px] shrink-0 flex-col overflow-hidden rounded-[22px]", GLASS_PANEL)}>
            <header className="flex flex-col px-5 pt-5 pb-4">
              <h2 className="text-[15px] leading-tight font-semibold">On this page</h2>
              <p className="truncate text-[11px] text-neutral-400">Jump to a use case</p>
            </header>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-6">
              {page.useCases.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    if (filter !== "all" && (filter === "proposed") !== Boolean(c.proposed)) setFilter("all");
                    requestAnimationFrame(() =>
                      document.getElementById(caseAnchor(c.name))?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    );
                  }}
                  className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <span className="font-mono text-[10px] text-neutral-500 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1">{c.name}</span>
                  {c.proposed ? <span className="size-1.5 shrink-0 rounded-full bg-fuchsia-400" aria-label="Proposed" /> : null}
                </button>
              ))}
            </nav>
          </aside>
        ) : (
        // controls: the prototype sidebar's panel, header and section rhythm
        <aside className={cn("m-3 ml-0 flex w-[312px] shrink-0 flex-col overflow-hidden rounded-[22px]", GLASS_PANEL)}>
          <header className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="text-[15px] leading-tight font-semibold">Controls</h2>
              <p className="truncate text-[11px] text-neutral-400">{activeCase ? `Loaded: ${activeCase}` : "Tweak any state, or pick a use case"}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset controls"
              title="Reset controls"
              className="-mr-1.5 flex size-9 items-center justify-center rounded-full text-neutral-300 transition hover:bg-white/[0.1] hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
              </svg>
            </button>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 pb-6">
            <section className="flex flex-col gap-5">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Props</h3>
              {existing.map((c) => (
                <ControlRow key={c.key} control={c} value={args[c.key]} onChange={(v) => set({ [c.key]: v })} />
              ))}
            </section>
            {proposed.length ? (
              <section className="flex flex-col gap-5 border-t border-white/[0.08] pt-6">
                <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">
                  Proposed props <ProposedTag className="tracking-wide" />
                </h3>
                {proposed.map((c) => (
                  <ControlRow key={c.key} control={c} value={args[c.key]} onChange={(v) => set({ [c.key]: v })} />
                ))}
              </section>
            ) : null}
          </div>
        </aside>
        )}
      </div>
    </PosTokensOverride>
  );
}
