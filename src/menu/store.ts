"use client";

import { produce, type Draft } from "immer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FILE_LAYERS, GLOBAL_LAYER, chainTo, type LayerKey } from "./layers";
import { composeMenu } from "./resolve";
import type { MenuData, MenuPatch } from "./types";

/**
 * Editable menu layers. The committed config files are the baseline; the Menu Studio
 * writes into `drafts` (kept in localStorage so a reload never loses work) until the
 * layer is saved back to its menu.json.
 */
type Layers = { global?: MenuData; patches: Record<LayerKey, MenuPatch> };

type MenuStore = {
  /** Unsaved edits, per layer. */
  drafts: Layers;
  /** Fingerprint of the file each draft started from, to spot files that changed underneath it. */
  bases: Record<LayerKey, string>;
  /** Set while the browser refuses to store drafts (quota full). */
  persistError?: string;
  /** Layers written to disk this session, ahead of the dev server reloading the JSON. */
  saved: Layers;
  editGlobal: (recipe: (draft: Draft<MenuData>) => void) => void;
  editPatch: (key: LayerKey, recipe: (draft: Draft<MenuPatch>) => void) => void;
  /** Drop a layer's unsaved edits. */
  discard: (key: LayerKey) => void;
  /** `sent` is now on disk; the draft clears unless it was edited again during the save. */
  commit: (key: LayerKey, sent: MenuData | MenuPatch) => void;
};

const EMPTY_PATCH: MenuPatch = {};

export const globalOf = (s: Pick<MenuStore, "drafts" | "saved">): MenuData =>
  s.drafts.global ?? s.saved.global ?? FILE_LAYERS.global;

export const patchOf = (s: Pick<MenuStore, "drafts" | "saved">, key: LayerKey): MenuPatch =>
  s.drafts.patches[key] ?? s.saved.patches[key] ?? FILE_LAYERS.patches[key] ?? EMPTY_PATCH;

/** Raw contents of one layer: MenuData for global, MenuPatch below it. */
export const layerOf = (s: Pick<MenuStore, "drafts" | "saved">, key: LayerKey): MenuData | MenuPatch =>
  key === GLOBAL_LAYER ? globalOf(s) : patchOf(s, key);

/** The full menu as seen from a layer: global plus every patch down to it. */
export const composedAt = (s: Pick<MenuStore, "drafts" | "saved">, key: LayerKey): MenuData =>
  composeMenu(
    globalOf(s),
    chainTo(key)
      .slice(1)
      .map((k) => patchOf(s, k)),
  );

export const isDirty = (s: Pick<MenuStore, "drafts">, key: LayerKey) =>
  key === GLOBAL_LAYER ? !!s.drafts.global : !!s.drafts.patches[key];

export const dirtyKeys = (s: Pick<MenuStore, "drafts">): LayerKey[] => [
  ...(s.drafts.global ? [GLOBAL_LAYER] : []),
  ...Object.keys(s.drafts.patches),
];

const fileLayer = (s: Pick<MenuStore, "saved">, key: LayerKey) =>
  key === GLOBAL_LAYER
    ? (s.saved.global ?? FILE_LAYERS.global)
    : (s.saved.patches[key] ?? FILE_LAYERS.patches[key] ?? EMPTY_PATCH);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Short FNV-1a fingerprint of a layer's JSON. */
const fingerprint = (v: unknown) => {
  let h = 2166136261;
  for (const c of JSON.stringify(v)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
};

/** The draft started from an older version of the file (e.g. a teammate's change was pulled since). */
export const isStale = (s: Pick<MenuStore, "drafts" | "saved" | "bases">, key: LayerKey) =>
  isDirty(s, key) && !!s.bases[key] && s.bases[key] !== fingerprint(fileLayer(s, key));

/** First draft on a layer records which file version it branched from. */
const withBase = (s: MenuStore, key: LayerKey, dirty: boolean) => {
  const bases = { ...s.bases };
  if (!dirty) delete bases[key];
  else bases[key] ??= fingerprint(fileLayer(s, key));
  return bases;
};

/** localStorage that reports a full quota instead of throwing out of every edit. */
const draftStorage = () => ({
  getItem: (name: string) => localStorage.getItem(name),
  removeItem: (name: string) => localStorage.removeItem(name),
  setItem: (name: string, value: string) => {
    let error: string | undefined;
    try {
      localStorage.setItem(name, value);
    } catch {
      error = "Browser storage is full: recent edits will be lost on reload. Save or export, or remove uploaded photos.";
    }
    // only write on change, or the store update would persist (and fail) again
    if (useMenuStore.getState().persistError !== error) useMenuStore.setState({ persistError: error });
  },
});

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      drafts: { patches: {} },
      saved: { patches: {} },
      bases: {},

      editGlobal: (recipe) => {
        const next = produce(globalOf(get()), recipe);
        set((s) => {
          const dirty = !same(next, fileLayer(s, GLOBAL_LAYER));
          return { drafts: { ...s.drafts, global: dirty ? next : undefined }, bases: withBase(s, GLOBAL_LAYER, dirty) };
        });
      },

      editPatch: (key, recipe) => {
        const next = produce(patchOf(get(), key), recipe);
        set((s) => {
          const dirty = !same(next, fileLayer(s, key));
          const patches = { ...s.drafts.patches };
          if (dirty) patches[key] = next;
          else delete patches[key];
          return { drafts: { ...s.drafts, patches }, bases: withBase(s, key, dirty) };
        });
      },

      discard: (key) =>
        set((s) => {
          const bases = withBase(s, key, false);
          if (key === GLOBAL_LAYER) return { drafts: { ...s.drafts, global: undefined }, bases };
          const patches = { ...s.drafts.patches };
          delete patches[key];
          return { drafts: { ...s.drafts, patches }, bases };
        }),

      commit: (key, sent) =>
        set((s) => {
          const current = key === GLOBAL_LAYER ? s.drafts.global : s.drafts.patches[key];
          // an edit made while the request was in flight stays a draft, now on top of `sent`
          const stillSame = current === sent;
          const saved =
            key === GLOBAL_LAYER
              ? { ...s.saved, global: sent as MenuData }
              : { ...s.saved, patches: { ...s.saved.patches, [key]: sent as MenuPatch } };
          if (!stillSame) {
            const bases = { ...s.bases, [key]: fingerprint(sent) };
            return { saved, bases };
          }
          const bases = { ...s.bases };
          delete bases[key];
          if (key === GLOBAL_LAYER) return { saved, bases, drafts: { ...s.drafts, global: undefined } };
          const patches = { ...s.drafts.patches };
          delete patches[key];
          return { saved, bases, drafts: { ...s.drafts, patches } };
        }),
    }),
    {
      name: "pulse-menu-drafts",
      version: 1,
      storage: createJSONStorage(draftStorage),
      partialize: (s) => ({ drafts: s.drafts, bases: s.bases }),
      // drafts for a layer that no longer exists (renamed theme, removed phase) can't be saved or discarded
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<MenuStore, "drafts" | "bases">>;
        const known = (k: string) => k in FILE_LAYERS.patches;
        const patches = Object.fromEntries(Object.entries(p.drafts?.patches ?? {}).filter(([k]) => known(k)));
        const bases = Object.fromEntries(Object.entries(p.bases ?? {}).filter(([k]) => k === GLOBAL_LAYER || known(k)));
        return { ...current, drafts: { global: p.drafts?.global, patches }, bases };
      },
      // rehydrated from the Stage after mount, so the server render and first client render match
      skipHydration: true,
    },
  ),
);
