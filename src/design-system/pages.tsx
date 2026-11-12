"use client";

import { useReducer } from "react";
import { DEFAULT_TABLE_ID } from "@/config/global";
import { reduce } from "@/engine/reducer";
import { initialState } from "@/engine/state";
import type { CartLine, WaiterSession } from "@/engine/types";
import type { ResolvedMenu, ResolvedTabletCategory } from "@/menu/types";
import { PosOrderScreen } from "@/screens/tablet/pos/PosOrderScreen";
import { PosPreview, type PosUiStart } from "@/screens/tablet/pos/preview";
import type { ScheduleClock } from "@/theme/store";

/** Where a page case starts: the bucket, the open category, the search box, and the menu the API sent. */
export type PageSetup = {
  cart?: CartLine[];
  pos?: WaiterSession["pos"];
  ui?: PosUiStart;
  scheduleClock?: ScheduleClock;
  /** Swap the menu, e.g. one the API sent back empty. */
  menu?: ResolvedMenu;
};

export type PageCase = {
  name: string;
  note: string;
  /** Unreachable in the live POS today (the menu data always lists dishes). */
  proposed?: boolean;
  setup: (menu: ResolvedMenu) => PageSetup;
};

export type PageStory = {
  id: string;
  name: string;
  group: string;
  usage: string;
  placements: string[][];
  figma?: string;
  /** Authored size of the page, rendered 1:1. */
  size: { width: number; height: number };
  useCases: PageCase[];
};

/* ------------------------------ menu fixtures ------------------------------ */

const plainCategory = (menu: ResolvedMenu) =>
  menu.tablet.find((c) => !c.subcategories?.length && c.dishes.length > 0) ?? menu.tablet[0];
const subCategory = (menu: ResolvedMenu) => menu.tablet.find((c) => c.subcategories?.length) ?? menu.tablet[0];
const scheduledCategory = (menu: ResolvedMenu) =>
  menu.tablet.find((c) => !c.subcategories?.length && c.dishes.some((d) => d.schedule)) ?? plainCategory(menu);

/** A search that hits a few dishes in every theme: the first word of a dish on the second category. */
const searchWord = (menu: ResolvedMenu) => (menu.tablet[1] ?? menu.tablet[0])?.dishes[0]?.name.split(" ")[0] ?? "Tea";

/** The same menu with one category (and its subcategories) emptied. */
const emptyCategory = (menu: ResolvedMenu, id: string): ResolvedMenu => ({
  ...menu,
  tablet: menu.tablet.map((c): ResolvedTabletCategory =>
    c.id === id
      ? {
          ...c,
          dishIds: [],
          dishes: [],
          subcategories: c.subcategories?.map((s) => ({ ...s, dishIds: [], dishes: [] })),
        }
      : c,
  ),
});

/** The API answered with categories but no dishes in any of them. */
const emptyMenu = (menu: ResolvedMenu): ResolvedMenu => ({
  ...menu,
  dishes: [],
  byId: {},
  mobileDishes: [],
  tablet: menu.tablet.map((c) => ({
    ...c,
    dishIds: [],
    dishes: [],
    subcategories: c.subcategories?.map((s) => ({ ...s, dishIds: [], dishes: [] })),
  })),
});

/** A bucket with one of each line: plain ×2, a dish with modifiers, and a combo with a note. */
const filledCart = (menu: ResolvedMenu): CartLine[] => {
  const [a, b, c] = plainCategory(menu).dishes;
  const lines: CartLine[] = [];
  if (a) lines.push({ lineId: "ds-1", itemId: a.id, name: a.name, unitPrice: a.price, qty: 2 });
  if (b)
    lines.push({
      lineId: "ds-2",
      itemId: b.id,
      name: b.name,
      unitPrice: b.price + 4.5,
      qty: 1,
      modifiers: ["Pan-Fried", "Fried Egg ×2"],
      choices: [{ qty: 1, mods: [{ name: "Pan-Fried", qty: 1 }, { name: "Fried Egg", qty: 2 }] }],
    });
  if (c)
    lines.push({
      lineId: "ds-3",
      itemId: c.id,
      name: c.name,
      unitPrice: c.price + 6,
      qty: 1,
      notes: "Less spicy",
      choices: [
        { label: "Drink", name: "Latte", qty: 1, mods: [{ name: "Iced", qty: 1 }, { name: "Almond Milk", qty: 1 }], notes: "Less sweet" },
        { label: "Side", name: "Spring Roll", qty: 1, mods: [] },
      ],
    });
  return lines;
};

/* -------------------------------- page preview ------------------------------- */

/**
 * The real POS page on its own little sim: taps, bucket edits and category picks all work,
 * and nothing leaks into the prototype. Remount (change `key`) to start over.
 */
export function PosPagePreview({ menu, setup, size }: { menu: ResolvedMenu; setup: PageSetup; size: PageStory["size"] }) {
  const [state, dispatch] = useReducer(reduce, undefined, () => {
    const base = initialState("2.0");
    return {
      ...base,
      waiter: { ...base.waiter, openTableId: DEFAULT_TABLE_ID, cart: setup.cart ?? [], pos: setup.pos },
    };
  });
  return (
    <PosPreview.Provider value={{ state, dispatch, menu: setup.menu ?? menu, scheduleClock: setup.scheduleClock, ui: setup.ui }}>
      <div className="relative shrink-0 overflow-hidden" style={{ width: size.width, height: size.height }}>
        <PosOrderScreen />
      </div>
    </PosPreview.Provider>
  );
}

/* ----------------------------------- pages ---------------------------------- */

const mainPage: PageStory = {
  id: "main-page",
  name: "Main Page",
  group: "Native ordering",
  usage:
    "The POS order page the waiter opens from Add Order on Table Detail. Left: category grid, dish list and Pulse Dish Recommendation. Right: the order bucket. Every case below is the live page at 1280×800 and stays interactive.",
  placements: [["Native ordering", "Table Detail", "Add Order", "POS order page"]],
  figma: "2820:17259",
  size: { width: 1280, height: 800 },
  useCases: [
    { name: "Default, empty bucket", note: "Category grid with recommendations; Confirm Order disabled.", setup: () => ({}) },
    { name: "Default, bucket filled", note: "Plain line ×2, a line with modifiers and a combo with notes.", setup: (m) => ({ cart: filledCart(m) }) },
    {
      name: "Recommendations collapsed",
      note: "Recommendations hidden; the gold tile bottom-left brings them back.",
      setup: (m) => ({ cart: filledCart(m), ui: { showReco: false } }),
    },
    {
      name: "Category open",
      note: "Dish list under the grid. Recommendations auto-hide.",
      setup: (m) => ({ cart: filledCart(m), pos: { categoryId: plainCategory(m).id }, ui: { showReco: false } }),
    },
    {
      name: "Category open, scheduled dishes unavailable",
      note: "Dishes outside their merchant schedule are greyed with an info button.",
      setup: (m) => ({ pos: { categoryId: scheduledCategory(m).id }, ui: { showReco: false }, scheduleClock: "unavailable" }),
    },
    {
      name: "Schedule info open",
      note: "Info popover on a scheduled dish shows when it can be ordered.",
      setup: (m) => {
        const cat = scheduledCategory(m);
        return {
          pos: { categoryId: cat.id, scheduleDishId: cat.dishes.find((d) => d.schedule)?.id },
          ui: { showReco: false },
          scheduleClock: "unavailable",
        };
      },
    },
    {
      name: "Subcategory page",
      note: "A category with subcategories opens its own page; the first subcategory is picked.",
      setup: (m) => ({ cart: filledCart(m), pos: { categoryId: subCategory(m).id }, ui: { showReco: false } }),
    },
    {
      name: "Search results",
      note: "Header search swaps the grid for matching dishes across every category.",
      setup: (m) => ({ ui: { searching: true, query: searchWord(m), showReco: false } }),
    },
    {
      name: "Search, no results",
      note: "No dish matches the query.",
      setup: () => ({ ui: { searching: true, query: "Pizza", showReco: false } }),
    },
    {
      name: "No items from the API",
      note: "Menu data lists no dishes: grid and recommendations give way to “Item unavailable for now”.",
      setup: (m) => ({ menu: emptyMenu(m) }),
    },
    {
      name: "Category open, no items",
      note: "The open category came back empty; the bucket keeps its lines.",
      setup: (m) => {
        const id = plainCategory(m).id;
        return { menu: emptyCategory(m, id), cart: filledCart(m), pos: { categoryId: id }, ui: { showReco: false } };
      },
    },
    {
      name: "Subcategory, no items",
      note: "The picked subcategory came back empty.",
      setup: (m) => {
        const id = subCategory(m).id;
        return { menu: emptyCategory(m, id), pos: { categoryId: id }, ui: { showReco: false } };
      },
    },
  ],
};

/** Every page, in nav order. */
export const PAGES: PageStory[] = [mainPage];
