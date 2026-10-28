/**
 * Shape checks for menu layers coming from outside the type system: the studio's save
 * request and imported JSON. Returns the first problem found, or null.
 */

import { isImageRef } from "./resolve";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown) => typeof v === "string";
const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isStrArr = (v: unknown) => Array.isArray(v) && v.every(isStr);

const DISH_FIELDS: Record<string, (v: unknown) => boolean> = {
  name: isStr,
  price: (v) => isNum(v) && (v as number) >= 0,
  image: (v) => isStr(v) && isImageRef(v as string),
  description: isStr,
  kcal: isNum,
  tags: isStrArr,
};

const checkDishFields = (d: Obj, where: string): string | null => {
  for (const [k, v] of Object.entries(d)) {
    const check = DISH_FIELDS[k];
    if (!check) return `${where}: unknown field "${k}"`;
    if (!check(v)) return `${where}: bad value for "${k}"`;
  }
  return null;
};

/** First id that appears twice, as an error. */
const dupe = (ids: string[], where: string): string | null => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) return `${where}: duplicate id "${id}"`;
    seen.add(id);
  }
  return null;
};

const checkDish = (d: unknown, where: string): string | null => {
  if (!isObj(d)) return `${where}: not an object`;
  if (!isStr(d.id) || !d.id) return `${where}: missing id`;
  if (!isStr(d.name)) return `${where}: missing name`;
  if (!isNum(d.price)) return `${where}: missing price`;
  return checkDishFields(Object.fromEntries(Object.entries(d).filter(([k]) => k !== "id")), where);
};

const checkCategories = (list: unknown, device: "mobile" | "tablet", where: string): string | null => {
  if (!Array.isArray(list)) return `${where}: not a list`;
  for (const [i, c] of list.entries()) {
    const at = `${where}[${i}]`;
    if (!isObj(c) || !isStr(c.id) || !isStr(c.name) || !isStrArr(c.dishIds)) return `${at}: needs id, name, dishIds`;
    if (device === "tablet" && !isStr(c.color)) return `${at}: needs a color`;
    if (device === "tablet" && c.subcategories !== undefined) {
      if (!Array.isArray(c.subcategories)) return `${at}.subcategories: not a list`;
      for (const [j, s] of c.subcategories.entries()) {
        if (!isObj(s) || !isStr(s.id) || !isStr(s.name) || !isStr(s.color) || !isStrArr(s.dishIds))
          return `${at}.subcategories[${j}]: needs id, name, color, dishIds`;
      }
      const err = dupe(c.subcategories.map((s) => (s as Obj).id as string), `${at}.subcategories`);
      if (err) return err;
    }
    if (
      device === "mobile" &&
      ((c.label !== undefined && !isStr(c.label)) || (c.image !== undefined && !(isStr(c.image) && isImageRef(c.image))))
    )
      return `${at}: bad label or image`;
  }
  return dupe(list.map((c) => (c as Obj).id as string), where);
};

export const checkMenuData = (v: unknown): string | null => {
  if (!isObj(v)) return "menu: not an object";
  if (!Array.isArray(v.dishes)) return "menu.dishes: not a list";
  for (const [i, d] of v.dishes.entries()) {
    const err = checkDish(d, `dishes[${i}]`);
    if (err) return err;
  }
  const dupeDish = dupe(v.dishes.map((d) => (d as Obj).id as string), "dishes");
  if (dupeDish) return dupeDish;
  if (!isObj(v.categories)) return "menu.categories: missing";
  return (
    checkCategories(v.categories.mobile, "mobile", "categories.mobile") ??
    checkCategories(v.categories.tablet, "tablet", "categories.tablet")
  );
};

export const checkMenuPatch = (v: unknown): string | null => {
  if (!isObj(v)) return "patch: not an object";
  for (const k of Object.keys(v)) {
    if (!["dishes", "added", "removed", "categories"].includes(k)) return `patch: unknown key "${k}"`;
  }
  if (v.dishes !== undefined) {
    if (!isObj(v.dishes)) return "patch.dishes: not an object";
    for (const [id, d] of Object.entries(v.dishes)) {
      if (!isObj(d)) return `patch.dishes.${id}: not an object`;
      const err = checkDishFields(d, `patch.dishes.${id}`);
      if (err) return err;
    }
  }
  if (v.added !== undefined) {
    if (!Array.isArray(v.added)) return "patch.added: not a list";
    for (const [i, d] of v.added.entries()) {
      const err = checkDish(d, `patch.added[${i}]`);
      if (err) return err;
    }
    const dupeAdded = dupe(v.added.map((d) => (d as Obj).id as string), "patch.added");
    if (dupeAdded) return dupeAdded;
  }
  if (v.removed !== undefined && !isStrArr(v.removed)) return "patch.removed: not a list of ids";
  if (v.categories !== undefined) {
    if (!isObj(v.categories)) return "patch.categories: not an object";
    if (v.categories.mobile !== undefined) {
      const err = checkCategories(v.categories.mobile, "mobile", "patch.categories.mobile");
      if (err) return err;
    }
    if (v.categories.tablet !== undefined) {
      const err = checkCategories(v.categories.tablet, "tablet", "patch.categories.tablet");
      if (err) return err;
    }
  }
  return null;
};

export const checkLayer = (key: string, v: unknown): string | null =>
  key === "global" ? checkMenuData(v) : checkMenuPatch(v);

