import { MENU_CATALOG, dishImageUrl, type CatalogDish } from "./menuCatalog";

/**
 * Combo customisation for the waiter POS (Figma 2824:18166, "Combo Meal"). A combo dish
 * has required groups the waiter must fill (Drink, Main) before it can go in the bucket.
 * The sim has no modifier backend, so the groups and add-on prices live here.
 */
export type ModifierOption = {
  id: string;
  name: string;
  /** Add-on price on top of the dish's own price. */
  price: number;
  /** Photo for card-style options, served from /public. */
  image?: string;
  /** Picking this option opens a second-level modifier sheet (e.g. Latte -> variant + milk). */
  customisation?: Customisation;
};

export type ModifierGroup = {
  id: string;
  label: string;
  /** Fills "Select ___ Option" / the heading above card-style options. */
  heading: string;
  options: ModifierOption[];
  /** "tiles" are the coloured squares at the top; "cards" are the wide rows (photo optional); "plain" are the small
   *  name-only cards; "hidden" has no picker at all, it only shows in the summary (a preset variant). */
  layout?: "tiles" | "cards" | "plain" | "hidden";
  /** Several options may be picked at once (add-ons). */
  multiple?: boolean;
  /** Tiles quote the full price, cards quote "+SGD" on top of it. Groups without one show no price. */
  priceStyle?: "full" | "addon";
  /** Optional groups never block Save Modifier and carry no Required / Fulfilled status. */
  optional?: boolean;
  /** The group only exists while another group has this option picked (e.g. ice level only for Iced). */
  showWhen?: { groupId: string; optionId: string };
  /** Picked automatically when the group appears. */
  defaultOptionId?: string;
  /** How a pick reads in the saved summary; defaults to the option name ("Normal" -> "Ice level normal"). */
  detail?: (option: ModifierOption) => string;
};

/** Figma 2824:18077: the full-screen sheet that slides up over the combo page. */
export type Customisation = {
  title: string;
  groups: ModifierGroup[];
};

const MILK = "/figma/tablet-pos";
const LATTE: Customisation = {
  title: "Latte",
  groups: [
    {
      id: "variant",
      label: "Variant",
      heading: "Variant",
      layout: "tiles",
      priceStyle: "full",
      options: [
        { id: "hot", name: "Hot", price: 5 },
        { id: "iced", name: "Iced", price: 5 },
      ],
    },
    {
      id: "milk",
      label: "Milk",
      heading: "Choice of milk",
      layout: "cards",
      priceStyle: "addon",
      options: [
        { id: "full-cream", name: "Full Cream Milk", price: 0, image: `${MILK}/milk-glass.jpg` },
        { id: "skim", name: "Skim Milk", price: 0, image: `${MILK}/milk-oat.png` },
        { id: "low-fat", name: "Low Fat Milk", price: 0, image: `${MILK}/milk-glass.jpg` },
        { id: "oat", name: "Oat Milk", price: 1, image: `${MILK}/milk-oat.png` },
        { id: "almond", name: "Almond Milk", price: 1, image: `${MILK}/milk-almond.png` },
        { id: "soy", name: "Soy Milk", price: 1, image: `${MILK}/milk-soy.png` },
      ],
    },
    {
      id: "ice",
      label: "Ice level",
      heading: "Ice level",
      layout: "plain",
      optional: true,
      showWhen: { groupId: "variant", optionId: "iced" },
      defaultOptionId: "normal",
      detail: (o) => `Ice level ${o.name.toLowerCase()}`,
      options: [
        { id: "less", name: "Less", price: 0 },
        { id: "normal", name: "Normal", price: 0 },
        { id: "extra", name: "Extra", price: 0 },
      ],
    },
  ],
};

const DRINK: ModifierGroup = {
  id: "drink",
  label: "Drink",
  heading: "Drinks",
  options: [
    { id: "latte", name: "Latte", price: 5, customisation: LATTE },
    { id: "narcissist-bomb", name: "Narcissist Bomb • Regular", price: 7 },
    { id: "chinese-tea", name: "Hot Chinese Tea", price: 3 },
  ],
};

/**
 * Figma 2855:334: picking a main opens its own sheet. The variant is preset (and only
 * shows in the summary), the preparation is required, the chef's additions are optional.
 */
const mainCustomisation = (dish: CatalogDish, price: number): Customisation => ({
  title: dish.name,
  groups: [
    {
      id: "variant",
      label: "Variant",
      heading: "Variant",
      layout: "hidden",
      priceStyle: "full",
      defaultOptionId: "regular",
      options: [{ id: "regular", name: "Regular", price }],
    },
    {
      id: "preparation",
      label: "Preparation",
      heading: "Preparation",
      layout: "cards",
      priceStyle: "addon",
      options: [
        { id: "steamed", name: "Steamed", price: 0 },
        { id: "pan-fried", name: "Pan-Fried", price: 2.5 },
        { id: "deep-fried", name: "Deep-Fried", price: 2.5 },
      ],
    },
    {
      id: "additions",
      label: "Chef\u2019s Adds",
      heading: "Chef\u2019s Additions",
      layout: "cards",
      priceStyle: "addon",
      multiple: true,
      optional: true,
      options: [
        { id: "fried-egg", name: "Fried Egg", price: 2.5 },
        { id: "chilli-oil", name: "Chilli Oil", price: 1 },
        { id: "xo-sauce", name: "XO Sauce", price: 3 },
      ],
    },
  ],
});

const MAIN: ModifierGroup = {
  id: "main",
  label: "Main",
  heading: "Main",
  options: ["d1", "d3", "d2"].map((id) => {
    const dish = MENU_CATALOG.find((d) => d.id === id)!;
    const price = Math.round(dish.price * 0.4 * 2) / 2;
    return {
      id: dish.id,
      name: dish.name,
      price,
      image: dishImageUrl(dish.image),
      customisation: mainCustomisation(dish, price),
    };
  }),
};

/**
 * Dishes with their own single-level modifier sheet (no combo page): a required sauce
 * pick and optional stackable extras, same shape as the Chef's Additions on a main.
 */
const STANDALONE: Record<string, Customisation> = {
  d2: {
    title: "Crispy Rice Roll with BBQ Pork Filling",
    groups: [
      {
        id: "sauce",
        label: "Sauce",
        heading: "Sauce",
        layout: "plain",
        options: [
          { id: "light-soy", name: "Light Soy", price: 0 },
          { id: "sweet-soy", name: "Sweet Soy", price: 0 },
          { id: "hoisin", name: "Hoisin", price: 0 },
        ],
      },
      {
        id: "extras",
        label: "Extras",
        heading: "Extras",
        layout: "cards",
        priceStyle: "addon",
        multiple: true,
        optional: true,
        options: [
          { id: "extra-pork", name: "Extra BBQ Pork", price: 4 },
          { id: "crispy-shallots", name: "Crispy Shallots", price: 1.5 },
          { id: "chilli-oil", name: "Chilli Oil", price: 1 },
        ],
      },
    ],
  },
  d3: {
    title: "Har Gow Crystal Shrimp Dumpling",
    groups: [
      {
        id: "preparation",
        label: "Preparation",
        heading: "Preparation",
        layout: "plain",
        defaultOptionId: "steamed",
        options: [
          { id: "steamed", name: "Steamed", price: 0 },
          { id: "pan-fried", name: "Pan-Fried", price: 0 },
        ],
      },
      {
        id: "dips",
        label: "Dips",
        heading: "Dips",
        layout: "cards",
        priceStyle: "addon",
        multiple: true,
        optional: true,
        options: [
          { id: "chilli-oil", name: "Chilli Oil", price: 1 },
          { id: "xo-sauce", name: "XO Sauce", price: 3 },
          { id: "black-vinegar", name: "Black Vinegar", price: 0.5 },
        ],
      },
    ],
  },
};

export const standaloneCustomisationFor = (dish: CatalogDish): Customisation | undefined => STANDALONE[dish.id];

/** Dishes sold as combos: the two non-"Popular" categories. */
const COMBO_DISH_IDS = new Set(["d5", "d6", "d7", "d8"]);

export const modifierGroupsFor = (dish: CatalogDish): ModifierGroup[] | undefined =>
  COMBO_DISH_IDS.has(dish.id) ? [DRINK, MAIN] : undefined;
