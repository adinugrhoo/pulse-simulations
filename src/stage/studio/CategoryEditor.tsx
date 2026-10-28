"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  addCategory,
  moveCategory,
  moveDishInCategory,
  ownsCategories,
  removeCategory,
  resetCategories,
  updateCategory,
} from "@/menu/edits";
import { DishImage } from "@/menu/DishImage";
import type { MenuDevice, MobileCategory, TabletCategory } from "@/menu/types";
import { TextInput } from "./DishEditor";
import { ImageField, btn } from "./ImageField";
import type { LayerView } from "./useLayerView";

/** Categories tab: one device's category list at the selected layer, in display order. */
export function CategoryEditor({ view, onPickDish }: { view: LayerView; onPickDish: (id: string) => void }) {
  const [device, setDevice] = useState<MenuDevice>("mobile");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = view.data.categories[device] as (MobileCategory | TabletCategory)[];
  const owns = ownsCategories(view.key, device);
  const byId = Object.fromEntries(view.data.dishes.map((d) => [d.id, d]));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-3">
        <div className="flex gap-1">
          {(["mobile", "tablet"] as const).map((d) => (
            <button key={d} type="button" onClick={() => setDevice(d)} className={btn(device === d)}>
              {d === "mobile" ? "Mobile menu" : "Tablet POS"}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {!view.isGlobal && owns ? (
            <button type="button" onClick={() => resetCategories(view.key, device)} className={btn()}>
              Use inherited list
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpenId(addCategory(view.key, device, "New category"))}
            className={btn()}
          >
            + Category
          </button>
        </div>
      </div>

      <p className="px-4 pt-3 text-[10px] leading-snug text-neutral-500">
        {view.isGlobal
          ? "Base list every phase and theme starts from."
          : owns
            ? "This layer has its own list; changes above it no longer flow down for this device."
            : "Inherited from the layer above. Any change here copies the list into this layer."}
      </p>

      <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {list.map((c, i) => {
          const open = openId === c.id;
          const color = "color" in c ? c.color : undefined;
          return (
            <li key={c.id} className="rounded-lg border border-neutral-800 bg-neutral-900/50">
              <div className="flex items-center gap-2 p-2">
                {device === "mobile" ? (
                  <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-neutral-800">
                    <DishImage src={(c as MobileCategory).image} alt={c.name} sizes="32px" className="object-cover text-[10px]" />
                  </span>
                ) : (
                  <span className="size-8 shrink-0 rounded-md" style={{ background: color }} />
                )}
                <button type="button" onClick={() => setOpenId(open ? null : c.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-xs font-medium text-neutral-100">{c.name}</span>
                  <span className="text-[10px] text-neutral-500">{c.dishIds.length} dishes</span>
                </button>
                <button type="button" disabled={i === 0} onClick={() => moveCategory(view.key, device, c.id, -1)} className={btn()} aria-label="Move up">
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === list.length - 1}
                  onClick={() => moveCategory(view.key, device, c.id, 1)}
                  className={btn()}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              {open ? (
                <div className="flex flex-col gap-3 border-t border-neutral-800 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-[11px] text-neutral-400">
                      Name
                      <TextInput key={`n:${c.name}`} value={c.name} onCommit={(name) => name && updateCategory(view.key, device, c.id, { name })} />
                    </label>
                    {device === "mobile" ? (
                      <label className="flex flex-col gap-1 text-[11px] text-neutral-400">
                        Short label
                        <TextInput
                          key={`l:${(c as MobileCategory).label}`}
                          value={(c as MobileCategory).label ?? ""}
                          placeholder={c.name}
                          onCommit={(label) => updateCategory(view.key, device, c.id, { label: label || undefined })}
                        />
                      </label>
                    ) : (
                      <label className="flex flex-col gap-1 text-[11px] text-neutral-400">
                        Tile colour
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateCategory(view.key, device, c.id, { color: e.target.value })}
                          className="h-[30px] w-full cursor-pointer rounded-md border border-neutral-800 bg-neutral-900"
                        />
                      </label>
                    )}
                  </div>

                  {device === "mobile" ? (
                    <ImageField
                      key={(c as MobileCategory).image ?? ""}
                      value={(c as MobileCategory).image}
                      alt={c.name}
                      size={72}
                      onChange={(image) => updateCategory(view.key, device, c.id, { image: image || undefined })}
                    />
                  ) : null}

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Dishes, in order (assign dishes from the Dishes tab)</span>
                    {c.dishIds.map((id, j) => (
                      <div key={id} className="flex items-center gap-2 rounded-md bg-neutral-900 px-2 py-1">
                        <button type="button" onClick={() => onPickDish(id)} className="min-w-0 flex-1 truncate text-left text-[11px] text-neutral-200 hover:underline">
                          {byId[id]?.name ?? id}
                        </button>
                        <button type="button" disabled={j === 0} onClick={() => moveDishInCategory(view.key, device, c.id, id, -1)} className={cn(btn(), "px-1.5 py-0")}>
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={j === c.dishIds.length - 1}
                          onClick={() => moveDishInCategory(view.key, device, c.id, id, 1)}
                          className={cn(btn(), "px-1.5 py-0")}
                        >
                          ↓
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCategory(view.key, device, c.id)}
                    className={cn(btn(), "self-start hover:border-red-500/60 hover:text-red-300")}
                  >
                    Delete category
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
