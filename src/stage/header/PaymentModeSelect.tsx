"use client";

import { cn } from "@/lib/cn";
import type { PaymentMode } from "@/config/phases";
import { useSim } from "@/engine/store";
import { Popover } from "./Popover";

const PAYMENT_MODES: { id: PaymentMode; label: string; description: string }[] = [
  { id: "same-device", label: "Same device", description: "The bill is paid on the waiter's tablet." },
  {
    id: "terminal",
    label: "Payment terminal",
    description: "A Adyen payment terminal takes the customer phone's place on the left.",
  },
];

/** Header dropdown after the QR type: where the payment happens. */
export function PaymentModeSelect() {
  const paymentMode = useSim((s) => s.paymentMode);
  const setPaymentMode = useSim((s) => s.setPaymentMode);
  const current = PAYMENT_MODES.find((m) => m.id === paymentMode) ?? PAYMENT_MODES[0];

  return (
    <Popover label={`Payment: ${current.label}`} width={260}>
      {(close) => (
        <ul className="flex flex-col gap-1">
          {PAYMENT_MODES.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => {
                  setPaymentMode(m.id);
                  close();
                }}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg border p-2 text-left transition",
                  m.id === paymentMode
                    ? "border-white/40 bg-white/10"
                    : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                )}
              >
                <span className="text-xs font-medium text-neutral-200">{m.label}</span>
                <span className="text-[10px] leading-snug text-neutral-500">{m.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
