export type CatalogDish = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  /** Long-form copy — only the dish-recommendation cards on the tablet render it. */
  description?: string;
  kcal?: number;
  /** Dietary/heat tags; the first one gets the icon, the rest collapse into "+N". */
  tags?: string[];
};

/**
 * Real menu content shown on the mobile "For You" home screen
 * (src/devices/mobile/screens/MenuScreen.tsx). Cart/upsell/recommendation
 * strips elsewhere in the sim pull from this same list so every screen
 * quotes the same names, prices, and photos — nothing is screen-specific mock data.
 */
export const MENU_CATALOG: CatalogDish[] = [
  {
    id: "d1",
    name: "Steamed Mushroom and Truffle Dumpling",
    price: 12.4,
    image: "dish-1.png",
    category: "Popular Recommendations",
    description: "Shiitake, king oyster and black truffle paste folded into a translucent wheat-starch skin.",
    kcal: 110,
  },
  {
    id: "d2",
    name: "Crispy Rice Roll with BBQ Pork Filling",
    price: 16.4,
    image: "dish-2.png",
    category: "Popular Recommendations",
    description: "Char siu wrapped in silky rice noodle and deep-fried for a shattering crust.",
    kcal: 240,
    tags: ["Spicy", "Contains Pork", "Chef's Pick", "Gluten"],
  },
  {
    id: "d3",
    name: "Har Gow Crystal Shrimp Dumpling",
    price: 12.8,
    image: "dish-3.png",
    category: "Popular Recommendations",
    description: "Whole tiger prawns and bamboo shoot in a hand-pleated crystal skin.",
    kcal: 90,
  },
  {
    id: "d4",
    name: "Golden Salted Egg Yolk Bun",
    price: 11.4,
    image: "dish-4.png",
    category: "Popular Recommendations",
    description: "Steamed milk bun with a molten salted duck-egg custard centre.",
    kcal: 180,
  },
  {
    id: "d5",
    name: "Siew Mai Pork and Shrimp Dumpling",
    price: 10.8,
    image: "dish-5.png",
    category: "Steamed Dim Sum",
    description: "Minced pork and shrimp topped with tobiko, steamed in an open wrapper.",
    kcal: 120,
  },
  {
    id: "d6",
    name: "Century Egg Congee with Century Egg",
    price: 9.4,
    image: "dish-1.png",
    category: "Steamed Dim Sum",
    description: "Slow-simmered rice porridge with century egg and shredded young ginger.",
    kcal: 150,
  },
  {
    id: "d7",
    name: "Pan-Fried Radish Cake",
    price: 8.9,
    image: "dish-2.png",
    category: "Fried and Baked Dumplings",
    description: "Shredded daikon and cured sausage cake, seared until golden at the edges.",
    kcal: 200,
    tags: ["Spicy", "Contains Pork"],
  },
  {
    id: "d8",
    name: "Deep Fried Beancurd Skin Roll",
    price: 9.9,
    image: "dish-3.png",
    category: "Fried and Baked Dumplings",
    description: "Beancurd skin rolled around pork and water chestnut, fried crisp.",
    kcal: 210,
  },
];

export const CATEGORIES = [
  { id: "popular", label: "Popular Recomm...", thumb: "cat-1.png", category: "Popular Recommendations" },
  { id: "dimsum", label: "Steamed Dim Sum", thumb: "cat-2.png", category: "Steamed Dim Sum" },
  { id: "fried", label: "Fried and Baked D...", thumb: "cat-3.png", category: "Fried and Baked Dumplings" },
  { id: "rice", label: "Rice Roll", thumb: "cat-4.png", category: "Rice Roll" },
  { id: "dessert", label: "Dessert", thumb: "cat-5.jpg", category: "Dessert" },
] as const;

export const dishImageUrl = (image: string) => (image.startsWith("/") ? image : `/figma/mobile-menu/${image}`);
