import type {
  Dish,
  MenuData,
  MenuDevice,
  MenuPatch,
  MobileCategory,
  ResolvedCategory,
  ResolvedMenu,
  ResolvedTabletCategory,
  TabletCategory,
} from "./types";

/** One layer on top of the menu below it. Pure: the inputs are never mutated. */
export const applyPatch = (base: MenuData, patch: MenuPatch): MenuData => {
  const removed = new Set(patch.removed ?? []);
  const added = new Map((patch.added ?? []).map((d) => [d.id, d]));

  const dishes = base.dishes
    .filter((d) => !removed.has(d.id) && !added.has(d.id))
    .map((d) => (patch.dishes?.[d.id] ? { ...d, ...patch.dishes[d.id] } : d));
  // an added dish can still be patched on the same layer (the studio edits it there)
  for (const d of added.values()) {
    if (!removed.has(d.id)) dishes.push(patch.dishes?.[d.id] ? { ...d, ...patch.dishes[d.id] } : d);
  }

  return {
    dishes,
    categories: {
      mobile: patch.categories?.mobile ?? base.categories.mobile,
      tablet: patch.categories?.tablet ?? base.categories.tablet,
    },
  };
};

/** Stack patches in order: global data, then phase, then theme. */
export const composeMenu = (base: MenuData, patches: MenuPatch[]): MenuData => patches.reduce(applyPatch, base);

const resolveCategories = <C extends MobileCategory | TabletCategory, D extends MenuDevice>(
  categories: C[],
  byId: Record<string, Dish>,
) =>
  categories.map((c) => {
    // a category can still list a dish a lower layer removed; drop it rather than crash
    const dishIds = c.dishIds.filter((id) => byId[id]);
    return { ...c, dishIds, dishes: dishIds.map((id) => byId[id]) } as unknown as ResolvedCategory<D>;
  });

export const resolveMenu = (data: MenuData): ResolvedMenu => {
  const byId = Object.fromEntries(data.dishes.map((d) => [d.id, d]));
  const mobile = resolveCategories<MobileCategory, "mobile">(data.categories.mobile, byId);
  const tablet: ResolvedTabletCategory[] = resolveCategories<TabletCategory, "tablet">(data.categories.tablet, byId).map(
    (c) => {
      if (!c.subcategories) return c as ResolvedTabletCategory;
      // a subcategory only shows dishes its category still lists
      const inCategory = new Set(c.dishIds);
      const subcategories = c.subcategories.map((s) => {
        const dishIds = s.dishIds.filter((id) => inCategory.has(id));
        return { ...s, dishIds, dishes: dishIds.map((id) => byId[id]) };
      });
      return { ...c, subcategories };
    },
  );
  const seen = new Set<string>();
  const mobileDishes = mobile
    .flatMap((c) => c.dishes)
    .filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
  return { dishes: data.dishes, byId, mobile, tablet, mobileDishes };
};

/** Absolute /public path or URL for a dish or category photo. */
export const imageUrl = (image: string) =>
  image.startsWith("//") ? `https:${image}` : /^(https?:|data:|\/)/.test(image) ? image : `/${image}`;

/** Committed /public assets the image optimiser can serve: a plain path, no query string, not an upload. */
export const isOptimisable = (url: string) =>
  url.startsWith("/") && !url.startsWith("//") && !url.includes("?") && !url.startsWith("/uploads/");

/** What the studio accepts as a photo: a /public path, an http(s) URL, or an uploaded data URL. */
export const isImageRef = (v: string) =>
  v === "" || /^\/(?!\/)[^\s?#]*$/.test(v) || /^https?:\/\/[^\s]+$/.test(v) || /^data:image\/(png|jpeg|webp|gif);base64,/.test(v);
