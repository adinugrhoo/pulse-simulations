"use client";

import { cn } from "@/lib/cn";
import type { QrType } from "@/config/phases";
import { useSim } from "@/engine/store";
import { Popover } from "./Popover";

const QR_TYPES: { id: QrType; label: string; description: string }[] = [
  { id: "static", label: "Static", description: "Printed code on the table. Every scan lands on the same table." },
  { id: "dynamic", label: "Dynamic", description: "Code generated per seating. Same screens, a slightly different flow." },
];

/** Header dropdown after the theme picker: which QR flow the scenario stepper runs. */
export function QrTypeSelect() {
  const qrType = useSim((s) => s.qrType);
  const setQrType = useSim((s) => s.setQrType);
  const current = QR_TYPES.find((q) => q.id === qrType) ?? QR_TYPES[0];

  return (
    <Popover label={`QR Type: ${current.label}`} width={260}>
      {(close) => (
        <ul className="flex flex-col gap-1">
          {QR_TYPES.map((q) => (
            <li key={q.id}>
              <button
                onClick={() => {
                  setQrType(q.id);
                  close();
                }}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg border p-2 text-left transition",
                  q.id === qrType
                    ? "border-white/40 bg-white/10"
                    : "border-neutral-800 bg-neutral-900/30 hover:border-neutral-700",
                )}
              >
                <span className="text-xs font-medium text-neutral-200">{q.label}</span>
                <span className="text-[10px] leading-snug text-neutral-500">{q.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
