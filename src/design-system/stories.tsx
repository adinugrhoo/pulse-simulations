"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ModifierOption } from "@/config/global/modifiers";
import type { CartChoice, CartLine } from "@/engine/types";
import { formatUnavailable, scheduleState, type ScheduleRule } from "@/menu/schedule";
import type { Dish } from "@/menu/types";
import {
  ActionButton,
  BucketLine,
  DishCard,
  DishRowCard,
  EmptyState,
  OptionCard,
  NoteDialog,
  PhotoOptionCard,
  SummaryCard,
  sgd,
  usePosTheme,
  type Availability,
  type SummaryPill,
} from "@/screens/tablet/pos/items";
import type { Args, Control } from "./controls";

export type StoryContext = {
  /** Dishes on the Phase 2 POS for the theme being previewed. */
  dishes: Dish[];
  /** Interactions write back into the controls, so the panel always shows the live state. */
  set: (patch: Args) => void;
};

export type UseCase = {
  name: string;
  note: string;
  /** Needs room under the component (an open popover). */
  tall?: boolean;
  /** Needs a proposed prop, so the live POS can't reach it yet. */
  proposed?: boolean;
  args: Args;
};

export type Story = {
  id: string;
  name: string;
  group: string;
  /** What it does and when it shows. */
  usage: string;
  /** Where it sits in native ordering: one path per place, product first ("Native ordering", page, area). */
  placements: string[][];
  figma?: string;
  /** Follows the theme's POS tokens; the rest are hard-coded dark in the code today. */
  themed: boolean;
  /** Background the component sits on in the POS. */
  surface: "page" | "bucket" | "dark";
  controls: Control[];
  defaults: Args;
  useCases: UseCase[];
  render: (args: Args, ctx: StoryContext) => ReactNode;
};

/* ------------------------------ shared fixtures ----------------------------- */

const LONG_SUFFIX = " with Truffle Mushroom Sauce and Garden Salad";
const TAG_SETS: Record<string, string[]> = {
  none: [],
  one: ["Vegetarian"],
  many: ["Spicy", "Vegetarian", "Halal"],
};

const dishControls = (dishes: Dish[]): Control[] => [
  {
    key: "dishId",
    label: "Dish",
    type: "select",
    options: dishes.slice(0, 16).map((d) => ({ value: d.id, label: d.name })),
  },
  { key: "noPhoto", label: "No photo", type: "toggle", hint: "Dish without an image shows the no-image placeholder." },
  { key: "longName", label: "Long name", type: "toggle", hint: "Checks truncation and wrapping." },
];

const pickDish = (args: Args, dishes: Dish[]): Dish => {
  const base = dishes.find((d) => d.id === args.dishId) ?? dishes[0];
  return {
    ...base,
    name: args.longName ? base.name + LONG_SUFFIX : base.name,
    image: args.noPhoto ? undefined : base.image,
    tags: TAG_SETS[String(args.tags ?? "none")],
  };
};

/** Merchant-dashboard (TBD) rules: the example from the ticket and the dated one from the dashboard. */
const SCHEDULES: Record<string, ScheduleRule> = {
  weekly: { days: ["mon", "tue", "wed", "thu", "sat"], times: [{ from: "02:10", to: "22:00" }] },
  dated: {
    days: ["mon", "tue", "wed", "thu", "fri"],
    times: [
      { from: "00:00", to: "05:00" },
      { from: "20:15", to: "22:00" },
    ],
    dates: [
      { from: "2026-11-01", to: "2026-11-30" },
      { from: "2026-12-08", to: "2026-12-20" },
    ],
  },
  overnight: { days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], times: [{ from: "22:00", to: "06:00" }] },
  weekend: { days: ["sat", "sun"], times: [{ from: "00:00", to: "00:00" }] },
  closure: {
    days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    times: [{ from: "00:00", to: "00:00" }],
    dates: [{ from: "2026-12-08", to: "2026-12-20" }],
  },
};

/** Fixed clocks so labels don't drift with the real time. */
const CLOCKS: Record<string, { label: string; at: string }> = {
  tueNoon: { label: "Tue 10 Nov, 12:00", at: "2026-11-10T12:00" },
  tueLate: { label: "Tue 10 Nov, 23:00", at: "2026-11-10T23:00" },
  satNoon: { label: "Sat 14 Nov, 12:00", at: "2026-11-14T12:00" },
};

const scheduleControl: Control = {
  key: "schedule",
  label: "Unavailable by schedule (TBD)",
  type: "select",
  hint: "Merchant time-based display rule. The card says when it's back; a tap shows the full schedule.",
  options: [
    { value: "off", label: "No schedule" },
    ...Object.keys(SCHEDULES).map((k) => ({ value: k, label: formatUnavailable(SCHEDULES[k]) })),
  ],
};

const scheduleOn = (a: Args) => Boolean(a.schedule) && a.schedule !== "off";

const scheduleControls: Control[] = [
  scheduleControl,
  {
    key: "clock",
    label: "Clock",
    type: "select",
    hint: "Labels count from this moment. The card always shows blocked, as of the next window.",
    options: Object.entries(CLOCKS).map(([value, c]) => ({ value, label: c.label })),
    when: scheduleOn,
  },
  { key: "infoOpen", label: "Schedule detail open", type: "toggle", hint: "What a tap on the card opens.", when: scheduleOn },
];

const scheduleDefaults: Args = { schedule: "off", clock: "tueNoon", infoOpen: false };

const scheduleProps = (args: Args, set: (patch: Args) => void) => ({
  unavailable: scheduleOn(args)
    ? scheduleState(SCHEDULES[String(args.schedule)], new Date(CLOCKS[String(args.clock)]?.at ?? CLOCKS.tueNoon.at), true)
    : undefined,
  infoOpen: Boolean(args.infoOpen),
  onInfoOpenChange: (open: boolean) => set({ infoOpen: open }),
  // previews are clipped boxes: always open downward, where they leave room
  infoPlacement: "below" as const,
});

const scheduleCases: UseCase[] = [
  {
    name: "Unavailable, back today",
    note: `Rule "${formatUnavailable(SCHEDULES.weekly)}" at Tue 12:00.`,
    args: { schedule: "weekly" },
  },
  {
    name: "Unavailable, back tomorrow",
    note: `Rule "${formatUnavailable(SCHEDULES.overnight)}" at Tue 23:00.`,
    args: { schedule: "overnight", clock: "tueLate" },
  },
  {
    name: "Unavailable, back another day",
    note: `Rule "${formatUnavailable(SCHEDULES.weekend)}" at Sat 12:00: weekday and time.`,
    args: { schedule: "weekend", clock: "satNoon" },
  },
  {
    name: "Unavailable for weeks",
    note: `Date closure "${formatUnavailable(SCHEDULES.closure)}": date only.`,
    args: { schedule: "closure" },
  },
  {
    name: "Schedule detail (tap)",
    note: "No hover on the tablet: tapping the card opens the full rule. Tap outside to close.",
    tall: true,
    args: { schedule: "weekly", infoOpen: true },
  },
  {
    name: "Schedule detail, date ranges",
    note: "Long dashboard rule, split into Dates, Days and Time rows.",
    tall: true,
    args: { schedule: "dated", clock: "tueLate", infoOpen: true },
  },
  {
    name: "Unavailable, no photo",
    note: "Placeholder dims with the rest of the card.",
    args: { schedule: "weekly", noPhoto: true },
  },
  {
    name: "Unavailable, already in bucket",
    note: "Added before the window started: the count stays, new adds are blocked.",
    args: { schedule: "overnight", clock: "tueLate", inBucket: 1 },
  },
];

/** Live: the merchant marks a dish sold out in the menu (`Dish.soldOut`). */
const soldOutControl: Control = {
  key: "soldOut",
  label: "Sold out",
  type: "toggle",
  hint: "Greyed, Sold out chip, can't be tapped or added.",
};

const proposedDishControls: Control[] = [
  {
    key: "availability",
    label: "Stock",
    type: "segment",
    proposed: true,
    options: [
      { value: "available", label: "Available" },
      { value: "low", label: "Low stock" },
    ],
  },
  {
    key: "stockLeft",
    label: "Portions left",
    type: "number",
    min: 1,
    max: 9,
    proposed: true,
    when: (a) => a.availability === "low",
  },
  { key: "promo", label: "Promo price (20% off)", type: "toggle", proposed: true },
  {
    key: "tags",
    label: "Dietary tags",
    type: "segment",
    proposed: true,
    options: [
      { value: "none", label: "None" },
      { value: "one", label: "1 tag" },
      { value: "many", label: "3 tags" },
    ],
  },
  {
    key: "customisable",
    label: "Customisable hint",
    type: "toggle",
    proposed: true,
    hint: "Flags dishes that open a modifier or combo page.",
  },
];

const proposedDishDefaults: Args = {
  soldOut: false,
  availability: "available",
  stockLeft: 3,
  promo: false,
  tags: "none",
  customisable: false,
};

const dishExtras = (args: Args, dish: Dish) => ({
  availability: (args.soldOut ? "soldOut" : args.availability) as Availability,
  stockLeft: Number(args.stockLeft),
  promoPrice: args.promo ? Math.round(dish.price * 0.8 * 100) / 100 : undefined,
  showTags: args.tags !== "none",
  customisable: Boolean(args.customisable),
});

const soldOutCases: UseCase[] = [
  { name: "Sold out", note: "Greyed with a Sold out chip. Not tappable, so it can't reach the bucket.", args: { soldOut: true } },
  { name: "Sold out, no photo", note: "The no-image placeholder greys out with the card.", args: { soldOut: true, noPhoto: true } },
];

const proposedDishCases: UseCase[] = [
  { name: "Low stock", note: "Kitchen flagged few portions left.", proposed: true, args: { availability: "low", stockLeft: 2 } },
  { name: "Promo price", note: "Discount with the regular price struck through.", proposed: true, args: { promo: true } },
  { name: "Dietary tags", note: "First tag in full, the rest collapse into +N.", proposed: true, args: { tags: "many" } },
  { name: "Customisable", note: "Opens modifiers instead of adding straight away.", proposed: true, args: { customisable: true } },
];

/* ---------------------------------- dishes ---------------------------------- */

const dishCard = (dishes: Dish[]): Story => ({
  id: "dish-card",
  name: "Dish Card",
  group: "Menu items",
  placements: [
    ["Native ordering", "POS order page", "Pulse Dish Recommendation"],
  ],
  usage: "Pulse recommendation strip on the POS order page.",
  figma: "2820:17259",
  themed: false,
  surface: "dark",
  controls: [
    ...dishControls(dishes),
    { key: "inBucket", label: "In bucket", type: "number", min: 0, max: 9, hint: "Count badge top-right. Tap the card to add." },
    { key: "showBadges", label: "Recommendation badges", type: "toggle", hint: "75% Match / 4x Reorder." },
    soldOutControl,
    ...scheduleControls,
    ...proposedDishControls,
  ],
  defaults: { dishId: "", noPhoto: false, longName: false, inBucket: 0, showBadges: true, ...scheduleDefaults, ...proposedDishDefaults },
  useCases: [
    { name: "Recommendation", note: "Default tile in the Pulse strip.", args: {} },
    { name: "Already in bucket", note: "Waiter added it twice.", args: { inBucket: 2 } },
    { name: "Without badges", note: "Plain tile, no scoring chips.", args: { showBadges: false } },
    { name: "No photo", note: "No-image placeholder under the fade.", args: { noPhoto: true } },
    { name: "Long name", note: "Name truncates on one line.", args: { longName: true } },
    ...soldOutCases,
    ...scheduleCases,
    ...proposedDishCases,
  ],
  render: (args, { dishes: list, set }) => {
    const dish = pickDish(args, list);
    return (
      <DishCard
        dish={dish}
        inBucket={Number(args.inBucket)}
        showBadges={Boolean(args.showBadges)}
        onAdd={() => set({ inBucket: Math.min(9, Number(args.inBucket) + 1) })}
        {...dishExtras(args, dish)}
        {...scheduleProps(args, set)}
      />
    );
  },
});

const dishRowCard = (dishes: Dish[]): Story => ({
  id: "dish-row-card",
  name: "Dish Row Card",
  group: "Menu items",
  placements: [
    ["Native ordering", "POS order page", "Category dish list"],
    ["Native ordering", "POS order page", "Subcategory page"],
    ["Native ordering", "POS order page", "Search results"],
  ],
  usage: "Dish list when a category or subcategory is open, and search results.",
  figma: "2821:17812",
  themed: true,
  surface: "page",
  controls: [
    ...dishControls(dishes),
    { key: "inBucket", label: "In bucket", type: "number", min: 0, max: 9, hint: "Count badge on the photo. Tap the card to add." },
    soldOutControl,
    ...scheduleControls,
    ...proposedDishControls,
  ],
  defaults: { dishId: "", noPhoto: false, longName: false, inBucket: 0, ...scheduleDefaults, ...proposedDishDefaults },
  useCases: [
    { name: "Default", note: "Name and price left, photo right.", args: {} },
    { name: "Already in bucket", note: "Count badge on the photo.", args: { inBucket: 3 } },
    { name: "No photo", note: "No-image placeholder in the photo slot.", args: { noPhoto: true } },
    { name: "Long name", note: "Name wraps, photo stays 76px.", args: { longName: true } },
    ...soldOutCases,
    ...scheduleCases,
    ...proposedDishCases,
  ],
  render: (args, { dishes: list, set }) => {
    const dish = pickDish(args, list);
    return (
      <DishRowCard
        dish={dish}
        inBucket={Number(args.inBucket)}
        onAdd={() => set({ inBucket: Math.min(9, Number(args.inBucket) + 1) })}
        {...dishExtras(args, dish)}
        {...scheduleProps(args, set)}
      />
    );
  },
});

/* ---------------------------------- bucket ---------------------------------- */

const CONTENT: Record<string, { choices?: CartChoice[]; extra: number }> = {
  plain: { extra: 0 },
  modifiers: {
    extra: 4.5,
    choices: [
      {
        qty: 1,
        mods: [
          { name: "Pan-Fried", qty: 1 },
          { name: "Fried Egg", qty: 2 },
        ],
      },
    ],
  },
  combo: {
    extra: 6,
    choices: [
      {
        label: "Drink",
        name: "Latte",
        qty: 1,
        mods: [
          { name: "Iced", qty: 1 },
          { name: "Almond Milk", qty: 1 },
        ],
        notes: "Less sweet",
      },
      { label: "Main", name: "Croque Monsieur", qty: 1, mods: [{ name: "Steamed", qty: 1 }] },
    ],
  },
};

const bucketLine = (dishes: Dish[]): Story => ({
  id: "bucket-line",
  name: "Bucket Line",
  group: "Order bucket",
  placements: [
    ["Native ordering", "POS order page", "Order Bucket"],
  ],
  usage: "Each line in the order bucket on the right of the POS order page.",
  themed: true,
  surface: "bucket",
  controls: [
    ...dishControls(dishes).filter((c) => c.key !== "noPhoto"),
    { key: "qty", label: "Quantity", type: "number", min: 1, max: 9, hint: "At 1 the minus turns into a trash icon." },
    {
      key: "content",
      label: "Line content",
      type: "segment",
      options: [
        { value: "plain", label: "Plain" },
        { value: "modifiers", label: "Modifiers" },
        { value: "combo", label: "Combo" },
      ],
    },
    { key: "notes", label: "Line notes", type: "toggle" },
    {
      key: "noteAction",
      label: "Add note action",
      type: "toggle",
      hint: "Plain dishes skip the modifier page, so the line carries Add note. Tap it to open the note dialog.",
      when: (a) => !a.editable,
    },
    { key: "editable", label: "Editable", type: "toggle", hint: "Lines with modifiers or a combo show Edit and reopen their page." },
    {
      key: "swiped",
      label: "Swiped open",
      type: "toggle",
      hint: "Reveals Remove all. Drag the card left to try the gesture.",
    },
    { key: "sent", label: "Sent to kitchen", type: "toggle", proposed: true, hint: "Locked: no stepper, no swipe, no edit." },
    {
      key: "maxQty",
      label: "Max per order",
      type: "number",
      min: 0,
      max: 9,
      proposed: true,
      hint: "0 = no limit. At the cap the line says so in place; tapping + shakes the stepper, no snackbar.",
    },
  ],
  defaults: {
    dishId: "",
    longName: false,
    qty: 1,
    content: "plain",
    notes: false,
    noteAction: true,
    noteOpen: false,
    editable: false,
    swiped: false,
    sent: false,
    maxQty: 0,
    removed: false,
  },
  useCases: [
    { name: "Single item", note: "Qty 1: the minus is a trash icon.", args: {} },
    { name: "Multiple", note: "Shows unit price under the total.", args: { qty: 3 } },
    { name: "With modifiers", note: "Modifiers sit right under the dish name.", args: { content: "modifiers", editable: true } },
    { name: "Combo", note: "Group label, pick, its modifiers and notes.", args: { content: "combo", editable: true, qty: 2 } },
    { name: "Plain item: Add note", note: "Went straight into the bucket; Add note is the way to leave the kitchen a note.", args: {} },
    { name: "Plain item: note added", note: "The note is the edit target: tap anywhere on it to change it.", args: { notes: true } },
    { name: "Note, read only", note: "Without the action (e.g. a combo's notes come from its page) the note is plain text.", args: { notes: true, noteAction: false } },
    { name: "Swiped open", note: "Remove all action revealed.", args: { swiped: true, qty: 2 } },
    { name: "Long name", note: "Wraps next to the Edit link.", args: { longName: true, content: "modifiers", editable: true } },
    { name: "Sent to kitchen", note: "Fired lines can't be changed from the bucket.", proposed: true, args: { sent: true, content: "combo", qty: 2 } },
    { name: "Below max quantity", note: "Item has a cap but there is room: nothing extra shows.", proposed: true, args: { qty: 3, maxQty: 5 } },
    {
      name: "Max quantity reached",
      note: "Amber border, dimmed + and the reason under the price. Tapping + shakes the stepper instead of adding.",
      proposed: true,
      args: { qty: 5, maxQty: 5 },
    },
    {
      name: "Max reached, combo",
      note: "Same message under a combo line with Edit.",
      proposed: true,
      args: { qty: 2, maxQty: 2, content: "combo", editable: true },
    },
  ],
  render: (args, { dishes: list, set }) => {
    const dish = pickDish({ ...args, tags: "none" }, list);
    const content = CONTENT[String(args.content)] ?? CONTENT.plain;
    if (args.removed)
      return (
        <div className="flex w-[340px] flex-col items-center gap-2 rounded-xl border border-dashed border-current/20 p-6 text-xs opacity-70">
          Line removed
          <button type="button" onClick={() => set({ removed: false, swiped: false, qty: 1 })} className="underline">
            Restore
          </button>
        </div>
      );
    const line: CartLine = {
      lineId: "ds",
      itemId: dish.id,
      name: dish.name,
      unitPrice: dish.price + content.extra,
      qty: Number(args.qty),
      choices: content.choices,
      notes: args.notes ? String(args.noteText || "No onions, Nut allergy") : undefined,
    };
    const bucket = (
      <ul className="w-[340px]">
        <BucketLine
          line={line}
          sent={Boolean(args.sent)}
          maxQty={Number(args.maxQty) || undefined}
          open={Boolean(args.swiped)}
          onOpen={() => set({ swiped: true })}
          onClose={() => set({ swiped: false })}
          onTouch={() => {}}
          onEdit={args.editable ? () => {} : undefined}
          onNote={args.noteAction && !args.editable ? () => set({ noteOpen: true }) : undefined}
          onIncrement={() => set({ qty: Math.min(9, Number(args.qty) + 1) })}
          onDecrement={() => set({ qty: Math.max(1, Number(args.qty) - 1) })}
          onRemove={() => set({ removed: true })}
        />
      </ul>
    );
    if (!args.noteOpen) return bucket;
    // the dialog covers its positioned parent: give it a tablet-sized stage
    return (
      <div className="relative flex h-[560px] w-[680px] items-center justify-center overflow-hidden rounded-2xl">
        {bucket}
        <NoteDialog
          dishName={line.name}
          qty={line.qty}
          initial={line.notes}
          onSave={(notes) => set({ noteOpen: false, notes: Boolean(notes.trim()), noteText: notes.trim() })}
          onCancel={() => set({ noteOpen: false })}
        />
      </div>
    );
  },
});

/* -------------------------------- order note -------------------------------- */

const noteDialog: Story = {
  id: "note-dialog",
  name: "Order Note Dialog",
  group: "Order bucket",
  placements: [
    ["Native ordering", "Order Bucket", "Add note on a plain dish"],
  ],
  usage:
    "Opens from Add note on a plain bucket line (dishes without a modifier page). Centred over the POS page, sized for fingers: 44px+ targets.",
  themed: true,
  surface: "bucket",
  controls: [
    {
      key: "start",
      label: "Opens with",
      type: "segment",
      options: [
        { value: "empty", label: "No note" },
        { value: "typed", label: "Typed note" },
        { value: "long", label: "Near limit" },
      ],
      hint: "With a note it reads Edit note and offers Remove note.",
    },
    { key: "qty", label: "Line quantity", type: "number", min: 1, max: 9, hint: "Shown before the dish name when more than one." },
  ],
  defaults: { start: "empty", qty: 2, round: 0 },
  useCases: [
    { name: "Add note", note: "Empty box. Save stays off until something changes.", tall: true, args: {} },
    { name: "Edit a note", note: "Reads Edit note; Remove note clears it.", tall: true, args: { start: "typed" } },
    { name: "Near the limit", note: "Counter shows the 140-character cap.", tall: true, args: { start: "long" } },
  ],
  render: (args, { dishes: list, set }) => {
    const initial = {
      empty: "",
      typed: "Cut in half for the kids, please",
      long: "Guest has a severe peanut allergy: please use a clean wok and utensils, keep all garnish separate, and check before",
    }[String(args.start)];
    return (
      <div className="relative h-[560px] w-[680px] overflow-hidden rounded-2xl">
        <NoteDialog
          // a new round remounts the dialog with the picked start text
          key={`${args.start}-${args.round}`}
          dishName={list[0]?.name ?? "Dish"}
          qty={Number(args.qty)}
          initial={initial}
          autoFocus={false}
          onSave={() => set({ round: Number(args.round) + 1 })}
          onCancel={() => set({ round: Number(args.round) + 1 })}
        />
      </div>
    );
  },
};

/* --------------------------------- modifiers -------------------------------- */

const MILK = "/figma/tablet-pos";
const OPTIONS: Record<string, ModifierOption> = {
  oat: { id: "oat", name: "Oat Milk", price: 1, image: `${MILK}/milk-oat.png` },
  almond: { id: "almond", name: "Almond Milk", price: 1, image: `${MILK}/milk-almond.png` },
  soy: { id: "soy", name: "Soy Milk", price: 1, image: `${MILK}/milk-soy.png` },
  fullCream: { id: "full-cream", name: "Full Cream Milk", price: 0, image: `${MILK}/milk-glass.jpg` },
  hot: { id: "hot", name: "Hot", price: 5 },
  iced: { id: "iced", name: "Iced", price: 5 },
  egg: { id: "egg", name: "Fried Egg", price: 1.5 },
  panFried: { id: "pan-fried", name: "Pan-Fried", price: 2.5 },
};
const optionSelect = (keys: string[]): Control => ({
  key: "option",
  label: "Option",
  type: "select",
  options: keys.map((k) => ({ value: k, label: OPTIONS[k].name })),
});

const optionCard: Story = {
  id: "option-card",
  name: "Option Card",
  group: "Modifiers",
  placements: [
    ["Native ordering", "Modifier sheet", "Option groups"],
    ["Native ordering", "Combo page", "Option groups"],
  ],
  usage: "Picks on the combo page and the modifier sheet: variants, milk, preparation, add-ons.",
  figma: "2824:18077",
  themed: false,
  surface: "dark",
  controls: [
    optionSelect(["oat", "almond", "soy", "hot", "iced", "egg", "panFried"]),
    { key: "photo", label: "Show photo", type: "toggle", hint: "Only options that have one." },
    {
      key: "size",
      label: "Size",
      type: "segment",
      options: [
        { value: "wide", label: "Wide 280" },
        { value: "compact", label: "Compact 164" },
      ],
    },
    {
      key: "priceStyle",
      label: "Price",
      type: "segment",
      options: [
        { value: "full", label: "Full" },
        { value: "addon", label: "Add-on (+)" },
      ],
    },
    { key: "selected", label: "Selected", type: "toggle", hint: "Single-pick groups. Tap the card to toggle." },
    {
      key: "count",
      label: "Stack count",
      type: "number",
      min: 0,
      max: 9,
      hint: "Multi-pick add-ons. Tap the badge to take one off.",
    },
    {
      key: "groupFull",
      label: "Group max reached",
      type: "toggle",
      hint: "Add-on group hit its maximum: unpicked cards dim, a tap shakes the card and adds nothing.",
    },
    { key: "unavailable", label: "Unavailable", type: "toggle", proposed: true },
  ],
  defaults: {
    option: "oat",
    photo: true,
    size: "wide",
    priceStyle: "addon",
    selected: false,
    count: 0,
    groupFull: false,
    unavailable: false,
  },
  useCases: [
    { name: "Card with photo", note: "Milk choice, add-on price.", args: {} },
    { name: "Selected", note: "Gold border.", args: { selected: true } },
    { name: "Plain variant", note: "Small Hot / Iced pick, full price.", args: { option: "hot", photo: false, size: "compact", priceStyle: "full" } },
    { name: "Variant selected", note: "Compact pick chosen.", args: { option: "iced", photo: false, size: "compact", priceStyle: "full", selected: true } },
    { name: "Stacked add-on", note: "Picked twice, count badge.", args: { option: "egg", photo: false, count: 2 } },
    { name: "Preparation", note: "Wide card, no photo.", args: { option: "panFried", photo: false } },
    {
      name: "Group full, not picked",
      note: "Dimmed. Tapping shakes it; the summary card on the right says why.",
      args: { option: "egg", photo: false, groupFull: true },
    },
    {
      name: "Group full, picked",
      note: "Keeps its count badge at full strength. Tapping shakes instead of adding.",
      args: { option: "egg", photo: false, selected: true, count: 3, groupFull: true },
    },
    {
      name: "Group full, photo card",
      note: "Same dim on a milk card.",
      args: { option: "soy", groupFull: true },
    },
    { name: "Unavailable", note: "Ran out: greyed, not pickable.", proposed: true, args: { unavailable: true } },
  ],
  render: (args, { set }) => {
    const base = OPTIONS[String(args.option)] ?? OPTIONS.oat;
    const option = args.photo ? base : { ...base, image: undefined };
    const count = Number(args.count);
    return (
      <OptionCard
        option={option}
        priceStyle={args.priceStyle as "full" | "addon"}
        compact={args.size === "compact"}
        selected={Boolean(args.selected)}
        count={count || undefined}
        onDecrement={() => set({ count: Math.max(0, count - 1) })}
        // a full group blocks the add, like the modifier sheet does
        onClick={() =>
          args.groupFull ? undefined : count ? set({ count: Math.min(9, count + 1) }) : set({ selected: !args.selected })
        }
        unavailable={Boolean(args.unavailable)}
        groupFull={Boolean(args.groupFull)}
      />
    );
  },
};

const photoOptionCard: Story = {
  id: "photo-option-card",
  name: "Photo Option Card",
  group: "Modifiers",
  placements: [
    ["Native ordering", "Combo page", "Dish options (e.g. Main)"],
  ],
  usage: "Combo groups whose options are full dishes (photo fills the card).",
  figma: "2854:207",
  themed: false,
  surface: "dark",
  controls: [
    optionSelect(["oat", "almond", "soy", "fullCream"]),
    { key: "selected", label: "Selected", type: "toggle", hint: "Tap the card to toggle." },
    { key: "unavailable", label: "Unavailable", type: "toggle", proposed: true },
  ],
  defaults: { option: "almond", selected: false, unavailable: false },
  useCases: [
    { name: "Default", note: "Photo with dark fade.", args: {} },
    { name: "Selected", note: "Gold ring.", args: { selected: true } },
    { name: "Unavailable", note: "Greyscale, not pickable.", proposed: true, args: { unavailable: true } },
  ],
  render: (args, { set }) => (
    <PhotoOptionCard
      option={OPTIONS[String(args.option)] ?? OPTIONS.almond}
      selected={Boolean(args.selected)}
      onClick={() => set({ selected: !args.selected })}
      unavailable={Boolean(args.unavailable)}
    />
  ),
};

const ADDONS = [OPTIONS.egg, { id: "chilli-oil", name: "Chilli Oil", price: 1 }, { id: "xo-sauce", name: "XO Sauce", price: 3 }];

const summaryCard: Story = {
  id: "summary-card",
  name: "Modifier Summary Card",
  group: "Modifiers",
  placements: [
    ["Native ordering", "Modifier sheet", "Summary column"],
    ["Native ordering", "Combo page", "Summary column"],
  ],
  usage: "Right column of the modifier sheet: one card per group with its status and picks. Also where a group's maximum is explained, instead of a snackbar.",
  figma: "2842:583",
  themed: false,
  surface: "dark",
  controls: [
    {
      key: "status",
      label: "Status",
      type: "segment",
      options: [
        { value: "none", label: "Optional" },
        { value: "required", label: "Required" },
        { value: "fulfilled", label: "Fulfilled" },
      ],
    },
    { key: "stacked", label: "Stackable picks", type: "toggle", hint: "Add-on groups: pills get a − count + stepper." },
    { key: "picks", label: "Picks", type: "number", min: 0, max: 6, hint: "Total picked, stacks included. Use the pill + to add." },
    {
      key: "max",
      label: "Maximum",
      type: "number",
      min: 0,
      max: 6,
      hint: "0 = no limit. Adding past it shakes the card and keeps the count.",
      when: (a) => Boolean(a.stacked),
    },
  ],
  defaults: { status: "none", stacked: true, picks: 1, max: 3, nudge: 0 },
  useCases: [
    { name: "Required, empty", note: "Group still needs a pick.", args: { status: "required", stacked: false, picks: 0, max: 0 } },
    { name: "Fulfilled", note: "Single pick with a clear x.", args: { status: "fulfilled", stacked: false, picks: 1, max: 0 } },
    { name: "Add-ons, no limit", note: "Stacked pills, no counter.", args: { picks: 3, max: 0 } },
    { name: "Under the limit", note: "Counter shows picks against the maximum.", args: { picks: 2, max: 3 } },
    { name: "Max reached", note: "Amber chip and inline reason. The + dims but still answers a tap with a shake.", args: { picks: 3, max: 3 } },
    { name: "Max reached, one item stacked", note: "Same option picked to the limit.", args: { picks: 2, max: 2 } },
  ],
  render: (args, { set }) => {
    const total = Number(args.picks);
    const max = args.stacked ? Number(args.max) : 0;
    const shown = ADDONS.slice(0, Math.min(total, args.stacked ? 3 : 1));
    // leftovers stack on the first pick: 4 picks over 3 options reads Fried Egg ×2, Chilli Oil, XO Sauce
    const qtyOf = (i: number) => (i === 0 ? total - shown.length + 1 : 1);
    const add = () =>
      max && total >= max
        ? set({ nudge: Number(args.nudge) + 1 })
        : set({ picks: Math.min(6, total + 1) });
    const pills: SummaryPill[] = shown.map((o, i) => ({
      key: o.id,
      name: o.name,
      detail: `+${sgd(o.price)}`,
      qty: args.stacked ? qtyOf(i) : undefined,
      onRemove: () => set({ picks: Math.max(0, total - (args.stacked ? 1 : qtyOf(i))) }),
      onAdd: args.stacked ? add : undefined,
    }));
    return (
      <div className="w-[340px]">
        <SummaryCard
          label={args.stacked ? "Chef\u2019s Adds" : "Preparation"}
          status={args.status as "none" | "required" | "fulfilled"}
          pills={pills}
          limit={max ? { used: total, max } : undefined}
          nudge={Number(args.nudge)}
        />
      </div>
    );
  },
};

const actionButton: Story = {
  id: "action-button",
  name: "Action Buttons",
  group: "Foundations",
  placements: [
    ["Native ordering", "Order Bucket", "Confirm Order"],
    ["Native ordering", "Modifier sheet", "Save Modifier"],
    ["Native ordering", "Order note dialog", "Save note, Cancel"],
  ],
  usage:
    "Main, secondary and neutral actions across native ordering. On the Pulse (Dark) theme they match Table Detail: Pay Bill, + Add to Order, Receipt / Add Order.",
  themed: true,
  surface: "page",
  controls: [
    {
      key: "variant",
      label: "Variant",
      type: "segment",
      options: [
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "outline", label: "Outline" },
      ],
    },
    { key: "disabled", label: "Disabled", type: "toggle", hint: "One disabled look for every variant." },
  ],
  defaults: { variant: "primary", disabled: false },
  useCases: [
    { name: "Primary", note: "Confirm Order, Save Modifier, Save note: gold gradient, gold outline.", args: {} },
    { name: "Primary, disabled", note: "Empty bucket, required group missing: grey fill, grey text.", args: { disabled: true } },
    { name: "Secondary", note: "Dark gold wash with a gold outline, as + Add to Order on Table Detail.", args: { variant: "secondary" } },
    { name: "Outline", note: "Cancel: dark fill, grey-gold outline.", args: { variant: "outline" } },
  ],
  render: (args) => {
    const variant = args.variant as "primary" | "secondary" | "outline";
    const label = { primary: "Confirm Order", secondary: "Pulse Dish Recommendation", outline: "Cancel" }[variant];
    return (
      <ActionButton variant={variant} disabled={Boolean(args.disabled)}>
        {label}
      </ActionButton>
    );
  },
};

/* -------------------------------- empty state ------------------------------- */

/** The list the empty state fills: the bucket column or the dish list, on its own tint. */
function EmptyFrame({ kind }: { kind: "bucket" | "items" }) {
  const t = usePosTheme();
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl",
        kind === "bucket" ? cn("h-[320px] w-[340px]", t.bucket) : cn("h-[420px] w-[560px]", t.page),
      )}
    >
      <EmptyState kind={kind} />
    </div>
  );
}

const emptyState: Story = {
  id: "empty-state",
  name: "Empty State",
  group: "Empty state",
  placements: [
    ["Native ordering", "POS order page", "Order Bucket"],
    ["Native ordering", "POS order page", "Category dish list"],
  ],
  usage:
    "Shown when a list has nothing to show. Order bucket: nothing added yet. Item list: the API or menu data returns no items. Same 42px gap and 14px copy. Order bucket: 107×115 glow. Item list sits in the wider select-dish area, so its illustration and glow are 2× (214×230).",
  themed: true,
  surface: "page",
  controls: [
    {
      key: "kind",
      label: "List",
      type: "segment",
      options: [
        { value: "bucket", label: "Order bucket" },
        { value: "items", label: "Item list" },
      ],
      hint: "Item list: the select-dish area when the API or menu data lists no dishes.",
    },
  ],
  defaults: { kind: "bucket" },
  useCases: [
    { name: "Order bucket", note: "Nothing added yet: \u201cNo items for now\u201d.", args: {} },
    {
      name: "Item list, no items",
      note: "API or menu data lists no dishes: \u201cItem unavailable for now\u201d.",
      args: { kind: "items" },
    },
  ],
  render: (args) => <EmptyFrame kind={args.kind as "bucket" | "items"} />,
};

/** Every story, in nav order. Dish-based stories need the resolved menu for their options. */
export const buildStories = (dishes: Dish[]): Story[] => [
  actionButton,
  dishCard(dishes),
  dishRowCard(dishes),
  bucketLine(dishes),
  noteDialog,
  optionCard,
  photoOptionCard,
  summaryCard,
  emptyState,
];
