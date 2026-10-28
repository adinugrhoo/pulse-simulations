"use client";

import type { Draft } from "immer";
import { GLOBAL_LAYER, chainTo, type LayerKey } from "./layers";
import { composedAt, layerOf, useMenuStore } from "./store";
import type { Dish, MenuData, MenuDevice, MenuPatch, MobileCategory, TabletCategory } from "./types";

/**
 * Menu Studio operations. Each one writes into a single layer: the global menu.json,
 * or a phase/theme patch that only records what differs from the layer above.
 */

type DishFields = Partial<Omit<Dish, "id">>;
type AnyCategory = MobileCategory | TabletCategory;

const store = () => useMenuStore.getState();

const parentOf = (key: LayerKey): LayerKey | undefined => {
  const chain = chainTo(key);
  return chain.length > 1 ? chain[chain.length - 2] : undefined;
};

/** The dish as the layer above sees it (what an override is compared against). */
export const inheritedDish = (key: LayerKey, id: string): Dish | undefined => {
  const parent = parentOf(key);
  return parent ? composedAt(store(), parent).dishes.find((d) => d.id === id) : undefined;
};

/** Where a dish comes from, and what this layer does to it. */
export type DishStatus = {
  /** Defined in this layer (global dish, or added by this phase/theme). */
  ownedHere: boolean;
  /** Fields this layer overrides on an inherited dish. */
  overridden: (keyof DishFields)[];
  removedHere: boolean;
};

export const dishStatus = (key: LayerKey, id: string): DishStatus => {
  if (key === GLOBAL_LAYER) return { ownedHere: true, overridden: [], removedHere: false };
  const patch = layerOf(store(), key) as MenuPatch;
  return {
    ownedHere: !!patch.added?.some((d) => d.id === id),
    overridden: patch.added?.some((d) => d.id === id)
      ? []
      : (Object.keys(patch.dishes?.[id] ?? {}) as (keyof DishFields)[]),
    removedHere: !!patch.removed?.includes(id),
  };
};

/** Empty override maps make noisy JSON; drop them. */
const tidy = (p: Draft<MenuPatch>) => {
  if (p.dishes) {
    for (const id of Object.keys(p.dishes)) if (!Object.keys(p.dishes[id]).length) delete p.dishes[id];
    if (!Object.keys(p.dishes).length) delete p.dishes;
  }
  if (p.added && !p.added.length) delete p.added;
  if (p.removed && !p.removed.length) delete p.removed;
  if (p.categories && !p.categories.mobile && !p.categories.tablet) delete p.categories;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export const updateDish = (key: LayerKey, id: string, fields: DishFields) => {
  if (key === GLOBAL_LAYER) {
    store().editGlobal((d) => {
      const dish = d.dishes.find((x) => x.id === id);
      if (dish) Object.assign(dish, fields);
    });
    return;
  }
  const inherited = inheritedDish(key, id);
  store().editPatch(key, (p) => {
    const added = p.added?.find((x) => x.id === id);
    if (added) {
      Object.assign(added, fields);
      return;
    }
    const over = { ...(p.dishes?.[id] ?? {}), ...fields } as Record<string, unknown>;
    // an override that matches the layer above is no override at all
    for (const f of Object.keys(over)) {
      if (inherited && same(over[f], inherited[f as keyof Dish])) delete over[f];
    }
    p.dishes ??= {};
    p.dishes[id] = over as Draft<DishFields>;
    tidy(p);
  });
};

/** Drop one field override so the dish inherits it again. */
export const resetDishField = (key: LayerKey, id: string, field: keyof DishFields) =>
  store().editPatch(key, (p) => {
    if (p.dishes?.[id]) delete p.dishes[id][field];
    tidy(p);
  });

export const resetDish = (key: LayerKey, id: string) =>
  store().editPatch(key, (p) => {
    if (p.dishes) delete p.dishes[id];
    tidy(p);
  });

const newId = () => `dish-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** A fresh dish owned by this layer. Returns its id. */
export const addDish = (key: LayerKey, fields: DishFields = {}): string => {
  const dish: Dish = { id: newId(), name: "New dish", price: 0, ...fields };
  if (key === GLOBAL_LAYER) store().editGlobal((d) => void d.dishes.push(dish));
  else store().editPatch(key, (p) => void (p.added ??= []).push(dish));
  return dish.id;
};

/**
 * Global: deletes the dish everywhere. Phase/theme: an added dish is deleted, an inherited
 * one is hidden from this layer down (and can be restored).
 */
export const removeDish = (key: LayerKey, id: string) => {
  if (key === GLOBAL_LAYER) {
    store().editGlobal((d) => {
      d.dishes = d.dishes.filter((x) => x.id !== id);
      for (const c of [...d.categories.mobile, ...d.categories.tablet]) c.dishIds = c.dishIds.filter((x) => x !== id);
    });
    return;
  }
  store().editPatch(key, (p) => {
    if (p.added?.some((x) => x.id === id)) {
      p.added = p.added.filter((x) => x.id !== id);
      if (p.dishes) delete p.dishes[id];
    } else if (!p.removed?.includes(id)) {
      (p.removed ??= []).push(id);
    }
    tidy(p);
  });
};

export const restoreDish = (key: LayerKey, id: string) =>
  store().editPatch(key, (p) => {
    p.removed = p.removed?.filter((x) => x !== id);
    tidy(p);
  });

/* -------------------------------- categories ------------------------------- */

/** True when this layer carries its own copy of a device's categories. */
export const ownsCategories = (key: LayerKey, device: MenuDevice) =>
  key === GLOBAL_LAYER || !!(layerOf(store(), key) as MenuPatch).categories?.[device];

/**
 * Rewrite a device's category list at this layer. A phase/theme copies the inherited list
 * the first time, so from then on it replaces the list above it.
 */
export const writeCategories = <D extends MenuDevice>(
  key: LayerKey,
  device: D,
  change: (list: AnyCategory[]) => AnyCategory[],
) => {
  const current = composedAt(store(), key).categories[device] as AnyCategory[];
  const next = change(structuredClone(current));
  if (key === GLOBAL_LAYER) {
    store().editGlobal((d) => {
      (d.categories as MenuData["categories"])[device] = next as never;
    });
  } else {
    store().editPatch(key, (p) => {
      p.categories ??= {};
      (p.categories as NonNullable<MenuPatch["categories"]>)[device] = next as never;
    });
  }
};

/** Stop overriding a device's categories; the layer above's list shows again. */
export const resetCategories = (key: LayerKey, device: MenuDevice) =>
  store().editPatch(key, (p) => {
    if (p.categories) delete p.categories[device];
    tidy(p);
  });

/** Put a dish in exactly these categories (appended at the end of newly joined ones). */
export const setDishCategories = (key: LayerKey, device: MenuDevice, dishId: string, categoryIds: string[]) =>
  writeCategories(key, device, (list) =>
    list.map((c) => {
      const wants = categoryIds.includes(c.id);
      const has = c.dishIds.includes(dishId);
      if (wants && !has) return { ...c, dishIds: [...c.dishIds, dishId] };
      if (!wants && has) return { ...c, dishIds: c.dishIds.filter((x) => x !== dishId) };
      return c;
    }),
  );

export const updateCategory = (key: LayerKey, device: MenuDevice, id: string, fields: Partial<AnyCategory>) =>
  writeCategories(key, device, (list) => list.map((c) => (c.id === id ? ({ ...c, ...fields } as AnyCategory) : c)));

export const addCategory = (key: LayerKey, device: MenuDevice, name: string): string => {
  const id = `cat-${Date.now().toString(36)}`;
  writeCategories(key, device, (list) => [
    ...list,
    device === "mobile" ? { id, name, dishIds: [] } : { id, name, color: "#4b4da8", dishIds: [] },
  ]);
  return id;
};

export const removeCategory = (key: LayerKey, device: MenuDevice, id: string) =>
  writeCategories(key, device, (list) => list.filter((c) => c.id !== id));

export const moveCategory = (key: LayerKey, device: MenuDevice, id: string, by: -1 | 1) =>
  writeCategories(key, device, (list) => {
    const i = list.findIndex((c) => c.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= list.length) return list;
    [list[i], list[j]] = [list[j], list[i]];
    return list;
  });

/** Move a dish within one category. */
export const moveDishInCategory = (key: LayerKey, device: MenuDevice, categoryId: string, dishId: string, by: -1 | 1) =>
  writeCategories(key, device, (list) =>
    list.map((c) => {
      if (c.id !== categoryId) return c;
      const ids = [...c.dishIds];
      const i = ids.indexOf(dishId);
      const j = i + by;
      if (i < 0 || j < 0 || j >= ids.length) return c;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...c, dishIds: ids };
    }),
  );
