"use client";

import { useEffect } from "react";
import { useSim } from "@/engine/store";

/** Bell when a guest calls (or calls again) for a waiter, a short wink when the waiter marks the call done. */
const SOUNDS = { call: "/sounds/call-new.mp3", done: "/sounds/call-done.mp3" } as const;

const play = (src: string) => {
  const audio = new Audio(src);
  // a browser that blocks autoplay before the first gesture just stays quiet
  void audio.play().catch(() => {});
};

/**
 * Listens to the event log rather than the screen, so a call rings whichever page the tablet
 * is on. A reset clears the log without an event, so it never plays anything.
 */
export function useCallSounds() {
  useEffect(
    () =>
      useSim.subscribe((s, prev) => {
        const latest = s.log[0];
        if (!latest || latest === prev.log[0]) return;
        if (latest.event.type === "customer/call-waiter") {
          // only a call that actually rang: a guest already waiting is a no-op in the reducer
          const id = latest.event.tableId ?? s.customer.tableId;
          const now = s.tables.find((t) => t.id === id)?.call;
          const before = prev.tables.find((t) => t.id === id)?.call;
          if (now && now !== before) play(SOUNDS.call);
        } else if (latest.event.type === "customer/call-again") {
          play(SOUNDS.call);
        } else if (latest.event.type === "waiter/complete-call") {
          play(SOUNDS.done);
        }
      }),
    [],
  );
}
