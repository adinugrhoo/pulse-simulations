"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { getPhase } from "@/config/phases";
import { useSim } from "@/engine/store";
import { addDish } from "@/menu/edits";
import { DishImage } from "@/menu/DishImage";
import { LAYERS, layerKey, type LayerKey } from "@/menu/layers";
import { dirtyKeys, isDirty, isStale, useMenuStore } from "@/menu/store";
import type { MenuPatch } from "@/menu/types";
import { useThemeId } from "@/theme/hooks";
import { useThemeChoice } from "@/theme/store";
import { GLASS } from "../glass";
import { CategoryEditor } from "./CategoryEditor";
import { DishEditor } from "./DishEditor";
import { btn, input } from "./ImageField";
import { STUDIO_MODE, exportLayer, layerPath, saveLayer } from "./io";
import { useLayerView, type LayerView } from "./useLayerView";

const folderOf = (phaseId: string) => getPhase(phaseId).folder;

/**
 * The Menu Studio page (/menu-studio): pick a layer (Global, a phase, or a theme inside it),
 * then edit dish photos, names, prices and categories there. Save writes the layer's menu.json.
 */
export function MenuStudioPage() {
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  const [layer, setLayer] = useState<LayerKey>(() => {
    const live = layerKey(phase, themeId);
    return LAYERS.some((l) => l.key === live) ? live : "global";
  });
  const [tab, setTab] = useState<"dishes" | "categories">("dishes");
  const [dishId, setDishId] = useState<string | null>(null);
  const view = useLayerView(layer);

  // opened straight from the address bar: load the drafts and the phase/theme the devices show
  useEffect(() => {
    void Promise.all([useMenuStore.persist.rehydrate(), useThemeChoice.persist.rehydrate()]).then(() => {
      const { lastPhase } = useThemeChoice.getState();
      if (lastPhase && lastPhase !== useSim.getState().phase) useSim.getState().setPhase(lastPhase);
    });
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-neutral-950 text-neutral-100">
      <StudioHeader layer={layer} />

      <div className="flex min-h-0 flex-1">
        <LayerTree layer={layer} onPick={setLayer} />

        <section className="flex min-h-0 w-[440px] shrink-0 flex-col border-r border-white/10">
          <div className="flex gap-1.5 border-b border-white/10 px-5 py-3">
            <button type="button" onClick={() => setTab("dishes")} className={btn(tab === "dishes")}>
              Dishes
            </button>
            <button type="button" onClick={() => setTab("categories")} className={btn(tab === "categories")}>
              Categories
            </button>
          </div>
          {tab === "dishes" ? (
            <DishList view={view} selected={dishId} onPick={setDishId} />
          ) : (
            <CategoryEditor
              view={view}
              onPickDish={(id) => {
                setDishId(id);
                setTab("dishes");
              }}
            />
          )}
        </section>

        <section className="min-h-0 flex-1 overflow-y-auto">
          {dishId ? <DishEditor key={`${layer}:${dishId}`} view={view} dishId={dishId} /> : <Help view={view} />}
        </section>
      </div>
    </div>
  );
}

/** Page header, as the changelog's: back button, title and what's being edited, then the save actions. */
function StudioHeader({ layer }: { layer: LayerKey }) {
  const dirty = useMenuStore((s) => isDirty(s, layer));
  const stale = useMenuStore((s) => isStale(s, layer));
  const persistError = useMenuStore((s) => s.persistError);
  const drafts = useMenuStore((s) => s.drafts);
  const allDirty = useMemo(() => dirtyKeys({ drafts }), [drafts]);
  const discard = useMenuStore((s) => s.discard);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (keys: LayerKey[]) => {
    setBusy(true);
    const errors: string[] = [];
    for (const k of keys) {
      const err = await saveLayer(k);
      if (err) errors.push(`${k}: ${err}`);
    }
    setBusy(false);
    setStatus(errors.length ? { tone: "error", text: errors.join(" · ") } : { tone: "ok", text: `Saved ${keys.length} layer(s)` });
  };

  return (
    <header className="flex shrink-0 items-center gap-5 border-b border-white/10 bg-neutral-950/80 px-6 py-5 backdrop-blur-xl">
      <Link
        href="/"
        aria-label="Back to the prototype"
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-neutral-100 transition hover:scale-105 active:scale-95", GLASS)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-white">Menu Studio</h1>
        <p className="truncate text-sm text-neutral-400">
          {STUDIO_MODE === "file" ? (
            <>
              Edit dish photos, names, prices and categories per layer. Editing{" "}
              <code className="font-mono text-[13px] text-neutral-300">{layerPath(layer, folderOf)}</code>
            </>
          ) : (
            "Read-only deploy: edits are kept in this browser. Export a layer to commit it."
          )}
        </p>
        {stale ? (
          <p className="text-[13px] text-amber-300">
            This file changed since the draft started. Saving overwrites it; Discard to take the file version.
          </p>
        ) : null}
        {persistError ? <p className="text-[13px] text-red-400">{persistError}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status ? (
          <span className={cn("max-w-[320px] truncate text-[13px]", status.tone === "ok" ? "text-emerald-400" : "text-red-400")}>
            {status.text}
          </span>
        ) : null}
        <button type="button" disabled={!dirty} onClick={() => discard(layer)} className={btn()}>
          Discard layer
        </button>
        <button type="button" onClick={() => exportLayer(layer)} className={btn()}>
          Export JSON
        </button>
        {STUDIO_MODE === "file" ? (
          <>
            <button type="button" disabled={!dirty || busy} onClick={() => save([layer])} className={btn()}>
              Save layer
            </button>
            <button
              type="button"
              disabled={!allDirty.length || busy}
              onClick={() => save(allDirty)}
              className="h-9 rounded-lg bg-white px-3.5 text-[13px] font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-40"
            >
              Save all{allDirty.length ? ` (${allDirty.length})` : ""}
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

/**
 * Left column, grouped by hierarchy: the Global base, then each phase with its own
 * overrides and its themes nested under a rail. Dots: on the devices now / unsaved.
 */
function LayerTree({ layer, onPick }: { layer: LayerKey; onPick: (key: LayerKey) => void }) {
  const drafts = useMenuStore((s) => s.drafts);
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  const setPhase = useSim((s) => s.setPhase);
  const setTheme = useThemeChoice((s) => s.setTheme);
  const onDevices = layerKey(phase, themeId);
  const selected = LAYERS.find((l) => l.key === layer) ?? LAYERS[0];

  const row = (l: (typeof LAYERS)[number], label: string, hint?: string) => {
    const dirty = l.key === "global" ? !!drafts.global : !!drafts.patches[l.key];
    const live = l.key === onDevices || (l.level === "phase" && l.phaseId === phase) || l.level === "global";
    const on = l.key === layer;
    return (
      <button
        type="button"
        onClick={() => onPick(l.key)}
        className={cn(
          "flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition",
          on ? "bg-white/[0.1] text-white" : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100",
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {label}
          {hint ? <span className="ml-1.5 text-xs text-neutral-500">{hint}</span> : null}
        </span>
        {live ? <span title="Shown on the devices" className="size-1.5 shrink-0 rounded-full bg-sky-400" /> : null}
        {dirty ? <span title="Unsaved edits" className="size-1.5 shrink-0 rounded-full bg-amber-400" /> : null}
      </button>
    );
  };

  const phases = LAYERS.filter((l) => l.level === "phase");

  return (
    <nav aria-label="Layers" className="flex w-[260px] shrink-0 flex-col border-r border-white/10">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        <section className="flex flex-col gap-1.5">
          <h2 className="px-3 text-[11px] font-semibold tracking-[0.1em] text-neutral-500 uppercase">Base</h2>
          {row(LAYERS[0], "Global", "every dish")}
        </section>
        {phases.map((p) => {
          const config = getPhase(p.phaseId!);
          const themes = LAYERS.filter((l) => l.level === "theme" && l.phaseId === p.phaseId);
          return (
            <section key={p.key} className="flex flex-col gap-1.5">
              <h2 className="flex items-center justify-between px-3 text-[11px] font-semibold tracking-[0.1em] text-neutral-500 uppercase">
                {config.label}
                <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-normal normal-case ring-1", config.tone)}>
                  {config.chip}
                </span>
              </h2>
              {row(p, "Phase overrides")}
              {themes.length ? (
                <ul className="ml-5 flex flex-col gap-0.5 border-l border-white/10 pl-2">
                  {themes.map((t) => (
                    <li key={t.key}>{row(t, config.themes.find((x) => x.id === t.themeId)!.label, "theme")}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 p-4 text-[13px] leading-snug text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400" /> On the devices
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400" /> Unsaved
          </span>
        </div>
        {selected.phaseId && selected.key !== onDevices ? (
          <button
            type="button"
            onClick={() => {
              if (selected.phaseId !== phase) setPhase(selected.phaseId!);
              if (selected.themeId) setTheme(selected.phaseId!, selected.themeId);
            }}
            className={btn()}
          >
            Show {selected.label} on devices
          </button>
        ) : null}
      </div>
    </nav>
  );
}

type Filter = "all" | "here" | "uncategorised" | "hidden";

/** Middle column: searchable dish list with what this layer changes on each. */
function DishList({ view, selected, onPick }: { view: LayerView; selected: string | null; onPick: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const patch = view.isGlobal ? undefined : (view.raw as MenuPatch);

  const rows = useMemo(() => {
    const inCategory = new Set(
      [...view.data.categories.mobile, ...view.data.categories.tablet].flatMap((c) => c.dishIds),
    );
    const q = query.trim().toLowerCase();
    const all = [
      ...view.data.dishes.map((d) => ({ dish: d, hidden: false })),
      ...view.removed.map((d) => ({ dish: d, hidden: true })),
    ];
    return all
      .map(({ dish, hidden }) => ({
        dish,
        hidden,
        added: !!patch?.added?.some((d) => d.id === dish.id),
        edited: !!patch?.dishes?.[dish.id],
        uncategorised: !inCategory.has(dish.id),
      }))
      .filter((r) => !q || r.dish.name.toLowerCase().includes(q) || r.dish.id.includes(q))
      .filter((r) =>
        filter === "here"
          ? r.added || r.edited || r.hidden
          : filter === "uncategorised"
            ? r.uncategorised && !r.hidden
            : filter === "hidden"
              ? r.hidden
              : true,
      );
  }, [view, patch, query, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 px-4 pt-3 pb-2">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes" className={input} />
          <button type="button" onClick={() => onPick(addDish(view.key))} className={cn(btn(), "shrink-0")}>
            + Dish
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["here", view.isGlobal ? null : "Changed here"],
              ["uncategorised", "No category"],
              ["hidden", view.isGlobal ? null : "Hidden"],
            ] as [Filter, string | null][]
          )
            .filter(([, label]) => label)
            .map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)} className={btn(filter === id)}>
                {label}
              </button>
            ))}
        </div>
      </div>
      <p className="px-4 pb-1 text-xs text-neutral-600">{rows.length} dishes</p>
      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-3">
        {rows.map(({ dish, hidden, added, edited, uncategorised }) => (
          <li key={dish.id}>
            <button
              type="button"
              onClick={() => onPick(dish.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition",
                dish.id === selected ? "bg-white/10" : "hover:bg-white/5",
                hidden && "opacity-50",
              )}
            >
              <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                <DishImage src={dish.image} alt={dish.name} sizes="36px" className="object-cover text-sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm text-neutral-100", hidden && "line-through")}>{dish.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <span className="tabular-nums">{dish.price.toFixed(2)}</span>
                  {added ? <Badge tone="emerald">added here</Badge> : null}
                  {edited ? <Badge tone="amber">edited here</Badge> : null}
                  {hidden ? <Badge tone="red">hidden</Badge> : null}
                  {uncategorised && !hidden ? <Badge tone="neutral">no category</Badge> : null}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "amber" | "red" | "neutral"; children: string }) {
  const tones = {
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-red-500/15 text-red-300",
    neutral: "bg-neutral-500/15 text-neutral-400",
  };
  return <span className={cn("rounded px-1 py-px text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

/** Right column before a dish is picked: how layering works. */
function Help({ view }: { view: LayerView }) {
  return (
    <div className="flex max-w-[460px] flex-col gap-3 p-6 text-sm leading-relaxed text-neutral-400">
      <h3 className="text-[15px] font-semibold text-neutral-100">How layers work</h3>
      <p>
        <b className="text-neutral-200">Global</b> holds every dish and both category lists. A{" "}
        <b className="text-neutral-200">phase</b> changes only what differs for that phase, and a{" "}
        <b className="text-neutral-200">theme</b> changes only what differs inside its phase.
      </p>
      <p>
        Edits on a phase or theme are stored as overrides, so a price changed on Global still flows down unless a lower
        layer set its own. Use <i>reset</i> next to a field to inherit again.
      </p>
      <p>Mobile and tablet keep separate category lists. Assign a dish in its editor, or reorder in the Categories tab.</p>
      <p className="text-neutral-500">
        {view.data.dishes.length} dishes · {view.data.categories.mobile.length} mobile categories ·{" "}
        {view.data.categories.tablet.length} tablet categories on this layer.
      </p>
    </div>
  );
}
