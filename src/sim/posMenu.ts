import { MENU_CATALOG, type CatalogDish } from "./menuCatalog";

/**
 * Waiter POS menu (Figma 2881:118): 12 categories, five dishes each (Appetizers carries fifteen). Dishes that already
 * exist on the mobile menu are reused by id, so they keep the same name, price, photo and
 * combo behaviour. New dishes only get a photo when one of the shared photos genuinely
 * depicts them; the rest render a lettered tile instead of a mismatched picture.
 */
const base = (id: string) => MENU_CATALOG.find((d) => d.id === id)!;

const MILK_GLASS = "/figma/tablet-pos/milk-glass.jpg";

const fresh = (id: string, name: string, price: number, image = ""): Omit<CatalogDish, "category"> => ({
  id,
  name,
  price,
  image,
});

type Entry = string | Omit<CatalogDish, "category">;

const POS_CATEGORY_DEFS: { name: string; color: string; dishes: Entry[] }[] = [
  {
    name: "Appetizers",
    color: "#6334af",
    dishes: [
      "d8",
      fresh("p-cucumber", "Smacked Cucumber Salad", 6.8),
      fresh("p-jellyfish", "Chilled Jellyfish with Sesame", 12.8),
      fresh("p-edamame", "Edamame with Sea Salt", 5.8),
      fresh("p-squid", "Salt and Pepper Squid", 14.8),
      fresh("p-spring-roll", "Crispy Vegetable Spring Rolls", 7.8),
      fresh("p-wonton-fried", "Crispy Fried Wontons", 8.8),
      fresh("p-century-egg", "Century Egg with Pickled Ginger", 7.4),
      fresh("p-drunken-chicken", "Drunken Chicken", 11.8),
      fresh("p-pork-ribs", "Sweet and Sour Pork Ribs", 15.8),
      fresh("p-tofu-cold", "Cold Silken Tofu with Spring Onion", 6.8),
      fresh("p-prawn-toast", "Golden Prawn Toast", 12.8),
      fresh("p-lotus-chips", "Crispy Lotus Root Chips", 6.4),
      fresh("p-peanuts", "Chilli Oil Peanuts", 4.8),
      fresh("p-pork-jelly", "Marinated Pork Knuckle", 13.8),
    ],
  },
  {
    name: "Classic Wok Dishes",
    color: "#285ca8",
    dishes: [
      fresh("p-mushroom-chicken", "Wok-fried Chicken with Mushrooms and Asparagus", 22.8, "dish-4.png"),
      fresh("p-kungpao", "Kung Pao Chicken", 18.8, "dish-4.png"),
      fresh("p-sweet-sour", "Sweet and Sour Pork", 19.8, "dish-4.png"),
      fresh("p-beef-pepper", "Black Pepper Beef", 24.8, "dish-4.png"),
      fresh("p-kangkong", "Sambal Kangkong", 14.8),
    ],
  },
  {
    name: "Rice & Noodles",
    color: "#226b50",
    dishes: [
      fresh("p-yangzhou", "Yangzhou Fried Rice", 16.8),
      fresh("p-hor-fun", "Beef Hor Fun", 17.8),
      fresh("p-saltfish-rice", "Salted Fish Chicken Fried Rice", 16.8),
      fresh("p-hokkien", "Hokkien Fried Noodles", 16.8),
      fresh("p-singapore-noodle", "Singapore Fried Vermicelli", 15.8),
    ],
  },
  {
    name: "Desserts",
    color: "#98501e",
    dishes: [
      "d4",
      fresh("p-mango-sago", "Mango Pomelo Sago", 7.8),
      fresh("p-peach-gum", "Double-boiled Peach Gum", 8.8, "dish-3.png"),
      fresh("p-egg-tart", "Baked Egg Tart", 6.8),
      fresh("p-sesame-ball", "Black Sesame Glutinous Rice Balls", 7.8),
    ],
  },
  {
    name: "Beverages",
    color: "#a33d40",
    dishes: [
      fresh("p-hot-tea", "Hot Chinese Tea", 3.5),
      fresh("p-lemon-tea", "Iced Lemon Tea", 4.5),
      fresh("p-soy-milk", "Fresh Soy Milk", 4, MILK_GLASS),
      fresh("p-chrysanthemum", "Chrysanthemum Tea", 4),
      fresh("p-coke", "Coca-Cola", 3.5),
    ],
  },
  {
    name: "Set Menu",
    color: "#7050aa",
    dishes: [
      fresh("p-set-dimsum2", "Dim Sum Set for Two", 38.8, "dish-1.png"),
      fresh("p-set-family", "Family Feast Set (4 pax)", 128),
      fresh("p-set-lunch-a", "Lunch Set A", 22.8),
      fresh("p-set-lunch-b", "Lunch Set B", 24.8),
      fresh("p-set-veg", "Vegetarian Set", 32.8),
    ],
  },
  {
    name: "Top 8 Best Dishes",
    color: "#227488",
    dishes: ["d1", "d2", "d3", "d4", "d5"],
  },
  {
    name: "Steamed Dim Sum",
    color: "#3b7138",
    dishes: [
      "d5",
      "d3",
      "d1",
      fresh("p-chicken-feet", "Chicken Feet in Black Bean Sauce", 8.8),
      fresh("p-beef-ball", "Steamed Beef Meatball", 8.4),
    ],
  },
  {
    name: "Fried & Baked Dim Sum",
    color: "#87611e",
    dishes: [
      "d7",
      "d8",
      fresh("p-bbq-bun", "Baked BBQ Pork Bun", 9.2),
      fresh("p-taro", "Fried Taro Dumpling", 9.4),
      fresh("p-potsticker", "Pan-fried Pork Dumplings", 9.8),
    ],
  },
  {
    name: "Rice Rolls",
    color: "#a13771",
    dishes: [
      "d2",
      fresh("p-roll-prawn", "Prawn Rice Roll", 12.8, "dish-2.png"),
      fresh("p-roll-char-siu", "BBQ Pork Rice Roll", 11.8, "dish-2.png"),
      fresh("p-roll-beef", "Beef Rice Roll with Coriander", 12.4, "dish-2.png"),
      fresh("p-roll-plain", "Plain Rice Roll with Sweet Sauce", 7.8, "dish-2.png"),
    ],
  },
  {
    name: "Congee",
    color: "#4b4da8",
    dishes: [
      "d6",
      fresh("p-congee-fish", "Fish Slice Congee", 10.8),
      fresh("p-congee-chicken", "Chicken and Ginger Congee", 9.8),
      fresh("p-congee-abalone", "Abalone Congee", 22.8),
      fresh("p-congee-plain", "Plain Congee with Youtiao", 6.8),
    ],
  },
  {
    name: "Noodles",
    color: "#216f69",
    dishes: [
      fresh("p-wonton-noodle", "Wonton Noodle Soup", 11.8),
      fresh("p-dandan", "Dan Dan Noodles", 12.8),
      fresh("p-brisket-noodle", "Beef Brisket Noodles", 14.8),
      fresh("p-efu", "E-fu Noodles with Mushrooms", 16.8),
      fresh("p-sesame-noodle", "Cold Sesame Noodles", 10.8),
    ],
  },
];

export type PosCategory = { name: string; color: string; dishes: CatalogDish[] };

export const POS_MENU: PosCategory[] = POS_CATEGORY_DEFS.map((c) => ({
  name: c.name,
  color: c.color,
  dishes: c.dishes.map((d) => (typeof d === "string" ? base(d) : { ...d, category: c.name })),
}));
