"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { DishImage } from "@/menu/DishImage";
import { useMenu } from "@/menu/hooks";
import { imageUrl } from "@/menu/resolve";
import type { Dish, ResolvedSubcategory, ResolvedTabletCategory } from "@/menu/types";
import type { CartChoice, CartEdit, CartLine, PosChosen, SheetSnap } from "@/engine/types";
import {
  modifierGroupsFor,
  standaloneCustomisationFor,
  type ModifierGroup,
  type ModifierOption,
} from "@/config/global/modifiers";
import { useSim } from "@/engine/store";
import { useTokens } from "@/theme/hooks";
import { currency } from "@/engine/types";

const ASSET = "/figma/tablet-pos";

/**
 * Look of the select-dish page, from the active theme's `tablet/tokens.ts`. Dark is the
 * original; Light (Figma 2821:17567) and Foodpanda (2821:17671) share one layout and
 * differ in accent and the order bucket tint.
 */
const usePosTheme = () => useTokens("tablet").pos;

/** Hairline between page sections: the Figma svg on dark, a plain border on the light themes. */
function Divider({ tone, className }: { tone: string | null; className: string }) {
  return tone ? (
    <div className={cn(tone, className)} />
  ) : (
    <Image src={`${ASSET}/divider.svg`} alt="" width={900} height={1} className={className} />
  );
}

/** Figma prints 75% / 4x on every recommendation card — there is no scoring model to read. */
const MATCH_PCT = 75;
const REORDER_COUNT = 4;
const RECOMMENDATION_COUNT = 4;

function DishCard({
  dish,
  inBucket,
  showBadges,
  onAdd,
}: {
  dish: Dish;
  inBucket: number;
  showBadges?: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative flex h-[96px] w-[280px] items-start overflow-hidden rounded-xl border border-[#222] p-2.5 text-left transition hover:brightness-125"
    >
      <DishImage src={dish.image} alt={dish.name} sizes="280px" eager className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] from-[5.729%] to-[rgba(128,128,128,0)]" />

      <div className="relative flex h-full flex-col items-start justify-between">
        {showBadges ? (
          <div className="flex items-start gap-0.5">
            <span className="rounded bg-[#00abb6] p-[5px] text-[10px] leading-none font-medium whitespace-nowrap text-white">
              {MATCH_PCT}% Match
            </span>
            <span className="rounded bg-[#6c31cf] p-[5px] text-[10px] leading-none font-medium whitespace-nowrap text-white">
              {REORDER_COUNT}x Reorder
            </span>
          </div>
        ) : (
          <div className="h-[20px]" />
        )}
        <div className="flex flex-col items-start gap-1.5 leading-none text-white">
          <p className="max-w-[236px] truncate text-sm font-semibold">
            {dish.name}
          </p>
          <p className="text-xs">{`SGD ${dish.price.toFixed(2)}`}</p>
        </div>
      </div>

      {inBucket > 0 ? (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-[#f5dfa8] px-2 py-1 text-[10px] leading-none font-bold text-[#1b1b1a]">
          ×{inBucket}
        </span>
      ) : null}
    </button>
  );
}

/** Figma 2821:17812: the row card shown when a category is open — name and price bottom-left, photo right. */
function DishRowCard({
  dish,
  inBucket,
  onAdd,
}: {
  dish: Dish;
  inBucket: number;
  onAdd: () => void;
}) {
  const t = usePosTheme();
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        "flex w-[280px] items-end justify-between gap-2 rounded-xl border p-2.5 text-left transition hover:brightness-110",
        t.row,
      )}
    >
      <div className="flex min-w-px flex-1 flex-col items-start gap-1.5 leading-none">
        <p className="text-sm font-semibold">{dish.name}</p>
        <p className="text-xs">{`SGD ${dish.price.toFixed(2)}`}</p>
      </div>
      <div className="relative size-[76px] shrink-0 overflow-hidden rounded-lg bg-white">
        {dish.image ? (
          <Image
            src={imageUrl(dish.image)}
            alt=""
            fill
            sizes="76px"
            loading="eager"
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center bg-[#2b2b2b] text-2xl font-bold text-[#f5dfa8]">
            {dish.name.slice(0, 1)}
          </span>
        )}
        {inBucket > 0 ? (
          <span className="absolute top-1 right-1 rounded-full bg-[#f5dfa8] px-1.5 py-1 text-[10px] leading-none font-bold text-[#1b1b1a]">
            ×{inBucket}
          </span>
        ) : null}
      </div>
    </button>
  );
}

/**
 * Figma 3124:186: the page a category with subcategories opens. Subcategory tiles on top,
 * the picked one's dishes below; the order bucket stays on the right. The close button
 * and the category crumb both go back to the category grid.
 */
function SubcategoryPage({
  category,
  active,
  qtyInBucket,
  onBack,
  onPickSub,
  onPickDish,
}: {
  category: ResolvedTabletCategory;
  active: ResolvedSubcategory;
  qtyInBucket: (itemId: string) => number;
  onBack: () => void;
  onPickSub: (subcategoryId: string) => void;
  onPickDish: (dish: Dish) => void;
}) {
  const t = usePosTheme();
  return (
    <div className="flex h-full w-[900px] shrink-0 flex-col">
      <div className={cn("relative h-[86px] shrink-0 border-b", t.header)}>
        <button
          type="button"
          aria-label="Back to categories"
          onClick={onBack}
          className={cn(
            "absolute top-1/2 left-5 flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border transition",
            t.closeBtn,
          )}
        >
          <Image src={`${ASSET}/${t.closeIcon}`} alt="" width={24} height={24} className="size-6" />
        </button>
        <div className="absolute top-0 left-[81px] flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-[86px] min-w-[130px] flex-col items-center justify-end pb-[33px]"
          >
            <span className={cn("text-xl leading-none font-bold whitespace-nowrap", t.crumb)}>{category.name}</span>
          </button>
          <Image src={`${ASSET}/chevron-right.svg`} alt="" width={24} height={24} className="mt-[31px] size-6" />
          <div className="flex h-[86px] w-[150px] flex-col items-center justify-between pb-[33px]">
            <div className={cn("h-0.5 w-full rounded-full", t.tab)} />
            <p className={cn("text-xl leading-none font-bold whitespace-nowrap", t.title)}>Select dish</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 flex-wrap gap-2.5 p-5">
          {category.subcategories?.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => onPickSub(sc.id)}
              className={cn(
                "flex h-[100px] w-[164px] flex-col items-start justify-end gap-1 rounded-xl p-3.5 text-left leading-none text-white transition hover:brightness-110",
                active.id === sc.id && t.ring,
              )}
              style={{ backgroundColor: sc.color }}
            >
              <span className="w-full text-sm leading-none font-semibold break-words">{sc.name}</span>
              <span className="text-xs">{sc.dishes.length} Items</span>
            </button>
          ))}
        </div>
        <Divider tone={t.divider} className="h-px w-[900px] shrink-0" />
        <div className="grid shrink-0 grid-cols-[repeat(3,280px)] gap-2.5 p-5">
          {active.dishes.map((dish) => (
            <DishRowCard
              key={dish.id}
              dish={dish}
              inBucket={qtyInBucket(dish.id)}
              onAdd={() => onPickDish(dish)}
            />
          ))}
          {active.dishes.length === 0 ? (
            <p className={cn("col-span-3 text-sm", t.meta)}>No dishes in {active.name} yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyBucket() {
  const t = usePosTheme();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[42px] pb-[46px]">
      <div
        className="relative flex h-[115px] w-[107.276px] items-center justify-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(141,154,169,0.2) 35%, rgba(141,154,169,0) 100%)",
        }}
      >
        <Image
          src={`${ASSET}/bag.svg`}
          alt=""
          width={65.131}
          height={96.897}
          className="h-[96.897px] w-[65.131px]"
        />
      </div>
      <p className={cn("text-sm leading-none", t.ink)}>No items for now</p>
    </div>
  );
}

const RequiredChip = () => (
  <span className="rounded-md bg-[rgba(203,113,83,0.2)] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#cb7153]">
    Required
  </span>
);

/** Rotated 45° in the Figma export so the diagonal strokes land as a minus / plus. */
function StepIcon({ src }: { src: string }) {
  return (
    <div className="flex size-[33.941px] items-center justify-center">
      <div className="-rotate-45">
        <Image src={src} alt="" width={24} height={24} className="size-6" />
      </div>
    </div>
  );
}

type ComboSave = {
  modifiers: string[];
  choices: CartChoice[];
  unitPrice: number;
  qty: number;
  notes?: string;
  edit?: CartEdit;
};

/** What a group ended up with: an option, its price contribution and any second-level picks. */
type Chosen = PosChosen;

/** Flat text form for the bucket line and the combo tile: "Latte (Iced, Almond Milk, ×2)". */
const optionLabel = (c: Chosen) => {
  const parts = [
    ...c.lines,
    ...(c.qty > 1 ? [`×${c.qty}`] : []),
    ...(c.notes ? [`“${c.notes}”`] : []),
  ];
  return parts.length ? `${c.name} (${parts.join(", ")})` : c.name;
};

const sgd = (value: number) => `SGD ${value.toFixed(2)}`;

/** Notes field, quantity stepper and the Save button: shared by the combo page and the option sheet. */
function ModifierFooter({
  notesPlaceholder,
  notes,
  onNotes,
  qty,
  onQty,
  canSave,
  onSave,
}: {
  notesPlaceholder: string;
  notes: string;
  onNotes: (value: string) => void;
  qty: number;
  onQty: (value: number) => void;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-8 px-5 pb-5">
      <div className="flex flex-col gap-5">
        <label className="flex h-[50px] w-full items-center justify-between gap-2 rounded-xl border border-[#222] bg-[#191919] p-3">
          <input
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder={notesPlaceholder}
            className="min-w-px flex-1 bg-transparent text-base leading-none text-[#fff8eb] outline-none placeholder:text-[#8f8f8f]"
          />
          <Image
            src={`${ASSET}/notes.svg`}
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0"
          />
        </label>

        <div className="flex h-[46px] items-center justify-between">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onQty(Math.max(1, qty - 1))}
            className="flex size-[46px] items-center justify-center overflow-hidden rounded-xl border border-[#222] bg-[#191919]"
          >
            <StepIcon src={`${ASSET}/minus.svg`} />
          </button>
          <p className="text-xl leading-none font-bold text-[#fff8eb] tabular-nums">
            {qty}
          </p>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQty(qty + 1)}
            className="flex size-[46px] items-center justify-center overflow-hidden rounded-xl border border-[#313131]"
          >
            <StepIcon src={`${ASSET}/plus.svg`} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-xl border p-4 transition",
          canSave
            ? "border-[#e8bc6b] text-white hover:brightness-110"
            : "border-transparent bg-[#383736] text-[#838383]",
        )}
        style={
          canSave
            ? {
                backgroundImage:
                  "linear-gradient(84.68deg, rgb(170, 127, 30) 0%, rgb(144, 105, 14) 52.022%, rgb(170, 130, 37) 99.777%)",
              }
            : undefined
        }
      >
        <span className="text-base leading-none font-bold whitespace-nowrap">
          Save Modifier
        </span>
      </button>
    </div>
  );
}

const FulfilledChip = () => (
  <span className="flex items-center justify-center gap-1 rounded-md bg-[rgba(55,119,77,0.4)] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#8eecae]">
    <Image
      src={`${ASSET}/check-small.svg`}
      alt=""
      width={12}
      height={12}
      className="size-3"
    />
    Fulfilled
  </span>
);

/** `qty` set means a stackable pick: shows ×N and `onRemove` steps it down (the pick leaves at 0). */
type SummaryPill = {
  key: string;
  name: string;
  detail?: string;
  qty?: number;
  onRemove?: () => void;
  /** Stackable picks also get a + next to the count. */
  onAdd?: () => void;
};

/**
 * Right-hand summary card (Figma 2842:583): the group label, a Required / Fulfilled status
 * and a pill per pick. Pills with `onRemove` carry an x that clears that pick. `children`
 * holds richer content, like the combo page's picked-item detail.
 */
function SummaryCard({
  label,
  status,
  pills = [],
  onClick,
  children,
}: {
  label: string;
  status: "required" | "fulfilled" | "none";
  pills?: SummaryPill[];
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 rounded-xl border border-[#222] bg-[#191919] p-3.5",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-px flex-1 text-base leading-tight font-semibold text-[#fff8eb]">
          {label}
        </p>
        {status === "required" ? (
          <RequiredChip />
        ) : status === "fulfilled" ? (
          <FulfilledChip />
        ) : null}
      </div>
      {pills.length ? (
        <div className="flex flex-wrap items-start gap-1.5">
          {pills.map((pill) =>
            pill.qty !== undefined ? (
              <div
                key={pill.key}
                className="flex min-h-9 items-center gap-2 rounded-full bg-[#222] py-1 pr-1 pl-3 text-sm leading-none text-[#bdbdbd]"
              >
                <span className="leading-tight">
                  <span className="font-semibold">{pill.name}</span>
                  {pill.detail ? ` (${pill.detail})` : ""}
                </span>
                <div className="flex items-center gap-1 rounded-full bg-[#2c2c2c] p-0.5">
                  <button
                    type="button"
                    aria-label={`Decrease ${pill.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      pill.onRemove?.();
                    }}
                    disabled={!pill.onRemove}
                    className="flex size-7 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90"
                  >
                    <span className="h-[1.5px] w-2.5 rounded-full bg-[#cdcdcd]" />
                  </button>
                  <span
                    key={pill.qty}
                    className="animate-count-pop min-w-5 text-center text-sm font-bold text-[#fff8eb] tabular-nums"
                  >
                    {pill.qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${pill.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      pill.onAdd?.();
                    }}
                    disabled={!pill.onAdd}
                    className="flex size-7 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90"
                  >
                    <span className="relative size-2.5">
                      <span className="absolute top-1/2 left-0 h-[1.5px] w-2.5 -translate-y-1/2 rounded-full bg-[#cdcdcd]" />
                      <span className="absolute top-0 left-1/2 h-2.5 w-[1.5px] -translate-x-1/2 rounded-full bg-[#cdcdcd]" />
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={pill.key}
                className={cn(
                  "flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-[#222] py-2 text-sm leading-none text-[#bdbdbd]",
                  pill.onRemove ? "pr-2 pl-3" : "px-3",
                )}
              >
                <span className="leading-tight">
                  <span className="font-semibold">{pill.name}</span>
                  {pill.detail ? ` (${pill.detail})` : ""}
                </span>
                {pill.onRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove ${pill.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      pill.onRemove?.();
                    }}
                    className="flex size-3 shrink-0 items-center justify-center"
                  >
                    <Image
                      src={`${ASSET}/remove-small.svg`}
                      alt=""
                      width={12}
                      height={12}
                      className="size-3"
                    />
                  </button>
                ) : null}
              </div>
            ),
          )}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** Figma 2854:112: what was picked for a combo group, with its option lines, price and any notes. */
function ChosenDetail({ chosen }: { chosen: Chosen }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[#222] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-px flex-1 flex-col gap-2">
          <p className="text-base leading-tight font-semibold text-[#fff8eb]">{`${chosen.qty}x ${chosen.name}`}</p>
          {chosen.lines.length ? (
            <div className="flex flex-col gap-1.5 text-sm leading-tight text-[#a0a0a0]">
              {chosen.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
        <p className="shrink-0 text-right text-sm leading-tight font-semibold whitespace-nowrap text-[#fff8eb]">
          {sgd(chosen.price)}
        </p>
      </div>
      {chosen.notes ? (
        <div className="rounded-lg bg-[#1b1b1a] p-2">
          <p className="text-sm leading-[1.3] text-[#9f9f9f]">{chosen.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

/** A selectable option: name and price bottom-left, optional photo on the right. */
function OptionCard({
  option,
  priceStyle = "full",
  compact = false,
  selected,
  count,
  onDecrement,
  onClick,
}: {
  option: ModifierOption;
  priceStyle?: "full" | "addon";
  /** Small 164px tile, same footprint as the plain Hot / Iced picks. For options without a photo. */
  compact?: boolean;
  selected: boolean;
  /** Stack count for add-ons: every tap adds one and the badge top-right keeps the tally. */
  count?: number;
  /** Tapping the count badge takes one back off (the pick leaves at 0). */
  onDecrement?: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-end justify-between gap-2 rounded-xl border bg-[#191919] text-left transition hover:brightness-125 active:scale-[0.98]",
        compact ? "h-[100px] w-[164px] p-3" : "h-[98px] w-[280px] p-2.5",
        selected ? "border-[#f5dfa8]" : "border-[#222]",
      )}
    >
      <div className="flex min-w-px flex-1 flex-col items-start gap-2 leading-none text-[#fff8eb]">
        <p className="text-base leading-tight font-semibold">{option.name}</p>
        <p className="text-sm text-[#cdcdcd]">
          {priceStyle === "addon" ? "+" : ""}
          {sgd(option.price)}
        </p>
      </div>
      {count ? (
        // a span, not a button: it sits inside the card's own <button>
        <span
          key={count}
          role="button"
          tabIndex={0}
          aria-label={`Decrease ${option.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDecrement?.();
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            e.stopPropagation();
            onDecrement?.();
          }}
          className="animate-count-pop absolute top-2 right-2 z-10 flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-full bg-[#f5dfa8] px-2 text-sm leading-none font-bold text-[#1b1b1a] tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition hover:brightness-90 active:scale-90"
        >
          {count}
        </span>
      ) : null}
      {option.image ? (
        <div className="relative size-[76px] shrink-0 overflow-hidden rounded-lg bg-white">
          <Image
            src={option.image}
            alt=""
            fill
            sizes="76px"
            loading="eager"
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}
    </button>
  );
}

/** Figma 2854:207: an option whose photo fills the whole card, name and price over a dark fade. */
function PhotoOptionCard({
  option,
  selected,
  onClick,
}: {
  option: ModifierOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-[96px] w-[280px] items-end overflow-hidden rounded-xl p-2.5 text-left transition hover:brightness-125",
        selected && "ring-2 ring-[#f5dfa8]",
      )}
    >
      <Image
        src={option.image!}
        alt=""
        fill
        sizes="280px"
        loading="eager"
        unoptimized
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] from-[5.729%] to-[rgba(128,128,128,0)]" />
      <div className="relative flex flex-col items-start gap-1.5 leading-none text-[#fff8eb]">
        <p className="max-w-[250px] truncate text-sm font-semibold">
          {option.name}
        </p>
        <p className="text-xs">{sgd(option.price)}</p>
      </div>
    </button>
  );
}

type Picks = Record<string, ModifierOption[]>;

/**
 * Figma: Pulse, nodes 2824:18077 ("Latte") and 2855:334 ("Croque Monsieur"). The
 * second-level modifier sheet: a full-screen popup that slides up from the bottom over
 * the combo page. Groups render in order (tiles, wide cards, small cards) with a divider
 * between them; "hidden" groups only appear in the summary. Save Modifier unlocks once
 * every required group has a pick.
 */
function OptionSheet({
  option,
  initial,
  onClose,
  onSave,
}: {
  option: ModifierOption;
  /** Reopen with a previous state (editing a bucket line). */
  initial?: SheetSnap;
  onClose: () => void;
  onSave: (chosen: Chosen) => void;
}) {
  const allGroups = option.customisation!.groups;

  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isVisible = (g: ModifierGroup, picks: Picks) =>
    !g.showWhen || picks[g.showWhen.groupId]?.[0]?.id === g.showWhen.optionId;
  const presetOf = (g: ModifierGroup) =>
    g.options.find((o) => o.id === g.defaultOptionId);

  /** Groups with a preset (a fixed variant) start filled in. */
  const [picks, setPicks] = useState<Picks>(() => {
    const start: Picks = {};
    if (initial) {
      allGroups.forEach((g) => {
        const ids = initial.picks[g.id];
        if (ids) start[g.id] = g.options.filter((o) => ids.includes(o.id));
      });
      return start;
    }
    allGroups.forEach((g) => {
      const preset = presetOf(g);
      if (preset && isVisible(g, start)) start[g.id] = [preset];
    });
    return start;
  });
  /** Stack count per pick in "multiple" groups (add-ons), keyed `${groupId}:${optionId}`; no upper limit. */
  const [counts, setCounts] = useState<Record<string, number>>(initial?.counts ?? {});
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const countKey = (g: ModifierGroup, o: ModifierOption) => `${g.id}:${o.id}`;
  const countOf = (g: ModifierGroup, o: ModifierOption) =>
    counts[countKey(g, o)] ?? 1;

  const groups = allGroups.filter((g) => isVisible(g, picks));
  const pickerGroups = groups.filter((g) => g.layout !== "hidden");

  const picked = (g: ModifierGroup) => picks[g.id] ?? [];
  const complete = groups.every((g) => g.optional || picked(g).length > 0);
  const close = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };
  const save = () => {
    if (!complete) return;
    const flat = groups.flatMap((g) => picked(g).map((o) => ({ g, o })));
    onSave({
      optionId: option.id,
      name: option.name,
      price:
        flat.reduce(
          (sum, { g, o }) => sum + o.price * (g.multiple ? countOf(g, o) : 1),
          0,
        ) * qty,
      qty,
      lines: flat.map(({ g, o }) => {
        const line = g.detail ? g.detail(o) : o.name;
        return g.multiple && countOf(g, o) > 1
          ? `${line} ×${countOf(g, o)}`
          : line;
      }),
      mods: flat.map(({ g, o }) => ({
        name: g.detail ? g.detail(o) : o.name,
        qty: g.multiple ? countOf(g, o) : 1,
      })),
      notes: notes.trim() || undefined,
      snap: {
        picks: Object.fromEntries(
          groups.map((g) => [g.id, picked(g).map((o) => o.id)]),
        ),
        counts,
        qty,
        notes,
      },
    });
    close();
  };

  /** Picking an option can reveal groups (Iced -> ice level, preset to its default) or hide ones whose trigger is gone. */
  const choose = (group: ModifierGroup, o: ModifierOption) => {
    if (group.multiple) {
      const already = (picks[group.id] ?? []).some((c) => c.id === o.id);
      if (already) {
        setCounts((prev) => ({
          ...prev,
          [countKey(group, o)]: (prev[countKey(group, o)] ?? 1) + 1,
        }));
        return;
      }
      setCounts((prev) => ({ ...prev, [countKey(group, o)]: 1 }));
    }
    setPicks((prev) => {
      const current = prev[group.id] ?? [];
      const next: Picks = {
        ...prev,
        [group.id]: group.multiple
          ? current.some((c) => c.id === o.id)
            ? current.filter((c) => c.id !== o.id)
            : [...current, o]
          : [o],
      };
      allGroups.forEach((g) => {
        const wasVisible = isVisible(g, prev);
        const nowVisible = isVisible(g, next);
        if (!nowVisible) delete next[g.id];
        else if (!wasVisible) {
          const preset = presetOf(g);
          if (preset) next[g.id] = [preset];
        }
      });
      return next;
    });
  };
  const remove = (group: ModifierGroup, o: ModifierOption) => {
    if (group.multiple && countOf(group, o) > 1) {
      setCounts((prev) => ({
        ...prev,
        [countKey(group, o)]: countOf(group, o) - 1,
      }));
      return;
    }
    setPicks((prev) => ({
      ...prev,
      [group.id]: (prev[group.id] ?? []).filter((c) => c.id !== o.id),
    }));
  };

  return (
    <div
      className={cn(
        figtree.className,
        "absolute inset-0 z-50 flex bg-[#151515] text-white transition-transform duration-300 ease-out",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex h-full w-[900px] shrink-0 flex-col">
        <div className="relative h-[86px] shrink-0 border-b border-[#222] bg-[#151515]">
          <button
            type="button"
            aria-label="Close modifier"
            onClick={close}
            className="absolute top-1/2 left-5 flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border border-[#3a3a3a] transition hover:bg-white/5"
          >
            <Image
              src={`${ASSET}/close.svg`}
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
          </button>
          <div className="absolute top-0 left-[81px] flex h-[86px] w-fit min-w-[120px] max-w-[620px] flex-col items-center justify-between pb-[33px]">
            <div className="h-0.5 w-full rounded-full bg-[#f5dfa8]" />
            <p className="max-w-full truncate px-3 text-xl leading-none font-bold whitespace-nowrap text-[#fff8eb]">
              {option.customisation!.title}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {pickerGroups.map((g, index) => (
            <div key={g.id} className="flex shrink-0 flex-col">
              {index > 0 ? (
                <Image
                  src={`${ASSET}/divider.svg`}
                  alt=""
                  width={900}
                  height={1}
                  className="h-px w-[900px]"
                />
              ) : null}

              {g.layout === "tiles" ? (
                <div className="flex gap-2.5 p-5">
                  {g.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => choose(g, o)}
                      className={cn(
                        "flex h-[100px] w-[164px] items-end rounded-xl bg-[#383736] p-3.5 text-left transition hover:brightness-110",
                        picked(g)[0]?.id === o.id &&
                          "ring-2 ring-white ring-offset-2 ring-offset-[#151515]",
                      )}
                    >
                      <div className="flex flex-col items-start gap-2 leading-none whitespace-nowrap text-[#fff8eb]">
                        <p className="text-base font-semibold">{o.name}</p>
                        <p className="text-sm">{sgd(o.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-5 p-5">
                  <p className="text-lg leading-none font-semibold whitespace-nowrap text-[#fff8eb]">
                    {g.heading}
                  </p>
                  {g.layout === "plain" ? (
                    <div className="flex gap-2.5">
                      {g.options.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => choose(g, o)}
                          className={cn(
                            "flex h-[100px] w-[164px] items-end rounded-xl border bg-[#191919] p-3 text-left transition hover:brightness-125",
                            picked(g)[0]?.id === o.id
                              ? "border-[#f5dfa8]"
                              : "border-[#222]",
                          )}
                        >
                          <p className="text-base leading-none font-semibold text-[#fff8eb]">
                            {o.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : g.options.some((o) => o.image) ? (
                    <div className="grid grid-cols-[repeat(3,280px)] gap-2.5">
                      {g.options.map((o) => (
                        <OptionCard
                          key={o.id}
                          option={o}
                          priceStyle={g.priceStyle}
                          selected={picked(g).some((c) => c.id === o.id)}
                          count={
                            g.multiple && picked(g).some((c) => c.id === o.id)
                              ? countOf(g, o)
                              : undefined
                          }
                          onDecrement={() => remove(g, o)}
                          onClick={() => choose(g, o)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {g.options.map((o) => (
                        <OptionCard
                          key={o.id}
                          option={o}
                          priceStyle={g.priceStyle}
                          compact
                          selected={picked(g).some((c) => c.id === o.id)}
                          count={
                            g.multiple && picked(g).some((c) => c.id === o.id)
                              ? countOf(g, o)
                              : undefined
                          }
                          onDecrement={() => remove(g, o)}
                          onClick={() => choose(g, o)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-full w-[380px] shrink-0 flex-col bg-[#131313]">
        <div className="flex h-[86px] shrink-0 items-center px-4">
          <p className="text-xl leading-none font-bold whitespace-nowrap text-[#fff8eb]">
            Modifier
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pt-5">
          {groups.map((g) => {
            const removable = g.layout !== "tiles" && g.layout !== "hidden";
            return (
              <SummaryCard
                key={g.id}
                label={g.label}
                status={
                  g.optional
                    ? "none"
                    : picked(g).length
                      ? "fulfilled"
                      : "required"
                }
                pills={picked(g).map((o) => ({
                  key: o.id,
                  name: o.name,
                  detail: g.priceStyle
                    ? `${g.priceStyle === "addon" ? "+" : ""}${sgd(o.price)}`
                    : undefined,
                  qty: g.multiple ? countOf(g, o) : undefined,
                  onRemove: removable ? () => remove(g, o) : undefined,
                  onAdd: g.multiple ? () => choose(g, o) : undefined,
                }))}
              />
            );
          })}
        </div>
        <ModifierFooter
          notesPlaceholder="Add item notes"
          notes={notes}
          onNotes={setNotes}
          qty={qty}
          onQty={setQty}
          canSave={complete}
          onSave={save}
        />
      </div>
    </div>
  );
}

/**
 * Figma: Pulse, nodes 2824:18166 / 2854:77 ("Combo Meal"). Opened from a dish row that has
 * required option groups. Left: the groups and the options of the active group; right: the
 * combo summary, where a filled group shows what was picked in full. Save Modifier unlocks
 * once every group is chosen. Options that carry their own `customisation` (Latte, the
 * mains) open the OptionSheet over this page.
 */
function ComboScreen({
  dish,
  category,
  initial,
  onBack,
  onSave,
}: {
  dish: Dish;
  category: string;
  /** Reopen a bucket line: its picks, quantity and notes. */
  initial?: { selected: Record<string, Chosen>; qty: number; notes: string };
  onBack: () => void;
  onSave: (save: ComboSave) => void;
}) {
  const menu = useMenu();
  const groups = useMemo(() => modifierGroupsFor(dish, menu)!, [dish, menu]);
  const [selected, setSelected] = useState<Record<string, Chosen>>(initial?.selected ?? {});
  const [activeId, setActiveId] = useState(groups[0].id);
  const [sheetOption, setSheetOption] = useState<ModifierOption | null>(null);
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const active = groups.find((g) => g.id === activeId) ?? groups[0];
  const complete = groups.every((g) => selected[g.id]);
  const addOns = Object.values(selected).reduce((sum, c) => sum + c.price, 0);

  const choose = (groupId: string, chosen: Chosen) => {
    setSelected((prev) => ({ ...prev, [groupId]: chosen }));
    // move on to the next group that still needs a choice
    const next = groups.find((g) => g.id !== groupId && !selected[g.id]);
    if (next) setActiveId(next.id);
  };
  const pick = (option: ModifierOption) => {
    if (option.customisation) setSheetOption(option);
    else
      choose(active.id, {
        optionId: option.id,
        name: option.name,
        price: option.price,
        qty: 1,
        lines: [],
        mods: [],
      });
  };

  const save = () => {
    if (!complete) return;
    onSave({
      modifiers: groups.map(
        (g) => `${g.label}: ${optionLabel(selected[g.id])}`,
      ),
      choices: groups.map((g) => ({
        label: g.label,
        name: selected[g.id].name,
        qty: selected[g.id].qty,
        mods: selected[g.id].mods,
        notes: selected[g.id].notes,
      })),
      unitPrice: dish.price + addOns,
      qty,
      notes: notes.trim() || undefined,
      edit: { combo: { selected, notes } },
    });
  };

  const crumb = (text: string, current?: boolean) => (
    <div
      className="flex h-[86px] flex-col items-center justify-between pb-[33px]"
      style={{ width: current ? 150 : 130 }}
    >
      <div
        className={cn(
          "h-0.5 w-full rounded-full",
          current ? "bg-[#f5dfa8]" : "bg-[#151515]",
        )}
      />
      <p
        className={cn(
          "max-w-full truncate text-xl leading-none font-bold whitespace-nowrap",
          current ? "text-[#fff8eb]" : "text-[#595959]",
        )}
      >
        {text}
      </p>
    </div>
  );
  const chevron = (
    <Image
      src={`${ASSET}/chevron-right.svg`}
      alt=""
      width={24}
      height={24}
      className="mt-[31px] size-6 shrink-0"
    />
  );

  return (
    <div
      className={cn(
        figtree.className,
        "relative flex size-full overflow-hidden bg-[#151515] text-white",
      )}
    >
      {/* ------------------------------ combo options ----------------------------- */}
      <div className="flex h-full w-[900px] shrink-0 flex-col">
        <div className="relative h-[86px] shrink-0 border-b border-[#222] bg-[#151515]">
          <button
            type="button"
            aria-label="Back to dishes"
            onClick={onBack}
            className="absolute top-1/2 left-5 flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border border-[#3a3a3a] transition hover:bg-white/5"
          >
            <Image
              src={`${ASSET}/close.svg`}
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
          </button>
          <div className="absolute top-0 left-[81px] flex items-start gap-3">
            <button type="button" onClick={onBack} className="text-left">
              {crumb(category.toUpperCase())}
            </button>
            {chevron}
            {crumb(dish.name)}
            {chevron}
            {crumb("Combo Meal", true)}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex shrink-0 gap-2.5 p-5">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveId(g.id)}
                className={cn(
                  "flex h-[100px] w-[164px] flex-col items-start justify-between rounded-xl bg-[#383736] p-2.5 text-left transition hover:brightness-110",
                  active.id === g.id &&
                    "ring-2 ring-white ring-offset-2 ring-offset-[#151515]",
                )}
              >
                <div className="flex w-full justify-end">
                  {selected[g.id] ? <FulfilledChip /> : <RequiredChip />}
                </div>
                <div className="flex w-full flex-col gap-1.5 leading-none text-[#fff8eb]">
                  <p className="text-sm font-semibold">{g.label}</p>
                  {selected[g.id] ? (
                    <p className="truncate text-xs text-[#afaca2]">
                      {selected[g.id].name}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <Image
            src={`${ASSET}/divider.svg`}
            alt=""
            width={900}
            height={1}
            className="h-px w-[900px] shrink-0"
          />

          <div className="flex shrink-0 flex-col gap-5 p-5">
            <p className="text-sm leading-none font-semibold whitespace-nowrap text-[#fff8eb]">
              Select {active.heading} Option
            </p>
            <div className="grid grid-cols-[repeat(3,280px)] gap-2.5">
              {active.options.map((option) =>
                option.image ? (
                  <PhotoOptionCard
                    key={option.id}
                    option={option}
                    selected={selected[active.id]?.optionId === option.id}
                    onClick={() => pick(option)}
                  />
                ) : (
                  <OptionCard
                    key={option.id}
                    option={option}
                    selected={selected[active.id]?.optionId === option.id}
                    onClick={() => pick(option)}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------- combo summary ------------------------------ */}
      <div className="flex h-full w-[380px] shrink-0 flex-col bg-[#131313]">
        <div className="flex h-[86px] shrink-0 items-center px-4">
          <p className="text-xl leading-none font-bold whitespace-nowrap text-[#fff8eb]">
            Combo Summary
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pt-5">
          {groups.map((g) => (
            <SummaryCard
              key={g.id}
              label={g.label}
              status={selected[g.id] ? "fulfilled" : "required"}
              onClick={() => setActiveId(g.id)}
            >
              {selected[g.id] ? <ChosenDetail chosen={selected[g.id]} /> : null}
            </SummaryCard>
          ))}
        </div>

        <ModifierFooter
          notesPlaceholder="Add order notes"
          notes={notes}
          onNotes={setNotes}
          qty={qty}
          onQty={setQty}
          canSave={complete}
          onSave={save}
        />
      </div>

      {sheetOption ? (
        <OptionSheet
          option={sheetOption}
          initial={selected[active.id]?.optionId === sheetOption.id ? selected[active.id].snap : undefined}
          onClose={() => setSheetOption(null)}
          onSave={(chosen) => choose(active.id, chosen)}
        />
      ) : null}
    </div>
  );
}

/**
 * Figma: Pulse, node 2820:17259 ("Pulse Dark") — the full-screen POS order page the
 * waiter reaches from "Add Order" in the order-detail dialog. Left: category tiles
 * and the Pulse recommendation strip; right: the order bucket, which is the live
 * `waiter.cart`. Confirm Order submits it and drops back to the open table dialog.
 */
/** Width the delete action rests at once a line is swiped open. */
const REVEAL = 104;
/** Share of the card width past which letting go deletes straight away. */
const FULL_SWIPE = 0.6;
/** Bucket column (380) minus its side padding. */
const LINE_WIDTH = 340;
const SNAP = "transform 380ms cubic-bezier(0.34, 1.32, 0.64, 1)";

const TrashIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
  </svg>
);

/**
 * One order bucket line. Swipe left to reveal "Remove all"; swipe far enough and let go to
 * delete outright. Vertical drags still scroll the bucket.
 */
function BucketLine({
  line,
  open,
  onOpen,
  onClose,
  onTouch,
  onEdit,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  line: CartLine;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Any touch on this line closes whichever other line is open. */
  onTouch: () => void;
  /** Tap on the card body; only passed for lines that have modifiers or a combo to change. */
  onEdit?: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const t = usePosTheme();
  const drag = useRef<{
    x: number;
    y: number;
    base: number;
    axis: "x" | "y" | null;
    lastX: number;
    lastT: number;
    v: number;
  } | null>(null);
  const moved = useRef(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "leaving" | "collapsing">("idle");

  const offset = phase !== "idle" ? -LINE_WIDTH - 24 : (dragX ?? (open ? -REVEAL : 0));
  const pull = Math.max(0, -offset);
  const armed = dragX !== null && pull > LINE_WIDTH * FULL_SWIPE;

  const remove = () => {
    if (phase !== "idle") return;
    setDragX(null);
    setPhase("leaving");
    setTimeout(() => setPhase("collapsing"), 220);
    setTimeout(onRemove, 460);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "idle") return;
    onTouch();
    moved.current = false;
    drag.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, axis: null, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "x") {
        moved.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
    if (d.axis !== "x") return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    const raw = d.base + dx;
    // rubber-band past the closed edge and the far edge
    const max = LINE_WIDTH;
    setDragX(raw > 0 ? raw * 0.2 : raw < -max ? -max + (raw + max) * 0.2 : raw);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.axis !== "x" || dragX === null) return;
    if (armed) return remove();
    setDragX(null);
    if (d.v < -0.4 || (d.v <= 0.4 && dragX < -REVEAL / 2)) onOpen();
    else onClose();
  };

  const progress = Math.min(1, pull / REVEAL);

  return (
    <li
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-[240ms] ease-out",
        phase === "collapsing" ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative mb-3">
          {/* delete action, sits under the card and grows with the drag */}
          <button
            type="button"
            aria-label={`Remove all ${line.name}`}
            tabIndex={open ? 0 : -1}
            onClick={remove}
            className="absolute inset-y-0 right-0 flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-[#e5484d] text-white"
            style={{
              width: Math.max(REVEAL - 8, pull - 8),
              opacity: progress,
              transition: dragX === null ? "width 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms" : undefined,
            }}
          >
            <span
              className="flex flex-col items-center gap-1 transition-transform duration-200"
              style={{ transform: `scale(${armed ? 1.15 : 0.7 + progress * 0.3})` }}
            >
              <TrashIcon className="size-5" />
              <span className="text-xs leading-none font-semibold whitespace-nowrap">
                {armed ? "Release" : "Remove all"}
              </span>
            </span>
          </button>

          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={(e) => {
              if (moved.current) {
                e.stopPropagation();
                e.preventDefault();
                moved.current = false;
              } else if (open) {
                e.stopPropagation();
                onClose();
              } else if (onEdit && !(e.target as HTMLElement).closest("button")) {
                onEdit();
              }
            }}
            className={cn(
              "relative flex touch-pan-y flex-col gap-3 rounded-xl border p-3.5 select-none",
              onEdit && "cursor-pointer hover:brightness-110 active:brightness-95",
              t.line,
            )}
            style={{
              transform: `translateX(${offset}px)`,
              transition: dragX === null ? (phase === "leaving" ? "transform 220ms ease-in" : SNAP) : undefined,
            }}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-base leading-tight font-semibold", t.ink)}>{line.name}</p>
                {onEdit ? (
                  <span className={cn("flex shrink-0 items-center gap-1 text-xs leading-none font-medium", t.meta)}>
                    <PencilIcon className="size-3.5" />
                    Edit
                  </span>
                ) : null}
              </div>
              {line.choices ? (
                <div className="flex flex-col gap-2">
                  {line.choices.map((c, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      {c.name ? (
                        <p className={cn("text-sm leading-tight font-medium", t.sub)}>
                          {c.label ? <span className={cn("font-normal", t.meta)}>{c.label}: </span> : null}
                          {c.qty > 1 ? `${c.qty}x ` : ""}
                          {c.name}
                        </p>
                      ) : null}
                      {c.mods.map((m) => (
                        <p key={m.name} className={cn("text-[13px] leading-tight", t.meta, c.name && "pl-3")}>
                          {m.qty > 1 ? `${m.qty}x ` : ""}
                          {m.name}
                        </p>
                      ))}
                      {c.notes ? (
                        <p className={cn("text-[13px] leading-tight italic", t.meta, c.name && "pl-3")}>
                          “{c.notes}”
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {line.notes ? (
                <p className={cn("text-[13px] leading-tight italic", t.meta)}>“{line.notes}”</p>
              ) : null}
            </div>

            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className={cn("text-base leading-none font-bold tabular-nums", t.ink)}>
                  {currency(line.unitPrice * line.qty)}
                </p>
                {line.qty > 1 ? (
                  <p className={cn("text-xs leading-none tabular-nums", t.meta)}>
                    {currency(line.unitPrice)} each
                  </p>
                ) : null}
              </div>
              <div className={cn("flex items-center gap-1 rounded-full p-0.5", t.stepWrap)}>
                <button
                  type="button"
                  aria-label={line.qty > 1 ? `Remove one ${line.name}` : `Remove ${line.name}`}
                  onClick={line.qty > 1 ? onDecrement : remove}
                  className={cn("flex size-8 items-center justify-center rounded-full transition active:scale-90", t.stepBtn)}
                >
                  {line.qty > 1 ? (
                    <span className="h-[1.5px] w-3 rounded-full bg-current" />
                  ) : (
                    <TrashIcon className="size-4" />
                  )}
                </button>
                <span
                  key={line.qty}
                  className={cn("animate-count-pop min-w-6 text-center text-base leading-none font-bold tabular-nums", t.ink)}
                >
                  {line.qty}
                </span>
                <button
                  type="button"
                  aria-label={`Add one ${line.name}`}
                  onClick={onIncrement}
                  className={cn("flex size-8 items-center justify-center rounded-full transition active:scale-90", t.stepBtn)}
                >
                  <span className="relative size-3">
                    <span className="absolute top-1/2 left-0 h-[1.5px] w-3 -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute top-0 left-1/2 h-3 w-[1.5px] -translate-x-1/2 rounded-full bg-current" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function PosOrderScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const tableId = useSim(
    (s) => s.waiter.openTableId ?? s.waiter.selectedTableId,
  );
  const cart = useSim((s) => s.waiter.cart);
  /** Open category (and subcategory) live in the store so scenario steps can drive them. */
  const pos = useSim((s) => s.waiter.pos);
  const activeCategory = pos?.categoryId ?? null;
  /** Figma 2912:15818: the header search swaps the category grid for matching dishes across every category. */
  const [searching, setSearching] = useState(false);
  /** Pulse recommendations auto-hide once a category opens; the bottom-left tile brings them back. */
  const [showReco, setShowReco] = useState(true);
  // opening a category hides the recommendations, closing one brings them back
  const [shownFor, setShownFor] = useState(activeCategory);
  if (shownFor !== activeCategory) {
    setShownFor(activeCategory);
    setShowReco(!activeCategory);
  }
  const [query, setQuery] = useState("");
  /** Dish whose combo options are being filled in, if any. */
  const [combo, setCombo] = useState<Dish | null>(null);
  /** Dish with its own modifier sheet (no combo page), if one is open. */
  const [sheetDish, setSheetDish] = useState<Dish | null>(null);
  /** Bucket line swiped open to show its delete action; one at a time. */
  const [openLineId, setOpenLineId] = useState<string | null>(null);
  /** Bucket line being edited through the combo page or option sheet; saving replaces it. */
  const [editLine, setEditLine] = useState<CartLine | null>(null);

  const menu = useMenu();
  const categories = menu.tablet;
  const openCategory = categories.find((c) => c.id === activeCategory);
  const dishes = openCategory?.dishes ?? [];
  /** Figma 3124:186: categories with subcategories open their own page instead of expanding inline. */
  const subcategories = openCategory?.subcategories?.length ? openCategory.subcategories : null;
  const activeSub = subcategories
    ? (subcategories.find((s) => s.id === pos?.subcategoryId) ?? subcategories[0])
    : null;
  const closeCategory = () => dispatch({ type: "waiter/pos-close-category" });
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    return categories.flatMap((c) => c.dishes).filter((d) => {
      if (seen.has(d.id) || !d.name.toLowerCase().includes(q)) return false;
      seen.add(d.id);
      return true;
    });
  }, [categories, query]);
  const closeSearch = () => {
    setSearching(false);
    setQuery("");
    setShowReco(true);
  };
  const recommendations = useMemo(
    () => menu.mobileDishes.slice(0, RECOMMENDATION_COUNT),
    [menu],
  );

  const qtyInBucket = (itemId: string) =>
    cart.find((l) => l.itemId === itemId)?.qty ?? 0;
  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const addDish = (dish: Dish) => {
    if (!tableId) return;
    dispatch({
      type: "waiter/add-to-cart",
      tableId,
      line: { itemId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1 },
    });
  };
  /** Combo dishes open the modifier page; plain dishes go straight into the bucket. */
  const pickDish = (dish: Dish) => {
    if (modifierGroupsFor(dish, menu)) setCombo(dish);
    else if (standaloneCustomisationFor(dish)) setSheetDish(dish);
    else addDish(dish);
  };
  /** Save goes back into the line being edited, otherwise into a new one. */
  const putLine = (line: Omit<CartLine, "lineId">) => {
    if (!tableId) return;
    if (editLine) dispatch({ type: "waiter/replace-cart-line", lineId: editLine.lineId, line });
    else dispatch({ type: "waiter/add-to-cart", tableId, line });
    setEditLine(null);
  };
  const editableDish = (line: CartLine): Dish | undefined => menu.byId[line.itemId];
  const startEdit = (line: CartLine) => {
    const dish = editableDish(line);
    if (!dish || !line.edit) return;
    setEditLine(line);
    if (line.edit.combo) setCombo(dish);
    else setSheetDish(dish);
  };
  const saveSheet = (dish: Dish, chosen: Chosen) => {
    putLine({
      itemId: dish.id,
      name: dish.name,
      unitPrice: dish.price + chosen.price / chosen.qty,
      qty: chosen.qty,
      modifiers: chosen.lines,
      choices: [{ qty: 1, mods: chosen.mods }],
      notes: chosen.notes,
      edit: chosen.snap ? { sheet: chosen.snap } : undefined,
    });
  };
  const saveCombo = (dish: Dish, save: ComboSave) => {
    putLine({
      itemId: dish.id,
      name: dish.name,
      unitPrice: save.unitPrice,
      qty: save.qty,
      modifiers: save.modifiers,
      choices: save.choices,
      notes: save.notes,
      edit: save.edit,
    });
    setCombo(null);
  };
  const confirm = () => {
    if (!tableId || cart.length === 0) return;
    dispatch({ type: "waiter/submit-order", tableId });
  };

  const t = usePosTheme();

  if (combo) {
    return (
      <ComboScreen
        dish={combo}
        category={
          categories.find((c) => c.id === activeCategory)?.name ??
          categories.find((c) => c.dishIds.includes(combo.id))?.name ??
          ""
        }
        initial={
          editLine?.edit?.combo
            ? { selected: editLine.edit.combo.selected, qty: editLine.qty, notes: editLine.edit.combo.notes }
            : undefined
        }
        onBack={() => {
          setCombo(null);
          setEditLine(null);
        }}
        onSave={(save) => saveCombo(combo, save)}
      />
    );
  }

  return (
    <div
      className={cn(
        figtree.className,
        "relative flex size-full",
        t.page,
      )}
    >
      {/* ------------------------------ select dish ----------------------------- */}
      {openCategory && activeSub ? (
        <SubcategoryPage
          category={openCategory}
          active={activeSub}
          qtyInBucket={qtyInBucket}
          onBack={closeCategory}
          onPickSub={(subcategoryId) => dispatch({ type: "waiter/pos-pick-subcategory", subcategoryId })}
          onPickDish={pickDish}
        />
      ) : (
      <div className="flex h-full w-[900px] shrink-0 flex-col">
        <div className={cn("relative h-[86px] shrink-0 border-b", searching ? t.searchLine : t.header)}>
          {searching ? (
            <>
              <Image
                src={`${ASSET}/search-lg.svg`}
                alt=""
                width={24}
                height={24}
                className={cn("absolute top-[31px] left-5 size-6", t.iconInv)}
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search all item"
                aria-label="Search all item"
                className={cn(
                  "absolute top-0 left-[81px] h-[86px] w-[720px] bg-transparent text-xl leading-none font-bold outline-none placeholder:text-current",
                  t.title,
                )}
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={closeSearch}
                className={cn(
                  "absolute top-1/2 left-[834px] flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border transition",
                  t.closeBtn,
                )}
              >
                <Image src={`${ASSET}/${t.closeIcon}`} alt="" width={24} height={24} className="size-6" />
              </button>
            </>
          ) : (
            <>
          <button
            type="button"
            aria-label="Close POS order"
            onClick={() => dispatch({ type: "waiter/close-pos" })}
            className={cn(
              "absolute top-1/2 left-5 flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border transition",
              t.closeBtn,
            )}
          >
            <Image
              src={`${ASSET}/${t.closeIcon}`}
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
          </button>
          <div className="absolute top-0 left-[81px] flex h-[86px] w-[120px] flex-col items-center justify-between pb-[33px]">
            <div className={cn("h-0.5 w-full rounded-full", t.tab)} />
            <p className={cn("text-xl leading-none font-bold whitespace-nowrap", t.title)}>
              Select Dish
            </p>
          </div>
              <button
                type="button"
                aria-label="Search all item"
                onClick={() => {
                  closeCategory();
                  setSearching(true);
                  setShowReco(false);
                }}
                className={cn(
                  "absolute top-1/2 left-[834px] flex size-[46px] -translate-y-1/2 items-center justify-center rounded-xl border transition",
                  t.closeBtn,
                )}
              >
                <Image src={`${ASSET}/search.svg`} alt="" width={24} height={24} className={cn("size-6", t.iconInv)} />
              </button>
            </>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {searching ? (
            <div className="grid shrink-0 grid-cols-[repeat(3,280px)] gap-2.5 p-5">
              {searchResults.map((dish) => (
                <DishRowCard
                  key={dish.id}
                  dish={dish}
                  inBucket={qtyInBucket(dish.id)}
                  onAdd={() => pickDish(dish)}
                />
              ))}
              {query.trim() && searchResults.length === 0 ? (
                <p className={cn("col-span-3 text-sm", t.meta)}>No dishes found for &ldquo;{query.trim()}&rdquo;.</p>
              ) : null}
            </div>
          ) : (
          <div className="grid shrink-0 grid-cols-5 gap-2.5 p-5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  activeCategory === c.id
                    ? closeCategory()
                    : dispatch({ type: "waiter/pos-open-category", categoryId: c.id })
                }
                className={cn(
                  "flex h-20 w-[164px] flex-col items-start justify-end gap-1 rounded-xl p-3.5 text-left leading-none text-white transition hover:brightness-110",
                  activeCategory === c.id && t.ring,
                )}
                style={{ backgroundColor: c.color }}
              >
                <span className="w-full text-sm leading-none font-semibold break-words">{c.name}</span>
                <span className="text-xs">{c.dishes.length} Items</span>
              </button>
            ))}
          </div>
          )}

          {!searching && activeCategory ? (
            <>
              <Divider tone={t.divider} className="h-px w-[900px] shrink-0" />
              <div className="grid shrink-0 grid-cols-[repeat(3,280px)] gap-2.5 p-5">
                {dishes.map((dish) => (
                  <DishRowCard
                    key={dish.id}
                    dish={dish}
                    inBucket={qtyInBucket(dish.id)}
                    onAdd={() => pickDish(dish)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div
          aria-hidden={!showReco || searching ? true : undefined}
          className={cn(
            "relative shrink-0 overflow-hidden transition-[height,opacity] duration-300 ease-out",
            !showReco || searching ? "pointer-events-none h-0 opacity-0" : "h-[278px] opacity-100",
          )}
        >
          <Divider tone={t.divider} className="absolute top-0 left-0 h-px w-[900px]" />
          <div className="absolute top-5 left-5 flex items-start gap-1">
            <Image
              src={`${ASSET}/${t.sparkle}`}
              alt=""
              width={16}
              height={16}
              className="size-4"
            />
            <p className={cn("text-base leading-none font-semibold whitespace-nowrap", t.reco)}>
              Pulse Dish Recommendation
            </p>
          </div>
          <div className="absolute top-14 left-5 grid grid-cols-[repeat(3,280px)] gap-2.5">
            {recommendations.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                inBucket={qtyInBucket(dish.id)}
                showBadges
                onAdd={() => pickDish(dish)}
              />
            ))}
          </div>
        </div>

        <div
          aria-hidden={showReco || searching ? true : undefined}
          className={cn(
            "shrink-0 overflow-hidden transition-[height,opacity] duration-300 ease-out",
            showReco || searching ? "pointer-events-none h-0 opacity-0" : "h-[66px] opacity-100",
          )}
        >
          <button
            type="button"
            onClick={() => setShowReco(true)}
            className="ml-5 flex items-end gap-1 rounded-xl border-[1.333px] border-[#e8bc6b] bg-gradient-to-b from-[#e8bc6b] to-[#a87d1d] p-3.5 transition hover:brightness-110"
          >
            <Image src={`${ASSET}/sparkle-white.svg`} alt="" width={16} height={16} className="size-4" />
            <span className="text-sm leading-none font-semibold whitespace-nowrap text-white">
              Pulse Dish Recommendation
            </span>
          </button>
        </div>
      </div>
      )}

      {/* ----------------------------- order bucket ----------------------------- */}
      <div className={cn("flex h-full w-[380px] shrink-0 flex-col", t.bucket)}>
        <div className="flex h-[86px] shrink-0 items-center px-4">
          <p className={cn("text-xl leading-none font-bold whitespace-nowrap", t.ink)}>
            Order Bucket
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <EmptyBucket />
          ) : (
            <ul className="flex flex-col">
              {cart.map((line) => (
                <BucketLine
                  key={line.lineId}
                  line={line}
                  open={openLineId === line.lineId}
                  onOpen={() => setOpenLineId(line.lineId)}
                  onClose={() => setOpenLineId((id) => (id === line.lineId ? null : id))}
                  onTouch={() => setOpenLineId((id) => (id === line.lineId ? id : null))}
                  onEdit={line.edit && editableDish(line) ? () => startEdit(line) : undefined}
                  onIncrement={() => dispatch({ type: "waiter/increment-cart-line", lineId: line.lineId })}
                  onDecrement={() => dispatch({ type: "waiter/decrement-cart-line", lineId: line.lineId })}
                  onRemove={() => dispatch({ type: "waiter/remove-cart-line", lineId: line.lineId })}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-4 px-5 pb-5">
          <div className={cn("flex items-center justify-between leading-none", t.ink)}>
            <p className="text-base">Subtotal</p>
            <p className="text-right text-base font-bold">
              {currency(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={cart.length === 0}
            className={cn(
              "flex h-[46px] items-center justify-center rounded-xl p-4 transition",
              cart.length === 0
                ? t.confirmOff
                : cn(t.confirmOn, "hover:brightness-105"),
            )}
          >
            <span className="text-sm leading-none font-bold whitespace-nowrap">
              Confirm Order
            </span>
          </button>
        </div>
      </div>

      {sheetDish ? (
        <OptionSheet
          option={{
            id: sheetDish.id,
            name: sheetDish.name,
            price: 0,
            customisation: standaloneCustomisationFor(sheetDish)!,
          }}
          initial={editLine?.edit?.sheet ? { ...editLine.edit.sheet, qty: editLine.qty } : undefined}
          onClose={() => {
            setSheetDish(null);
            setEditLine(null);
          }}
          onSave={(chosen) => saveSheet(sheetDish, chosen)}
        />
      ) : null}
    </div>
  );
}
