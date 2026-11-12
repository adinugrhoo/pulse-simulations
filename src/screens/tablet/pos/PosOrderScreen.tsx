"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";
import { useScheduleState } from "@/menu/useSchedule";
import type { Dish, ResolvedSubcategory, ResolvedTabletCategory } from "@/menu/types";
import type { CartChoice, CartEdit, CartLine, PosChosen, SheetSnap } from "@/engine/types";
import {
  modifierGroupsFor,
  standaloneCustomisationFor,
  type ModifierGroup,
  type ModifierOption,
} from "@/config/global/modifiers";
import { currency } from "@/engine/types";
import {
  ASSET,
  BucketLine,
  DishCard,
  DishRowCard,
  EmptyState,
  FulfilledChip,
  NoteDialog,
  OptionCard,
  PhotoOptionCard,
  RequiredChip,
  SummaryCard,
  sgd,
  usePosTheme,
} from "./items";
import { usePosMenu, usePosPreview, usePosSim, usePosUiStart } from "./preview";

/** Hairline between page sections: the Figma svg on dark, a plain border on the light themes. */
function Divider({ tone, className }: { tone: string | null; className: string }) {
  return tone ? (
    <div className={cn(tone, className)} />
  ) : (
    <Image src={`${ASSET}/divider.svg`} alt="" width={900} height={1} className={className} />
  );
}

const RECOMMENDATION_COUNT = 4;
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
  const scheduleOf = useScheduleState(usePosPreview()?.scheduleClock);
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
        {active.dishes.length === 0 ? (
          <div className="min-h-[320px] flex-1">
            <EmptyState kind="items" />
          </div>
        ) : (
          <div className="grid shrink-0 grid-cols-[repeat(3,280px)] gap-2.5 p-5">
            {active.dishes.map((dish) => (
              <DishRowCard
                key={dish.id}
                dish={dish}
                inBucket={qtyInBucket(dish.id)}
                onAdd={() => onPickDish(dish)}
                unavailable={scheduleOf(dish)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const t = usePosTheme();
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
        // same main-action look as Confirm Order, enabled and disabled
        className={cn(
          "flex h-14 w-full items-center justify-center rounded-xl p-4 transition",
          canSave ? cn(t.confirmOn, "hover:brightness-110") : t.confirmOff,
        )}
      >
        <span className="text-base leading-none font-bold whitespace-nowrap">
          Save Modifier
        </span>
      </button>
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
  /** Stack count per pick in "multiple" groups (add-ons), keyed `${groupId}:${optionId}`; capped by the group's `max`. */
  const [counts, setCounts] = useState<Record<string, number>>(initial?.counts ?? {});
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const countKey = (g: ModifierGroup, o: ModifierOption) => `${g.id}:${o.id}`;
  const countOf = (g: ModifierGroup, o: ModifierOption) =>
    counts[countKey(g, o)] ?? 1;

  const groups = allGroups.filter((g) => isVisible(g, picks));
  const pickerGroups = groups.filter((g) => g.layout !== "hidden");

  const picked = (g: ModifierGroup) => picks[g.id] ?? [];
  /** Picks counted against a group's `max`, stacks included. */
  const usedOf = (g: ModifierGroup) => picked(g).reduce((n, o) => n + countOf(g, o), 0);
  const isFull = (g: ModifierGroup) => g.max !== undefined && usedOf(g) >= g.max;
  /** Blocked adds per group: each one replays the summary card's nudge. */
  const [nudges, setNudges] = useState<Record<string, number>>({});
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
    if (group.multiple && isFull(group)) {
      // the summary card explains why; no snackbar
      setNudges((prev) => ({ ...prev, [group.id]: (prev[group.id] ?? 0) + 1 }));
      return;
    }
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
            <p className="max-w-full truncate px-3 text-xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">
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
                          groupFull={g.multiple && isFull(g)}
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
                          groupFull={g.multiple && isFull(g)}
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
          <p className="text-xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">
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
                limit={g.multiple && g.max !== undefined ? { used: usedOf(g), max: g.max } : undefined}
                nudge={nudges[g.id]}
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
  const menu = usePosMenu();
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
          current ? "text-[#fcdfa2]" : "text-[#595959]",
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
export function PosOrderScreen() {
  const dispatch = usePosSim((s) => s.dispatch);
  const scheduleOf = useScheduleState(usePosPreview()?.scheduleClock);
  const tableId = usePosSim(
    (s) => s.waiter.openTableId ?? s.waiter.selectedTableId,
  );
  const cart = usePosSim((s) => s.waiter.cart);
  /** Bucket line whose note dialog is open; in the sim store so a scenario step can open it. */
  const noteLine = usePosSim((s) => s.waiter.cart.find((l) => l.lineId === s.waiter.noteLineId));
  /** Open category (and subcategory) live in the store so scenario steps can drive them. */
  const pos = usePosSim((s) => s.waiter.pos);
  const activeCategory = pos?.categoryId ?? null;
  /** Figma 2912:15818: the header search swaps the category grid for matching dishes across every category. */
  const preview = usePosPreview();
  const ui = usePosUiStart();
  const [searching, setSearching] = useState(ui?.searching ?? false);
  /** Pulse recommendations auto-hide once a category opens; the bottom-left tile brings them back. */
  const [showReco, setShowReco] = useState(ui?.showReco ?? true);
  // opening a category hides the recommendations, closing one brings them back
  const [shownFor, setShownFor] = useState(activeCategory);
  if (shownFor !== activeCategory) {
    setShownFor(activeCategory);
    setShowReco(!activeCategory);
  }
  const [query, setQuery] = useState(ui?.query ?? "");
  /** Dish whose combo options are being filled in, if any. */
  const [combo, setCombo] = useState<Dish | null>(null);
  /** Dish with its own modifier sheet (no combo page), if one is open. */
  const [sheetDish, setSheetDish] = useState<Dish | null>(null);
  /** Bucket line swiped open to show its delete action; one at a time. */
  const [openLineId, setOpenLineId] = useState<string | null>(null);
  /** Bucket line being edited through the combo page or option sheet; saving replaces it. */
  const [editLine, setEditLine] = useState<CartLine | null>(null);

  const menu = usePosMenu();
  const categories = menu.tablet;
  /** The API or menu data lists no dishes at all: the category grid and recommendations give way to the empty state. */
  const noItems = categories.every((c) => c.dishes.length === 0);
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
                // a design-system page stacks several of these; focusing one would scroll the canvas
                autoFocus={!preview}
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
                  unavailable={scheduleOf(dish)}
                />
              ))}
              {query.trim() && searchResults.length === 0 ? (
                <p className={cn("col-span-3 text-sm", t.meta)}>No dishes found for &ldquo;{query.trim()}&rdquo;.</p>
              ) : null}
            </div>
          ) : noItems ? (
            <EmptyState kind="items" />
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
              {dishes.length === 0 ? (
                <div className="min-h-[320px] flex-1">
                  <EmptyState kind="items" />
                </div>
              ) : (
              <div className="grid shrink-0 grid-cols-[repeat(3,280px)] gap-2.5 p-5">
                {dishes.map((dish) => (
                  <DishRowCard
                    key={dish.id}
                    dish={dish}
                    inBucket={qtyInBucket(dish.id)}
                    onAdd={() => pickDish(dish)}
                    unavailable={scheduleOf(dish)}
                    // in the sim store so a scenario step can open it
                    infoOpen={pos?.scheduleDishId === dish.id}
                    onInfoOpenChange={(open) =>
                      dispatch({ type: "waiter/pos-schedule-info", dishId: open ? dish.id : null })
                    }
                  />
                ))}
              </div>
              )}
            </>
          ) : null}
        </div>

        <div
          aria-hidden={!showReco || searching || noItems ? true : undefined}
          className={cn(
            "relative shrink-0 overflow-hidden transition-[height,opacity] duration-300 ease-out",
            !showReco || searching || noItems ? "pointer-events-none h-0 opacity-0" : "h-[278px] opacity-100",
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
                unavailable={scheduleOf(dish)}
              />
            ))}
          </div>
        </div>

        <div
          aria-hidden={showReco || searching || noItems ? true : undefined}
          className={cn(
            "shrink-0 overflow-hidden transition-[height,opacity] duration-300 ease-out",
            showReco || searching || noItems ? "pointer-events-none h-0 opacity-0" : "h-[66px] opacity-100",
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
          <p className={cn("text-xl leading-none font-bold whitespace-nowrap", t.title)}>
            Order Bucket
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <EmptyState kind="bucket" />
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
                  // plain dishes skip the modifier page and its notes field
                  onNote={line.edit ? undefined : () => dispatch({ type: "waiter/open-line-note", lineId: line.lineId })}
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

      {noteLine ? (
        <NoteDialog
          key={noteLine.lineId}
          dishName={noteLine.name}
          qty={noteLine.qty}
          initial={noteLine.notes}
          onSave={(notes) => dispatch({ type: "waiter/set-line-note", lineId: noteLine.lineId, notes })}
          onCancel={() => dispatch({ type: "waiter/open-line-note", lineId: null })}
        />
      ) : null}
    </div>
  );
}
