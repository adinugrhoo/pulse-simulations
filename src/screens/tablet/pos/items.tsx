"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { DishImage } from "@/menu/DishImage";
import { imageUrl } from "@/menu/resolve";
import { formatDays, formatRange, formatWindow, type ScheduleState } from "@/menu/schedule";
import type { Dish } from "@/menu/types";
import type { CartLine } from "@/engine/types";
import type { ModifierOption } from "@/config/global/modifiers";
import { currency } from "@/engine/types";
import { useTokens } from "@/theme/hooks";
import type { TabletTokens } from "@/theme/tokens";

/**
 * The item building blocks of the waiter POS (Phase 2): dish cards, option cards and the
 * order bucket line. `PosOrderScreen` composes them; `/design-system` renders the same
 * components with every state switchable.
 *
 * Props marked "proposed" are states the sim never reaches yet (sold out, promo price,
 * tags, ...). They default off, so the POS renders exactly as before.
 */

export const ASSET = "/figma/tablet-pos";

/** Placeholder photo for dishes the merchant hasn't given an image. */
const NO_IMAGE = `${ASSET}/no-image.svg`;

/** Lets the design system pin a theme's POS tokens without switching the live theme. */
export const PosTokensOverride = createContext<TabletTokens["pos"] | null>(null);

/**
 * Look of the select-dish page, from the active theme's `tablet/tokens.ts`. Dark is the
 * original; Light (Figma 2821:17567) and Foodpanda (2821:17671) share one layout and
 * differ in accent and the order bucket tint.
 */
export const usePosTheme = () => {
  const live = useTokens("tablet").pos;
  return useContext(PosTokensOverride) ?? live;
};

export const sgd = (value: number) => `SGD ${value.toFixed(2)}`;

/** Proposed: stock state of a dish. "low" shows how many are left, "soldOut" disables the card. */
export type Availability = "available" | "low" | "soldOut";

/** Proposed extras shared by both dish cards. */
export type DishCardExtras = {
  availability?: Availability;
  /** Portions left, shown when `availability` is "low". */
  stockLeft?: number;
  /** Discounted price; the regular price is struck through next to it. */
  promoPrice?: number;
  /** Renders `dish.tags`: the first one in full, the rest as "+N". */
  showTags?: boolean;
  /** The dish opens a modifier or combo page instead of going straight into the bucket. */
  customisable?: boolean;
  /**
   * Set while the dish's merchant schedule (time-based display) blocks it. The card greys
   * out and prints when it's back ("Available at 22:00"); a tap opens the full schedule
   * instead of adding, since a touch screen has no hover.
   */
  unavailable?: ScheduleState;
  /** Controls the schedule popover (the design system pins it open); uncontrolled when unset. */
  infoOpen?: boolean;
  onInfoOpenChange?: (open: boolean) => void;
  /** "auto" flips the popover above the card near the bottom of the list. */
  infoPlacement?: "auto" | "below";
};

const InfoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" className={cn("size-3 shrink-0", className)} aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 7.25v4M8 4.9v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** The card's one-line schedule label, with an info mark saying a tap shows more. */
function ScheduleLabel({ state, className }: { state: ScheduleState; className: string }) {
  return (
    <p className={cn("flex max-w-full items-center gap-1 text-[11px] leading-tight font-semibold", className)}>
      <span className="truncate">{state.label}</span>
      <InfoIcon />
    </p>
  );
}

const useInfoOpen = (infoOpen?: boolean, onInfoOpenChange?: (open: boolean) => void) => {
  const [own, setOwn] = useState(false);
  return [infoOpen ?? own, onInfoOpenChange ?? setOwn] as const;
};

/** Height the popover needs; it flips above the card when the list has less room below. */
const POPOVER_ROOM = 210;

/**
 * Wraps a scheduled dish card: the full schedule pops over the list when the card is
 * tapped, and any tap outside closes it.
 */
function ScheduleAnchor({
  state,
  open,
  onOpenChange,
  placement = "auto",
  children,
}: {
  state?: ScheduleState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: "auto" | "below";
  children: ReactNode;
}) {
  const t = usePosTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);

  useLayoutEffect(() => {
    if (!open || !ref.current || placement === "below") return;
    let scroller = ref.current.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const box = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const card = ref.current.getBoundingClientRect();
    // the device frame is scaled: measure in the card's own CSS pixels
    const scale = ref.current.offsetHeight / card.height || 1;
    const below = (box.bottom - card.bottom) * scale;
    const aboveRoom = (card.top - box.top) * scale;
    setAbove(below < POPOVER_ROOM && aboveRoom > below);
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);

  const rows = state
    ? [
        ...(state.rule.dates?.length ? [{ label: "Dates", lines: state.rule.dates.map(formatRange) }] : []),
        { label: "Days", lines: [formatDays(state.rule.days)] },
        { label: "Time", lines: state.rule.times.map(formatWindow) },
      ]
    : [];

  return (
    <div ref={ref} className="relative">
      {children}
      {state && open ? (
        <div
          role="dialog"
          aria-label="Item schedule"
          className={cn(
            "absolute left-0 z-30 flex w-[280px] flex-col gap-3 rounded-xl border p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]",
            t.line,
            placement === "auto" && above ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <div className="flex flex-col gap-1">
            <span className={cn("flex items-center gap-1.5 text-xs leading-none font-semibold", t.warn)}>
              <span className="size-1.5 rounded-full bg-current" />
              Unavailable now
            </span>
            <p className={cn("text-base leading-tight font-bold", t.ink)}>{state.label}</p>
          </div>
          <dl className={cn("flex flex-col gap-2 border-t border-current/10 pt-3 text-[13px] leading-snug", t.meta)}>
            {rows.map((r) => (
              <div key={r.label} className="flex gap-3">
                <dt className="w-11 shrink-0">{r.label}</dt>
                <dd className={cn("flex flex-col font-medium", t.ink)}>
                  {r.lines.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

/** Figma prints 75% / 4x on every recommendation card — there is no scoring model to read. */
const MATCH_PCT = 75;
const REORDER_COUNT = 4;

function Price({ price, promoPrice, strike }: { price: number; promoPrice?: number; strike: string }) {
  if (promoPrice === undefined || promoPrice >= price) return <p className="text-xs">{sgd(price)}</p>;
  return (
    <p className="flex items-baseline gap-1.5 text-xs">
      <span className="font-semibold text-[#ff8a5c]">{sgd(promoPrice)}</span>
      <span className={cn("text-[10px] line-through", strike)}>{sgd(price)}</span>
    </p>
  );
}

function TagChips({ tags, className }: { tags?: string[]; className?: string }) {
  if (!tags?.length) return null;
  const [first, ...rest] = tags;
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      <span className="rounded bg-[#37774d]/80 px-1.5 py-[3px] text-[10px] leading-none font-medium whitespace-nowrap text-[#d9f7e3]">
        {first}
      </span>
      {rest.length ? (
        <span className="rounded bg-white/15 px-1.5 py-[3px] text-[10px] leading-none font-medium text-white">
          +{rest.length}
        </span>
      ) : null}
    </span>
  );
}

function StockChip({ availability, stockLeft }: { availability?: Availability; stockLeft?: number }) {
  if (availability === "soldOut")
    return (
      <span className="rounded bg-[#e5484d] px-1.5 py-[3px] text-[10px] leading-none font-semibold whitespace-nowrap text-white">
        Sold out
      </span>
    );
  if (availability === "low")
    return (
      <span className="rounded bg-[#f5a524] px-1.5 py-[3px] text-[10px] leading-none font-semibold whitespace-nowrap text-[#1b1b1a]">
        {stockLeft ?? 3} left
      </span>
    );
  return null;
}

const CustomisableHint = ({ className }: { className?: string }) => (
  <span className={cn("text-[10px] leading-none font-medium whitespace-nowrap", className)}>Customisable</span>
);

export function DishCard({
  dish,
  inBucket,
  showBadges,
  onAdd,
  availability,
  stockLeft,
  promoPrice,
  showTags,
  customisable,
  unavailable,
  infoOpen,
  onInfoOpenChange,
  infoPlacement,
}: {
  dish: Dish;
  inBucket: number;
  showBadges?: boolean;
  onAdd: () => void;
} & DishCardExtras) {
  // the menu's soldOut flag is the live source; `availability` lets the design system force a state
  const stock = availability ?? (dish.soldOut ? "soldOut" : undefined);
  const soldOut = stock === "soldOut";
  const blocked = soldOut || unavailable !== undefined;
  const [open, setOpen] = useInfoOpen(infoOpen, onInfoOpenChange);
  return (
    <ScheduleAnchor state={unavailable} open={open} onOpenChange={setOpen} placement={infoPlacement}>
      <button
        type="button"
        onClick={unavailable ? () => setOpen(!open) : onAdd}
        disabled={soldOut}
        aria-expanded={unavailable ? open : undefined}
        aria-label={unavailable ? `${dish.name}, ${unavailable.full}` : undefined}
        className={cn(
          "relative flex h-[96px] w-[280px] items-start overflow-hidden rounded-xl border border-[#222] p-2.5 text-left transition hover:brightness-125",
          blocked && "grayscale hover:brightness-100",
          soldOut && "cursor-not-allowed",
        )}
      >
        {dish.image ? (
          <DishImage src={dish.image} alt={dish.name} sizes="280px" eager className={cn("object-cover", blocked && "opacity-40")} />
        ) : (
          // svg: the optimiser won't take it
          <Image src={NO_IMAGE} alt="" fill unoptimized className={cn("object-cover", blocked && "opacity-40")} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] from-[5.729%] to-[rgba(128,128,128,0)]" />

        <div className="relative flex h-full flex-col items-start justify-between">
          {showBadges || stock === "low" || soldOut || (showTags && dish.tags?.length) ? (
            <div className="flex items-start gap-0.5">
              <StockChip availability={stock} stockLeft={stockLeft} />
              {showBadges && !soldOut ? (
                <>
                  <span className="rounded bg-[#00abb6] p-[5px] text-[10px] leading-none font-medium whitespace-nowrap text-white">
                    {MATCH_PCT}% Match
                  </span>
                  <span className="rounded bg-[#6c31cf] p-[5px] text-[10px] leading-none font-medium whitespace-nowrap text-white">
                    {REORDER_COUNT}x Reorder
                  </span>
                </>
              ) : null}
              {showTags ? <TagChips tags={dish.tags} /> : null}
            </div>
          ) : (
            <div className="h-[20px]" />
          )}
          <div className={cn("flex flex-col items-start gap-1.5 leading-none", unavailable ? "text-[#8a8a8a]" : "text-white")}>
            <p className="max-w-[236px] truncate text-sm font-semibold">
              {dish.name}
            </p>
            <div className="flex items-center gap-2">
              <Price price={dish.price} promoPrice={promoPrice} strike="text-white/60" />
              {customisable ? <CustomisableHint className="text-white/70" /> : null}
            </div>
            {unavailable ? <ScheduleLabel state={unavailable} className="max-w-[236px] text-[#f5d58a]" /> : null}
          </div>
        </div>

        {inBucket > 0 ? (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-[#f5dfa8] px-2 py-1 text-[10px] leading-none font-bold text-[#1b1b1a]">
            ×{inBucket}
          </span>
        ) : null}
      </button>
    </ScheduleAnchor>
  );
}

/** Figma 2821:17812: the row card shown when a category is open — name and price bottom-left, photo right. */
export function DishRowCard({
  dish,
  inBucket,
  onAdd,
  availability,
  stockLeft,
  promoPrice,
  showTags,
  customisable,
  unavailable,
  infoOpen,
  onInfoOpenChange,
  infoPlacement,
}: {
  dish: Dish;
  inBucket: number;
  onAdd: () => void;
} & DishCardExtras) {
  const t = usePosTheme();
  // the menu's soldOut flag is the live source; `availability` lets the design system force a state
  const stock = availability ?? (dish.soldOut ? "soldOut" : undefined);
  const soldOut = stock === "soldOut";
  const scheduled = unavailable !== undefined;
  const chips = stock === "low" || soldOut || (showTags && dish.tags?.length);
  const [open, setOpen] = useInfoOpen(infoOpen, onInfoOpenChange);
  return (
    <ScheduleAnchor state={unavailable} open={open} onOpenChange={setOpen} placement={infoPlacement}>
      <button
        type="button"
        onClick={scheduled ? () => setOpen(!open) : onAdd}
        disabled={soldOut}
        aria-expanded={scheduled ? open : undefined}
        aria-label={scheduled ? `${dish.name}, ${unavailable.full}` : undefined}
        className={cn(
          "flex w-[280px] items-end justify-between gap-2 rounded-xl border p-2.5 text-left transition hover:brightness-110",
          t.row,
          soldOut && "cursor-not-allowed opacity-60 hover:brightness-100",
          scheduled && "hover:brightness-100",
        )}
      >
        <div className={cn("flex min-w-px flex-1 flex-col items-start gap-1.5 leading-none", scheduled && t.muted)}>
          {chips ? (
            <span className="mb-auto flex items-center gap-0.5">
              <StockChip availability={stock} stockLeft={stockLeft} />
              {showTags ? <TagChips tags={dish.tags} /> : null}
            </span>
          ) : null}
          <p className="text-sm font-semibold">{dish.name}</p>
          <Price price={dish.price} promoPrice={promoPrice} strike={t.meta} />
          {customisable ? <CustomisableHint className="opacity-60" /> : null}
          {scheduled ? <ScheduleLabel state={unavailable} className={t.warn} /> : null}
        </div>
        <div
          className={cn(
            "relative size-[76px] shrink-0 overflow-hidden rounded-lg bg-white",
            soldOut && "grayscale",
            scheduled && "opacity-40",
          )}
        >
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
            <Image src={NO_IMAGE} alt="" fill sizes="76px" unoptimized className="object-cover" />
          )}
          {inBucket > 0 ? (
            <span className="absolute top-1 right-1 rounded-full bg-[#f5dfa8] px-1.5 py-1 text-[10px] leading-none font-bold text-[#1b1b1a]">
              ×{inBucket}
            </span>
          ) : null}
        </div>
      </button>
    </ScheduleAnchor>
  );
}

export const RequiredChip = () => (
  <span className="rounded-md bg-[rgba(203,113,83,0.2)] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#cb7153]">
    Required
  </span>
);

export const FulfilledChip = () => (
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
export type SummaryPill = {
  key: string;
  name: string;
  detail?: string;
  qty?: number;
  onRemove?: () => void;
  /** Stackable picks also get a + next to the count. */
  onAdd?: () => void;
};

/** Exclamation in a circle: leads every "maximum reached" message. */
const LimitIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="mt-px size-3.5 shrink-0" aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 4.75v4M8 11.1v.15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Right-hand summary card (Figma 2842:583): the group label, a Required / Fulfilled status
 * and a pill per pick. Pills with `onRemove` carry an x that clears that pick. `children`
 * holds richer content, like the combo page's picked-item detail.
 *
 * Groups with a maximum pass `limit`: the card counts picks against it and, once full,
 * says so in place (no snackbar). `nudge` goes up on every blocked add and replays the
 * shake, so a tap past the maximum always gets an answer.
 */
export function SummaryCard({
  label,
  status,
  pills = [],
  limit,
  nudge = 0,
  onClick,
  children,
}: {
  label: string;
  status: "required" | "fulfilled" | "none";
  pills?: SummaryPill[];
  limit?: { used: number; max: number };
  nudge?: number;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const full = limit !== undefined && limit.used >= limit.max;
  const ref = useRef<HTMLDivElement>(null);
  // the add may come from a card on the left while this one is scrolled out of view
  useEffect(() => {
    if (nudge) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [nudge]);
  return (
    <div
      key={nudge}
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 rounded-xl border bg-[#191919] p-3.5 transition-colors",
        full ? "border-[rgba(245,165,36,0.45)]" : "border-[#222]",
        nudge > 0 && "animate-limit-nudge",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-px flex-1 text-base leading-tight font-semibold text-[#fff8eb]">
          {label}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {limit ? (
            full ? (
              <span className="rounded-md bg-[rgba(245,165,36,0.18)] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#f5a524]">
                Max reached
              </span>
            ) : (
              <span className="rounded-md bg-[#222] px-2 py-1.5 text-xs leading-none font-semibold whitespace-nowrap text-[#a0a0a0] tabular-nums">
                {limit.used}/{limit.max}
              </span>
            )
          ) : null}
          {status === "required" ? (
            <RequiredChip />
          ) : status === "fulfilled" ? (
            <FulfilledChip />
          ) : null}
        </div>
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
                    // still tappable when full: the tap is what replays the nudge
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-90",
                      full && "opacity-35",
                    )}
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
      {full ? (
        <p role="status" className="flex items-start gap-1.5 text-[13px] leading-snug text-[#f5a524]">
          <LimitIcon />
          {`Maximum of ${limit.max} reached. Remove one to add another.`}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** A selectable option: name and price bottom-left, optional photo on the right. */
export function OptionCard({
  option,
  priceStyle = "full",
  compact = false,
  selected,
  count,
  onDecrement,
  onClick,
  unavailable,
  groupFull,
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
  /** Proposed: the option ran out; greyed and not pickable. */
  unavailable?: boolean;
  /**
   * The option's group hit its `max`. Unpicked cards dim; every card still takes the tap
   * (the parent nudges the summary card) and shakes, so the tap is never silent.
   */
  groupFull?: boolean;
}) {
  const [nudge, setNudge] = useState(0);
  return (
    <button
      key={nudge}
      type="button"
      onClick={() => {
        if (groupFull) setNudge((n) => n + 1);
        onClick();
      }}
      disabled={unavailable}
      className={cn(
        "relative flex items-end justify-between gap-2 rounded-xl border bg-[#191919] text-left transition hover:brightness-125 active:scale-[0.98]",
        compact ? "h-[100px] w-[164px] p-3" : "h-[98px] w-[280px] p-2.5",
        selected ? "border-[#f5dfa8]" : "border-[#222]",
        groupFull && !count && "opacity-45 hover:brightness-100",
        nudge > 0 && "animate-limit-nudge",
        unavailable && "cursor-not-allowed opacity-50 hover:brightness-100 active:scale-100",
      )}
    >
      <div className="flex min-w-px flex-1 flex-col items-start gap-2 leading-none text-[#fff8eb]">
        <p className="text-base leading-tight font-semibold">{option.name}</p>
        <p className="text-sm text-[#cdcdcd]">
          {unavailable ? (
            "Unavailable"
          ) : (
            <>
              {priceStyle === "addon" ? "+" : ""}
              {sgd(option.price)}
            </>
          )}
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
export function PhotoOptionCard({
  option,
  selected,
  onClick,
  unavailable,
}: {
  option: ModifierOption;
  selected: boolean;
  onClick: () => void;
  /** Proposed: the option ran out; greyed and not pickable. */
  unavailable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={unavailable}
      className={cn(
        "relative flex h-[96px] w-[280px] items-end overflow-hidden rounded-xl p-2.5 text-left transition hover:brightness-125",
        selected && "ring-2 ring-[#f5dfa8]",
        unavailable && "cursor-not-allowed grayscale opacity-60 hover:brightness-100",
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
        <p className="text-xs">{unavailable ? "Unavailable" : sgd(option.price)}</p>
      </div>
    </button>
  );
}


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

/** The modifier page's notes icon (`notes.svg`), inlined so it takes the theme's text colour. */
const NoteIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" />
    <path d="M7 8H15M7 12H17M7 16H13" />
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
export function BucketLine({
  line,
  sent,
  maxQty,
  open,
  onOpen,
  onClose,
  onTouch,
  onEdit,
  onNote,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  line: CartLine;
  /** Proposed: already fired to the kitchen. Locked: no swipe, no stepper, no edit. */
  sent?: boolean;
  /**
   * Proposed: most of this item one order may take. At the cap the + dims and the line
   * says why in place (no snackbar); a tap on it shakes the stepper instead of adding.
   */
  maxQty?: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Any touch on this line closes whichever other line is open. */
  onTouch: () => void;
  /** Tap on the card body; only passed for lines that have modifiers or a combo to change. */
  onEdit?: () => void;
  /**
   * Opens the order-note dialog. Passed for plain dishes, which skip the modifier page
   * (and its notes field) and go straight into the bucket.
   */
  onNote?: () => void;
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
    if (phase !== "idle" || sent) return;
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
  const edit = sent ? undefined : onEdit;
  const capped = maxQty !== undefined && line.qty >= maxQty;
  /** Blocked + taps; keys the stepper so each one replays the shake. */
  const [nudge, setNudge] = useState(0);
  const increment = () => (capped ? setNudge((n) => n + 1) : onIncrement());

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
              } else if (edit && !(e.target as HTMLElement).closest("button")) {
                edit();
              }
            }}
            className={cn(
              "relative flex touch-pan-y flex-col gap-3 rounded-xl border p-3.5 select-none",
              edit && "cursor-pointer hover:brightness-110 active:brightness-95",
              t.line,
              capped && !sent && "border-[rgba(245,165,36,0.45)]",
            )}
            style={{
              transform: `translateX(${offset}px)`,
              transition: dragX === null ? (phase === "leaving" ? "transform 220ms ease-in" : SNAP) : undefined,
            }}
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-base leading-tight font-semibold", t.ink)}>{line.name}</p>
                {sent ? (
                  <span className="shrink-0 rounded-md bg-[rgba(55,119,77,0.4)] px-2 py-1 text-xs leading-none font-semibold whitespace-nowrap text-[#8eecae]">
                    Sent
                  </span>
                ) : edit ? (
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
              {onNote && !sent ? (
                line.notes ? (
                  // the whole note is the edit target: easier to hit than a small link
                  <button
                    type="button"
                    onClick={onNote}
                    aria-label={`Edit note for ${line.name}`}
                    className={cn(
                      "flex min-h-10 w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition active:scale-[0.99]",
                      t.stepWrap,
                    )}
                  >
                    <NoteIcon className={cn("mt-px size-4 shrink-0", t.meta)} />
                    <span className={cn("min-w-px flex-1 text-[13px] leading-snug italic", t.sub)}>“{line.notes}”</span>
                    <span className={cn("flex shrink-0 items-center gap-1 text-xs leading-5 font-medium", t.meta)}>
                      <PencilIcon className="size-3.5" />
                      Edit
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onNote}
                    className={cn(
                      "flex h-9 w-fit items-center gap-1.5 rounded-full px-3 text-[13px] leading-none font-semibold transition active:scale-95",
                      t.stepWrap,
                      t.stepBtn,
                    )}
                  >
                    <NoteIcon className="size-4" />
                    Add note
                  </button>
                )
              ) : line.notes ? (
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
              {sent ? (
                <p className={cn("text-sm leading-none font-semibold tabular-nums", t.meta)}>×{line.qty}</p>
              ) : (
                <div
                  key={nudge}
                  className={cn("flex items-center gap-1 rounded-full p-0.5", t.stepWrap, nudge > 0 && "animate-limit-nudge")}
                >
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
                    onClick={increment}
                    // still tappable when capped: the tap is what replays the nudge
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition active:scale-90",
                      t.stepBtn,
                      capped && "opacity-35",
                    )}
                  >
                    <span className="relative size-3">
                      <span className="absolute top-1/2 left-0 h-[1.5px] w-3 -translate-y-1/2 rounded-full bg-current" />
                      <span className="absolute top-0 left-1/2 h-3 w-[1.5px] -translate-x-1/2 rounded-full bg-current" />
                    </span>
                  </button>
                </div>
              )}
            </div>
            {capped && !sent ? (
              <p role="status" className="flex items-start gap-1.5 text-[13px] leading-snug text-[#d48806]">
                <LimitIcon />
                {`Maximum of ${maxQty} per order reached.`}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/** The POS's action buttons, from the theme tokens (Pulse: the Table Detail buttons). */
export function ActionButton({
  variant,
  disabled,
  children,
}: {
  variant: "primary" | "secondary" | "outline";
  disabled?: boolean;
  children: ReactNode;
}) {
  const t = usePosTheme();
  const look = disabled ? t.confirmOff : { primary: t.confirmOn, secondary: t.secondary, outline: t.outline }[variant];
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn("flex h-12 min-w-[160px] items-center justify-center rounded-xl px-5 text-base font-bold transition", look)}
    >
      {children}
    </button>
  );
}

export const NOTE_LIMIT = 140;

/**
 * Order note for a plain bucket line: a dialog centred over the POS page (the parent must
 * be `relative`). Every target is at least 44px tall for fingers; backdrop tap, the close
 * button or Cancel drops the edit.
 */
export function NoteDialog({
  dishName,
  qty,
  initial = "",
  autoFocus = true,
  onSave,
  onCancel,
}: {
  dishName: string;
  qty: number;
  initial?: string;
  /** Off in the design system, where several dialogs render at once. */
  autoFocus?: boolean;
  onSave: (notes: string) => void;
  onCancel: () => void;
}) {
  const t = usePosTheme();
  const [text, setText] = useState(initial);
  const [shown, setShown] = useState(false);
  const changed = text.trim() !== initial.trim();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-8">
      <div
        aria-hidden
        onClick={onCancel}
        className={cn("absolute inset-0 bg-black/60 transition-opacity duration-200", shown ? "opacity-100" : "opacity-0")}
      />
      <div
        role="dialog"
        aria-modal
        aria-label={`Order note for ${dishName}`}
        className={cn(
          "relative flex w-[520px] max-w-full flex-col gap-5 rounded-2xl border p-6 shadow-[0_24px_64px_rgba(0,0,0,0.5)] transition duration-200 ease-out",
          t.line,
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-px flex-col gap-1">
            <p className={cn("text-xl leading-tight font-bold", t.ink)}>{initial ? "Edit note" : "Add note"}</p>
            <p className={cn("truncate text-sm leading-tight", t.meta)}>
              {qty > 1 ? `${qty}x ` : ""}
              {dishName}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className={cn("-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full transition", t.stepBtn)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            autoFocus={autoFocus}
            maxLength={NOTE_LIMIT}
            rows={4}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a note for the kitchen"
            className={cn(
              "w-full resize-none rounded-xl border border-transparent px-4 py-3 text-base leading-snug outline-none placeholder:opacity-50 focus:border-[#f5dfa8]/60",
              t.stepWrap,
              t.ink,
            )}
          />
          <p className={cn("self-end text-xs tabular-nums", t.meta)}>
            {text.length}/{NOTE_LIMIT}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          {initial ? (
            <button
              type="button"
              onClick={() => onSave("")}
              className="mr-auto h-12 rounded-xl px-2 text-sm font-semibold text-[#e5484d] transition active:scale-95"
            >
              Remove note
            </button>
          ) : (
            <span className="mr-auto" />
          )}
          <button
            type="button"
            onClick={onCancel}
            className={cn("h-12 min-w-[112px] rounded-xl px-5 text-base font-semibold transition active:scale-95", t.outline)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!changed}
            onClick={() => onSave(text)}
            className={cn(
              "h-12 min-w-[140px] rounded-xl px-5 text-base font-bold transition active:scale-95",
              changed ? t.confirmOn : t.confirmOff,
            )}
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}
