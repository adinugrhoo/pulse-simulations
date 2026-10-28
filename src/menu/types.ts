/**
 * Menu model shared by every device. One catalog of dishes, two category lists (the
 * customer's mobile menu and the waiter's POS group dishes differently).
 *
 * The catalog is layered: `config/global/menu.json` is the base, each phase's
 * `menu.json` patches it, and each theme's `menu.json` patches the phase. The Menu
 * Studio edits those same files.
 */

export type Dish = {
  id: string;
  name: string;
  price: number;
  /** Absolute path under /public, or a full URL. Unset renders a lettered tile. */
  image?: string;
  /** Long-form copy; only the dish-recommendation cards on the tablet render it. */
  description?: string;
  kcal?: number;
  /** Dietary/heat tags; the first one gets the icon, the rest collapse into "+N". */
  tags?: string[];
};

/** A section of the customer's "For You" menu (mobile). */
export type MobileCategory = {
  id: string;
  name: string;
  /** Short label under the category thumbnail; falls back to `name`. */
  label?: string;
  image?: string;
  dishIds: string[];
};

/** A coloured tab on the waiter POS (tablet). */
export type TabletCategory = {
  id: string;
  name: string;
  color: string;
  dishIds: string[];
  /**
   * Optional second level (Figma 3124:186): tapping the category opens its own page with
   * these tiles on top. Each one lists a subset of the category's `dishIds`; dishes not in
   * the category are ignored. Categories without it expand inline as before.
   */
  subcategories?: TabletSubcategory[];
};

export type TabletSubcategory = {
  id: string;
  name: string;
  color: string;
  dishIds: string[];
};

export type MenuDevice = "mobile" | "tablet";

export type CategoryFor<D extends MenuDevice> = D extends "mobile" ? MobileCategory : TabletCategory;

/** The base menu (global layer). */
export type MenuData = {
  dishes: Dish[];
  categories: { mobile: MobileCategory[]; tablet: TabletCategory[] };
};

/**
 * What a phase or theme changes on top of the layer below it. Every key is optional;
 * an empty object inherits everything.
 */
export type MenuPatch = {
  /** Field overrides for inherited dishes, keyed by dish id. */
  dishes?: Record<string, Partial<Omit<Dish, "id">>>;
  /** Dishes that only exist from this layer down. */
  added?: Dish[];
  /** Inherited dish ids hidden from this layer down. */
  removed?: string[];
  /** A device's category list, replaced wholesale when present. */
  categories?: { mobile?: MobileCategory[]; tablet?: TabletCategory[] };
};

/** Layer ids: "global", a phase ("2.0"), or a theme inside a phase ("2.0/dark"). */
export type LayerId = "global" | `${string}` | `${string}/${string}`;

export type ResolvedCategory<D extends MenuDevice> = Omit<CategoryFor<D>, "dishIds"> & {
  dishIds: string[];
  dishes: Dish[];
};

export type ResolvedSubcategory = TabletSubcategory & { dishes: Dish[] };

export type ResolvedTabletCategory = Omit<ResolvedCategory<"tablet">, "subcategories"> & {
  subcategories?: ResolvedSubcategory[];
};

/** The menu a device actually renders for one phase + theme. */
export type ResolvedMenu = {
  dishes: Dish[];
  byId: Record<string, Dish>;
  mobile: ResolvedCategory<"mobile">[];
  tablet: ResolvedTabletCategory[];
  /** Dishes on the customer's menu, in category order: the "catalog" the upsell strips and seeds draw from. */
  mobileDishes: Dish[];
};
