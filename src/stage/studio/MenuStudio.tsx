"use client";

import { useEffect, useMemo, useState } from "react";
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
import { StageErrorBoundary } from "../ErrorBoundary";
import { CategoryEditor } from "./CategoryEditor";
import { DishEditor } from "./DishEditor";
import { btn, input } from "./ImageField";
import { STUDIO_MODE, exportLayer, layerPath, saveLayer } from "./io";
import { useLayerView, type LayerView } from "./useLayerView";

const folderOf = (phaseId: string) => getPhase(phaseId).folder;

/** Header button that opens the studio; shows how many layers have unsaved edits. */
export function MenuStudioButton() {
  const [open, setOpen] = useState(false);
  const dirty = useMenuStore((s) => dirtyKeys(s).length);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-700"
      >
        Menu Studio
        {dirty ? (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            {dirty} unsaved
          </span>
        ) : null}
      </button>
      {open ? (
        <StageErrorBoundary label="Menu Studio">
          <MenuStudio onClose={() => setOpen(false)} />
        </StageErrorBoundary>
      ) : null}
    </>
  );
}

/**
 * The Menu Studio window: pick a layer (Global, a phase, or a theme inside it), then edit
 * dish photos, names, prices and categories there. Devices update live; Save writes the
 * layer's menu.json.
 */
function MenuStudio({ onClose }: { onClose: () => void }) {
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  const [layer, setLayer] = useState<LayerKey>(() => {
    const live = layerKey(phase, themeId);
    return LAYERS.some((l) => l.key === live) ? live : "global";
  });
  const [tab, setTab] = useState<"dishes" | "categories">("dishes");
  const [dishId, setDishId] = useState<string | null>(null);
  const view = useLayerView(layer);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Menu Studio"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full max-h-[900px] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl shadow-black"
      >
        <StudioHeader layer={layer} onClose={onClose} />

        <div className="flex min-h-0 flex-1">
          <LayerTree layer={layer} onPick={setLayer} />

          <section className="flex min-h-0 w-[420px] shrink-0 flex-col border-r border-neutral-800">
            <div className="flex gap-1 border-b border-neutral-800 px-4 py-3">
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
    </div>
  );
}

function StudioHeader({ layer, onClose }: { layer: LayerKey; onClose: () => void }) {
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
    <header className="flex items-center justify-between gap-4 border-b border-neutral-800 px-5 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">Menu Studio</h2>
        <p className="truncate font-mono text-[10px] text-neutral-500">
          {STUDIO_MODE === "file"
            ? `Editing ${layerPath(layer, folderOf)}`
            : "Read-only deploy: edits are kept in this browser. Export a layer to commit it."}
        </p>
        {stale ? (
          <p className="text-[10px] text-amber-300">
            This file changed since the draft started. Saving overwrites it; Discard to take the file version.
          </p>
        ) : null}
        {persistError ? <p className="text-[10px] text-red-400">{persistError}</p> : null}
      </div>
      <div className="flex items-center gap-1.5">
        {status ? (
          <span className={cn("max-w-[360px] truncate text-[11px]", status.tone === "ok" ? "text-emerald-400" : "text-red-400")}>
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
              className="rounded-md bg-white px-3 py-1 text-[11px] font-semibold text-neutral-900 disabled:opacity-40"
            >
              Save all{allDirty.length ? ` (${allDirty.length})` : ""}
            </button>
          </>
        ) : null}
        <button type="button" onClick={onClose} className={cn(btn(), "ml-2")} aria-label="Close">
          ✕
        </button>
      </div>
    </header>
  );
}

/** Left column: Global, then each phase with its themes nested under it. */
function LayerTree({ layer, onPick }: { layer: LayerKey; onPick: (key: LayerKey) => void }) {
  const drafts = useMenuStore((s) => s.drafts);
  const phase = useSim((s) => s.phase);
  const themeId = useThemeId();
  const setPhase = useSim((s) => s.setPhase);
  const setTheme = useThemeChoice((s) => s.setTheme);
  const onDevices = layerKey(phase, themeId);
  const selected = LAYERS.find((l) => l.key === layer) ?? LAYERS[0];

  return (
    <nav className="flex w-[230px] shrink-0 flex-col border-r border-neutral-800">
      <p className="px-4 pt-4 pb-2 text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">Layer</p>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {LAYERS.map((l) => {
          const dirty = l.key === "global" ? !!drafts.global : !!drafts.patches[l.key];
          const live = l.key === onDevices || (l.level === "phase" && l.phaseId === phase) || l.level === "global";
          return (
            <li key={l.key}>
              <button
                type="button"
                onClick={() => onPick(l.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
                  l.level === "phase" && "pl-4",
                  l.level === "theme" && "pl-8",
                  l.key === layer ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {l.level === "theme" ? getPhase(l.phaseId!).themes.find((t) => t.id === l.themeId)!.label : l.label}
                </span>
                {live ? <span title="Shown on the devices" className="size-1.5 rounded-full bg-sky-400" /> : null}
                {dirty ? <span title="Unsaved edits" className="size-1.5 rounded-full bg-amber-400" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 border-t border-neutral-800 p-3 text-[10px] leading-snug text-neutral-500">
        <p>
          <span className="mr-1 inline-block size-1.5 rounded-full bg-sky-400" /> on the devices now
          <span className="mr-1 ml-3 inline-block size-1.5 rounded-full bg-amber-400" /> unsaved
        </p>
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
      <p className="px-4 pb-1 text-[10px] text-neutral-600">{rows.length} dishes</p>
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
                <DishImage src={dish.image} alt={dish.name} sizes="36px" className="object-cover text-xs" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-xs text-neutral-100", hidden && "line-through")}>{dish.name}</span>
                <span className="flex items-center gap-1.5 text-[10px] text-neutral-500">
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
  return <span className={cn("rounded px-1 py-px text-[9px] font-semibold", tones[tone])}>{children}</span>;
}

/** Right column before a dish is picked: how layering works. */
function Help({ view }: { view: LayerView }) {
  return (
    <div className="flex max-w-[460px] flex-col gap-3 p-6 text-xs leading-relaxed text-neutral-400">
      <h3 className="text-sm font-semibold text-neutral-100">How layers work</h3>
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
