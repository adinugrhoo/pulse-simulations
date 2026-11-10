"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPhase, getTheme } from "@/config/phases";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { layerKey } from "@/menu/layers";
import { resolveMenu } from "@/menu/resolve";
import { composedAt, useMenuStore } from "@/menu/store";
import type { Dish } from "@/menu/types";
import { PosTokensOverride } from "@/screens/tablet/pos/items";
import type { PosTokens } from "@/theme/tokens";
import { GLASS, GLASS_PANEL } from "@/stage/glass";
import { ControlRow, ProposedTag, Segment, type Args } from "./controls";
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

/**
 * Storybook-style explorer for the POS item components. Left: component nav. Centre: a
 * live playground and every use case side by side. Right: controls for each prop and
 * state. Renders the real components from `screens/tablet/pos/items.tsx`.
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

  // deep link: /design-system#bucket-line
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      const next = stories.find((s) => s.id === id);
      if (next) {
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
    window.history.replaceState(null, "", `#${s.id}`);
    setStoryId(s.id);
    setArgs(s.defaults);
    setActiveCase(null);
  };

  const groups = [...new Set(stories.map((s) => s.group))];
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
          <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-2.5 pb-4">
            {groups.map((g) => (
              <section key={g} className="flex flex-col gap-1">
                <h2 className={cn(sectionTitle, "pb-1")}>{g}</h2>
                {stories
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openStory(s)}
                      className={cn(
                        "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[13px] font-medium transition",
                        s.id === story.id ? "bg-white/[0.12] text-white" : "text-neutral-300 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400 tabular-nums">
                        {s.useCases.length}
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
                <h2 className="text-[26px] leading-tight font-semibold tracking-tight text-white">{story.name}</h2>
                {story.figma ? (
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-neutral-400">Figma {story.figma}</span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-neutral-400">{story.usage}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Placement</h3>
                <ul className="flex flex-col gap-1">
                  {story.placements.map((path) => (
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
            </div>
            <div className="flex w-[300px] flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] text-neutral-400 uppercase">Theme</span>
              <Segment value={themeId} options={phase.themes.map((t) => ({ value: t.id, label: t.label }))} onChange={setThemeId} />
            </div>
          </header>

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
        </main>

        {/* controls: the prototype sidebar's panel, header and section rhythm */}
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
      </div>
    </PosTokensOverride>
  );
}
