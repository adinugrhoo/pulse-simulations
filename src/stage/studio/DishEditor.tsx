"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  dishStatus,
  removeDish,
  resetDish,
  resetDishField,
  restoreDish,
  setDishCategories,
  updateDish,
} from "@/menu/edits";
import type { Dish, MenuDevice } from "@/menu/types";
import { ImageField, btn, input } from "./ImageField";
import type { LayerView } from "./useLayerView";

type Field = keyof Omit<Dish, "id">;

/** Right panel: every editable property of one dish at the selected layer. */
export function DishEditor({ view, dishId }: { view: LayerView; dishId: string }) {
  const dish = view.data.dishes.find((d) => d.id === dishId);
  const removed = view.removed.find((d) => d.id === dishId);
  const status = dishStatus(view.key, dishId);
  const inherited = view.parent?.dishes.find((d) => d.id === dishId);

  if (removed) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-sm font-semibold text-neutral-100">{removed.name}</h3>
        <p className="text-xs text-neutral-400">Hidden on this layer and every layer below it.</p>
        <button type="button" onClick={() => restoreDish(view.key, dishId)} className={cn(btn(), "self-start")}>
          Restore dish
        </button>
      </div>
    );
  }
  if (!dish) return <p className="p-5 text-xs text-neutral-500">Pick a dish on the left.</p>;

  /** Badge next to a field label: set on this layer, or inherited from above. */
  const origin = (field: Field) => {
    if (view.isGlobal || status.ownedHere) return null;
    return status.overridden.includes(field) ? (
      <span className="flex items-center gap-1 text-[10px] text-amber-300">
        set here
        <button
          type="button"
          onClick={() => resetDishField(view.key, dishId, field)}
          className="rounded px-1 text-neutral-400 underline hover:text-white"
          title={`Back to ${String(inherited?.[field] ?? "inherited")}`}
        >
          reset
        </button>
      </span>
    ) : (
      <span className="text-[10px] text-neutral-600">inherited</span>
    );
  };

  const set = (fields: Partial<Omit<Dish, "id">>) => updateDish(view.key, dishId, fields);

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-neutral-100">{dish.name}</h3>
          <p className="font-mono text-[10px] text-neutral-500">{dish.id}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {!view.isGlobal && status.overridden.length ? (
            <button type="button" onClick={() => resetDish(view.key, dishId)} className={btn()}>
              Reset all
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => removeDish(view.key, dishId)}
            className={cn(btn(), "hover:border-red-500/60 hover:text-red-300")}
          >
            {view.isGlobal || status.ownedHere ? "Delete" : "Hide here"}
          </button>
        </div>
      </div>

      <Row label="Photo" origin={origin("image")}>
        <ImageField key={dish.image ?? ""} value={dish.image} alt={dish.name} onChange={(image) => set({ image })} />
      </Row>

      <Row label="Name" origin={origin("name")}>
        <TextInput key={`name:${dish.name}`} value={dish.name} onCommit={(name) => name && set({ name })} />
      </Row>

      <div className="grid grid-cols-2 gap-3">
        <Row label="Price" origin={origin("price")}>
          <NumberInput key={`price:${dish.price}`} value={dish.price} step={0.1} onCommit={(price) => set({ price })} />
        </Row>
        <Row label="Kcal" origin={origin("kcal")}>
          <NumberInput key={`kcal:${dish.kcal}`} value={dish.kcal} step={10} onCommit={(kcal) => set({ kcal })} />
        </Row>
      </div>

      <Row label="Description" origin={origin("description")}>
        <TextInput
          key={`desc:${dish.description}`}
          value={dish.description ?? ""}
          multiline
          onCommit={(description) => set({ description })}
        />
      </Row>

      <Row label="Tags" hint="comma separated" origin={origin("tags")}>
        <TextInput
          key={`tags:${dish.tags?.join()}`}
          value={dish.tags?.join(", ") ?? ""}
          onCommit={(v) =>
            set({
              tags: v
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </Row>

      <CategoryPicker view={view} dishId={dishId} device="mobile" />
      <CategoryPicker view={view} dishId={dishId} device="tablet" />
    </div>
  );
}

function CategoryPicker({ view, dishId, device }: { view: LayerView; dishId: string; device: MenuDevice }) {
  const list = view.data.categories[device];
  const chosen = list.filter((c) => c.dishIds.includes(dishId)).map((c) => c.id);
  const toggle = (id: string) =>
    setDishCategories(
      view.key,
      device,
      dishId,
      chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id],
    );

  return (
    <Row label={device === "mobile" ? "Mobile categories" : "Tablet (POS) categories"}>
      <div className="flex flex-wrap gap-1.5">
        {list.map((c) => {
          const on = chosen.includes(c.id);
          const color = "color" in c ? c.color : undefined;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
                on
                  ? "border-white/50 bg-white/10 text-white"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
              )}
            >
              {color ? <span className="size-2 rounded-full" style={{ background: color }} /> : null}
              {c.name}
            </button>
          );
        })}
        {list.length === 0 ? <span className="text-[11px] text-neutral-600">No categories yet.</span> : null}
      </div>
    </Row>
  );
}

function Row({ label, hint, origin, children }: { label: string; hint?: string; origin?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-neutral-400">
          {label}
          {hint ? <span className="ml-1 font-normal text-neutral-600">({hint})</span> : null}
        </span>
        {origin}
      </div>
      {children}
    </div>
  );
}

/** Commits on blur or Enter, so a half-typed value never reaches the devices. Key it by value to reset. */
export function TextInput({
  value,
  onCommit,
  multiline,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState(value);
  const commit = () => text !== value && onCommit(text.trim());
  return multiline ? (
    <textarea
      value={text}
      rows={3}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      className={cn(input, "resize-none leading-snug")}
    />
  ) : (
    <input
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={input}
    />
  );
}

function NumberInput({ value, step, onCommit }: { value?: number; step: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(value === undefined ? "" : String(value));
  const commit = () => {
    const n = Number(text);
    if (text.trim() !== "" && Number.isFinite(n) && n >= 0 && n !== value) onCommit(Math.round(n * 100) / 100);
  };
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cn(input, "tabular-nums")}
    />
  );
}
