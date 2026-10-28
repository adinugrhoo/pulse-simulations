"use client";

import { useMemo } from "react";
import { chainTo, type LayerKey } from "@/menu/layers";
import { composedAt, layerOf, useMenuStore } from "@/menu/store";
import type { Dish, MenuData, MenuPatch } from "@/menu/types";

export type LayerView = {
  key: LayerKey;
  isGlobal: boolean;
  /** The menu as this layer sees it: everything above it plus its own changes. */
  data: MenuData;
  /** The same from the layer above; undefined on global. */
  parent?: MenuData;
  /** This layer's own file contents. */
  raw: MenuData | MenuPatch;
  /** Dishes the layer hides, so they can be listed and restored. */
  removed: Dish[];
};

/** Everything the studio panels need about one layer; recomputed on every edit. */
export function useLayerView(key: LayerKey): LayerView {
  const drafts = useMenuStore((s) => s.drafts);
  const saved = useMenuStore((s) => s.saved);
  return useMemo(() => {
    const s = { drafts, saved };
    const chain = chainTo(key);
    const parentKey = chain.length > 1 ? chain[chain.length - 2] : undefined;
    const parent = parentKey ? composedAt(s, parentKey) : undefined;
    const raw = layerOf(s, key);
    const removedIds = new Set(key === "global" ? [] : ((raw as MenuPatch).removed ?? []));
    return {
      key,
      isGlobal: key === "global",
      data: composedAt(s, key),
      parent,
      raw,
      removed: parent?.dishes.filter((d) => removedIds.has(d.id)) ?? [],
    };
  }, [drafts, saved, key]);
}
