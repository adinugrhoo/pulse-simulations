"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { HandIcon, type HandIconHandle } from "@/components/ui/hand";
import { SECTIONS } from "@/config/global";
import { formatWaited, type ActiveCall } from "@/engine/calls";
import type { WaiterCall } from "@/engine/types";
import { cn } from "@/lib/cn";
import { figtree } from "@/lib/fonts";

/** One wave runs 0.8s (lucide-animated's hand); a calling hand waves again every 1.5s. */
const WAVE_EVERY_MS = 1500;

const RED = "bg-[#b40001]";
/** The floor's paid green, so an accepted call reads as handled. */
const GREEN = "bg-[#008b6b]";

/**
 * Lucide's hand, the icon the Figma uses, at the Figma's size: its stroke scales with it
 * (2px at 24 is 1.67px at 20, 1.17px at 14, 0.89px at 10.67). `waving` repeats the wave.
 */
export function WavingHand({
  size,
  waving = false,
  className,
}: {
  size: number;
  waving?: boolean;
  className?: string;
}) {
  const ref = useRef<HandIconHandle>(null);
  useEffect(() => {
    if (!waving) return;
    ref.current?.startAnimation();
    const id = setInterval(() => ref.current?.startAnimation(), WAVE_EVERY_MS);
    return () => clearInterval(id);
  }, [waving]);
  return <HandIcon ref={ref} size={size} aria-hidden className={cn("pointer-events-none flex shrink-0", className)} />;
}

/** Re-renders every second while `live`, for the waited-for timers. */
function useNow(live: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const tick = () => setNow(Date.now());
    // catch up at once on open: the clock sat still while the drawer was shut
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [live]);
  return now;
}

/** A call is "new" for its first 15s; past a minute the guest has been waiting too long. */
const NEW_CALL_MS = 15_000;
const WAITING_MS = 60_000;

type TagStage = "new" | "calling" | "waiting" | "again" | "accepted";

const stageOf = (call: WaiterCall, now: number): TagStage => {
  if (call.status === "accepted") return "accepted";
  if (call.again) return "again";
  const waited = now - call.at;
  return waited < NEW_CALL_MS ? "new" : waited < WAITING_MS ? "calling" : "waiting";
};

const TAG_COPY: Record<TagStage, string> = {
  new: "New calling",
  calling: "Calling",
  waiting: "Customer waiting..",
  again: "Calling again",
  accepted: "Accepted",
};

/** How long "Call dismissed" stays on the table after the guest cancels. */
const DISMISSED_SHOW_MS = 3000;

/**
 * True for a few seconds after `dismissedAt`, then false. A timer rather than the 1s clock, so
 * a table that cancelled long ago doesn't keep ticking.
 */
function useRecentlyDismissed(dismissedAt: number | undefined, frozenNow?: number) {
  const [expiredAt, setExpiredAt] = useState<number>();
  useEffect(() => {
    if (dismissedAt === undefined || frozenNow !== undefined) return;
    const left = Math.max(0, DISMISSED_SHOW_MS - (Date.now() - dismissedAt));
    const id = setTimeout(() => setExpiredAt(dismissedAt), left);
    return () => clearTimeout(id);
  }, [dismissedAt, frozenNow]);
  if (dismissedAt === undefined) return false;
  if (frozenNow !== undefined) return frozenNow - dismissedAt < DISMISSED_SHOW_MS;
  return expiredAt !== dismissedAt;
}

/** How far a chip or a drawer row must be dragged sideways to count as a swipe to done. */
const TAG_SWIPE_PX = 40;
const ROW_SWIPE_PX = 90;

/** A quick flick counts too, even a short one. */
const FLICK_SPEED = 500;
const isSwipe = (offset: number, velocity: number, min: number) =>
  Math.abs(offset) >= min || (Math.abs(velocity) >= FLICK_SPEED && Math.abs(offset) >= min / 3);

/** Swiped away: slide off the way it was flung. Otherwise: a quick shrink and fade. */
const leave = (dir: number) =>
  dir
    ? {
        x: dir * 160,
        opacity: 0,
        pointerEvents: "none" as const,
        transition: { duration: 0.2, ease: "easeIn" as const },
      }
    : {
        opacity: 0,
        scale: 0.6,
        y: 6,
        pointerEvents: "none" as const,
        transition: { duration: 0.18, ease: "easeIn" as const },
      };

/**
 * Figma 3222:500: the pill sitting on a calling table's top edge. "New calling" for the first
 * 15s, then "Calling", then "Customer waiting.." past a minute; the new and waiting stages bob
 * and wave, plain Calling sits still. A guest who rings again reads "Calling again": it pops
 * once, then bobs and waves until accepted. A tap accepts (green, check), a second tap clears it;
 * a swipe left or right clears it straight away.
 */
export function CallTag({
  call,
  tableLabel,
  onAccept,
  onComplete,
  dismissedAt,
  now: frozenNow,
}: {
  call?: WaiterCall;
  /** When the guest last cancelled a call (ms): the tag says so for a few seconds. */
  dismissedAt?: number;
  tableLabel: string;
  onAccept: () => void;
  onComplete: () => void;
  /** Stops the clock (ms) for static previews. */
  now?: number;
}) {
  const liveNow = useNow(call?.status === "calling" && frozenNow === undefined);
  const now = frozenNow ?? liveNow;
  const dismissed = useRecentlyDismissed(call ? undefined : dismissedAt, frozenNow);
  const [flung, setFlung] = useState(0);
  const stage = call ? stageOf(call, now) : undefined;
  const lively = stage === "new" || stage === "waiting" || stage === "again";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[-16px] z-[1] flex justify-center">
      {/* wait: a cancelled call shrinks away before "Call dismissed" takes its place */}
      <AnimatePresence mode="wait" custom={flung} onExitComplete={() => setFlung(0)}>
        {call && stage ? (
          <motion.button
            key="call"
            type="button"
            custom={flung}
            onTap={stage === "accepted" ? onComplete : onAccept}
            aria-label={
              stage === "accepted" ? `${tableLabel}: call accepted, mark as done` : `${tableLabel} is calling, accept`
            }
            drag="x"
            dragSnapToOrigin
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (!isSwipe(info.offset.x, info.velocity.x, TAG_SWIPE_PX)) return;
              setFlung(Math.sign(info.offset.x));
              onComplete();
            }}
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            variants={{ exit: leave }}
            exit="exit"
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            // the pill is 32px tall; the pseudo-element pads its tap area toward 44px
            className="pointer-events-auto relative origin-bottom cursor-grab touch-pan-y before:absolute before:-inset-x-2 before:-inset-y-1.5 before:content-[''] active:cursor-grabbing"
          >
            {/* each ring again pops the pill once; keyed so a second ring pops it again */}
            <motion.span
              key={call.again ?? 0}
              className="flex"
              initial={call.again ? { scale: 1.25, rotate: -4 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 12 }}
            >
              {/* the gentle bob lives on the inner pill so it never fights the drag or the entry */}
              <motion.span
                className="flex items-center gap-1 rounded-full bg-white p-1"
                animate={lively ? { y: [0, -7, 0] } : { y: 0 }}
                transition={
                  lively ? { duration: 1.6, ease: "easeInOut", repeat: Infinity } : { duration: 0.3, ease: "easeOut" }
                }
              >
                <span className="flex items-center justify-center px-1.5 text-sm leading-none font-semibold whitespace-nowrap text-black">
                  {TAG_COPY[stage]}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-white transition-colors duration-300",
                    stage === "accepted" ? GREEN : RED,
                  )}
                >
                  {/* 14px: the Figma's 10.67px hand, 30% bigger */}
                  {stage === "accepted" ? <CheckIcon className="size-3.5" /> : <WavingHand size={14} waving={lively} />}
                </span>
              </motion.span>
            </motion.span>
          </motion.button>
        ) : dismissed ? (
          <motion.span
            key="dismissed"
            role="status"
            aria-label={`${tableLabel} cancelled their call`}
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.3, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className="flex origin-bottom items-center gap-1 rounded-full bg-white p-1"
          >
            <span className="flex items-center justify-center px-1.5 text-sm leading-none font-semibold whitespace-nowrap text-[#6b6b6b]">
              Call dismissed
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-[#8f8f8f] text-white">
              <CloseIcon className="size-3.5" />
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Top-right entry to the calls drawer. Idle (Figma 3224:5132): a round hand button. With
 * guests waiting (Figma 3221:424): "Customers Calling" and a red count with a waving hand.
 */
export function CallsButton({ calling, onOpen }: { calling: number; onOpen: () => void }) {
  if (!calling) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Customer calls"
        className="flex size-[54px] items-center justify-center rounded-full bg-white/10 text-[#cdcdcd] transition hover:bg-white/15"
      >
        <WavingHand size={20} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${calling} ${calling === 1 ? "customer" : "customers"} calling`}
      className="flex items-center gap-1 rounded-full bg-[rgba(255,152,152,0.1)] p-2 transition hover:bg-[rgba(255,152,152,0.16)]"
    >
      <span className="flex items-center justify-center p-3 text-sm leading-none font-medium whitespace-nowrap text-[#cdcdcd]">
        Customers Calling
      </span>
      <span className={cn("flex w-[76px] items-center justify-center gap-1 rounded-full p-3 text-white", RED)}>
        <span className="text-sm leading-none font-bold tabular-nums">{calling}</span>
        <WavingHand size={14} waving />
      </span>
    </button>
  );
}

const sectionName = (id?: string) => SECTIONS.find((s) => s.id === id)?.name;

function CloseIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CallRow({
  item,
  now,
  live,
  onAccept,
  onComplete,
  onSwipe,
}: {
  item: ActiveCall;
  now: number;
  live: boolean;
  onAccept: (tableId: string) => void;
  onComplete: (tableId: string) => void;
  onSwipe: (tableId: string, dir: number) => void;
}) {
  const { table, call } = item;
  const accepted = call.status === "accepted";
  const where = sectionName(table.section);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      variants={{
        exit: (dir: number) => ({
          opacity: 0,
          x: dir ? dir * 420 : 48,
          transition: { duration: 0.22, ease: "easeIn" },
        }),
      }}
      exit="exit"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* swipe the row left or right to mark the call done straight away */}
      <motion.div
        drag="x"
        dragSnapToOrigin
        dragElastic={0.6}
        onDragEnd={(_, info) => {
          if (isSwipe(info.offset.x, info.velocity.x, ROW_SWIPE_PX)) onSwipe(table.id, Math.sign(info.offset.x));
        }}
        className={cn(
          "flex cursor-grab touch-pan-y items-center gap-3 rounded-xl border p-4 transition-colors duration-300 active:cursor-grabbing",
          accepted ? "border-[#008b6b]/50 bg-[rgba(0,139,107,0.1)]" : "border-[#b40001]/60 bg-[rgba(180,0,1,0.12)]",
        )}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300",
            accepted ? GREEN : RED,
          )}
        >
          <WavingHand size={20} waving={live && !accepted} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate text-base leading-none font-semibold text-[#fff8eb]">{table.label}</p>
          <p className="flex min-w-0 items-center gap-1 text-xs leading-none text-[#afaca2]">
            {/* how long since the guest called, with the clock the floor cards use for time seated */}
            <Image
              src="/figma/tablet-order-detail/clock.svg"
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0"
            />
            <span className="shrink-0 tabular-nums">{formatWaited(now - call.at)}</span>
            {call.again && !accepted ? (
              <>
                <span aria-hidden>·</span>
                <span className="shrink-0 font-semibold text-[#ff9898]">Calling again</span>
              </>
            ) : null}
            {where ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{where}</span>
              </>
            ) : null}
          </p>
        </div>
        {accepted ? (
          <button
            type="button"
            onClick={() => onComplete(table.id)}
            className={cn(
              "flex h-[46px] w-[96px] shrink-0 items-center justify-center gap-1.5 rounded-xl text-sm leading-none font-bold text-white transition hover:brightness-110",
              GREEN,
            )}
          >
            <CheckIcon />
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAccept(table.id)}
            className="flex h-[46px] w-[96px] shrink-0 items-center justify-center rounded-xl bg-[#fff8eb] text-sm leading-none font-bold text-[#2c2c2c] transition hover:bg-white"
          >
            Accept
          </button>
        )}
      </motion.div>
    </motion.li>
  );
}

/**
 * Right drawer listing every table calling for a waiter, longest wait first: the table, how
 * long since it called, Accept, then Done once accepted. Same glass panel as the sections
 * drawer, mirrored to the right; closes on the X, the backdrop or Escape.
 */
export function CallsSidebar({
  open,
  calls,
  onAccept,
  onComplete,
  onClose,
  now: frozenNow,
}: {
  open: boolean;
  calls: ActiveCall[];
  onAccept: (tableId: string) => void;
  onComplete: (tableId: string) => void;
  onClose: () => void;
  /** Stops the clock at this time (ms), so a static preview renders the same on the server and the client. */
  now?: number;
}) {
  const liveNow = useNow(open && frozenNow === undefined);
  const now = frozenNow ?? liveNow;
  /** Direction of the last swipe, so the row leaves the way it was flung. */
  const [flung, setFlung] = useState(0);
  const swipe = (tableId: string, dir: number) => {
    setFlung(dir);
    onComplete(tableId);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const accepted = calls.filter((c) => c.call.status === "accepted").length;
  const calling = calls.length - accepted;

  return (
    <div
      className={cn(figtree.className, "absolute inset-0 z-30", open ? "visible" : "invisible")}
      style={{
        transition: open ? "visibility 0s" : "visibility 0s linear 300ms",
      }}
      // inert, not aria-hidden: closing also drops focus from a button inside
      inert={!open}
    >
      <button
        type="button"
        aria-label="Close customer calls"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <aside
        className={cn(
          // 40px wider than the sections drawer: each row carries a 96px Accept / Done button
          "absolute top-0 right-0 bottom-0 flex w-[400px] flex-col border-l border-white/10 bg-[#151515]/70 shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xl leading-none font-bold text-[#fff8eb]">Customers Calling</p>
            <p className="text-xs leading-none text-[#afaca2]">
              {calls.length ? `${calling} calling · ${accepted} accepted` : "No calls right now"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-[46px] shrink-0 items-center justify-center rounded-xl border border-[#3a3a3a] bg-white/5 transition hover:bg-white/10"
          >
            <Image src="/figma/tablet-pos/close.svg" alt="" width={24} height={24} className="size-6" />
          </button>
        </div>

        {calls.length ? (
          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-6">
            <AnimatePresence initial={false} custom={flung} onExitComplete={() => setFlung(0)}>
              {calls.map((item) => (
                <CallRow
                  key={item.table.id}
                  item={item}
                  now={now}
                  live={open}
                  onAccept={onAccept}
                  onComplete={onComplete}
                  onSwipe={swipe}
                />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/5 text-[#8f8f8f]">
              <WavingHand size={24} />
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-base leading-none font-semibold text-[#fff8eb]">No customers calling</p>
              <p className="text-xs leading-none text-[#afaca2]">Calls from tables show up here.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
