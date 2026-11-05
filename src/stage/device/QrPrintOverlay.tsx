"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useSim } from "@/engine/store";
import { cn } from "@/lib/cn";
import { rubik } from "@/lib/fonts";
import { QrCodeSvg } from "./QrCodeSvg";

const ASSET = "/figma/tablet";

/** Paper feeds for 4.6s (see `animate-receipt-feed`), rests, then the overlay lifts away. */
const PRINT_MS = 4600;
const HOLD_MS = 1600;

/** Torn-edge scallops from Figma 3148:15033: a 24px bite every 30px, top and bottom. */
const SCALLOP =
  "radial-gradient(circle 12px at 15px 0, transparent 11.5px, #000 12px) 0 0 / 30px 100% repeat-x, radial-gradient(circle 12px at 15px 100%, transparent 11.5px, #000 12px) 0 0 / 30px 100% repeat-x";

/**
 * Open-table QR receipt printing on the tablet. The printer and paper feed follow
 * github.com/ultramathi/receipt: paper slides out of a slot with a stepped, thermal-printer
 * motion. The toast sits one layer above this overlay, so the dim backdrop never covers it.
 */
export function QrPrintOverlay() {
  const job = useSim((s) => s.qrPrint);
  const clear = useSim((s) => s.clearQrPrint);

  useEffect(() => {
    if (!job) return;
    const t = setTimeout(() => clear(job.id), PRINT_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [job, clear]);

  if (!job) return null;

  return (
    <div className="animate-receipt-backdrop absolute inset-0 z-[60] overflow-hidden bg-black/60">
      {/* key restarts the feed if another table opens while this one is still printing */}
      <div
        key={job.id}
        className="absolute top-8 left-1/2 w-[360px] origin-top -translate-x-1/2"
        style={{ scale: 0.84 }}
      >
        <div className="receipt-printer relative z-[2] flex items-center justify-between rounded-[22px] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#2a2a29]">
              <svg viewBox="0 0 24 24" className="size-[18px] fill-[#6e6e6c]" aria-hidden="true">
                <path d="M12 1.5c1 6.2 4.3 9.5 10.5 10.5C16.3 13 13 16.3 12 22.5 11 16.3 7.7 13 1.5 12 7.7 11 11 7.7 12 1.5Z" />
              </svg>
            </span>
            <span className={cn(rubik.className, "text-sm text-[#cfcfc9]")}>Printing QR receipt</span>
          </div>
          <svg className="size-[18px] animate-spin" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" fill="none" stroke="#b9b9b2" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
          <div className="receipt-slot absolute bottom-[10px] left-1/2 h-[10px] w-[84%] -translate-x-1/2 rounded-md" />
        </div>

        {/* the window starts at the slot line, so the paper is only visible once it has left the printer */}
        <div className="receipt-window pointer-events-none absolute top-full left-0 z-[3] -mt-[18px] h-[831px] w-full overflow-hidden">
          <div
            className={cn(
              rubik.className,
              "animate-receipt-feed relative flex h-[831px] w-full flex-col items-center bg-white text-[#0f1a2a]",
            )}
            style={{ WebkitMask: SCALLOP, mask: SCALLOP, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}
          >
            <p className="mt-[28px] text-2xl leading-[26px] font-bold">Scan to Order</p>
            <p className="mt-[20px] text-base leading-[21px]">You can place the order when scan this QR</p>

            <Dash className="mt-[18px]" />

            <p className="mt-4 rounded bg-[#f1f4f9] p-2 text-sm leading-none text-[#27364b]">
              The QR code is expiring in <span className="font-semibold">3 hours 15 minutes</span>
            </p>

            <QrCodeSvg seed={job.id} className="mt-[32px] size-[260px]" />

            <p className="mt-[16px] text-2xl leading-[26px] font-bold">{job.tableLabel}</p>
            <p className="mt-[4px] text-base leading-[26px]">{job.guests ?? 2} pax</p>

            <Dash className="mt-[16px]" />

            <div className="mt-[8px] w-full px-4 text-[#27364b]">
              <p className="text-sm leading-[14px] font-semibold text-[#0f1a2a]">Instructions:</p>
              <ol className="mt-[10px] ms-6 list-decimal text-base leading-[1.6]">
                <li>Scan QR above using your phone camera</li>
                <li>Order by select dish you want</li>
                <li>Complete payment</li>
              </ol>
            </div>

            <Dash className="mt-[10px]" />

            <p className="mt-[8px] text-base leading-[21px] text-[#27364b]">Thank you for coming into our restaurant</p>
            <p className="mt-[16px] text-base leading-[21px] text-[#64748b]">Powered by</p>
            <Image src={`${ASSET}/tabsquare-logo.svg`} alt="Tabsquare" width={153} height={17} className="mt-[8px]" loading="eager" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dash({ className }: { className?: string }) {
  return <hr className={cn("w-[328px] border-0 border-t border-dashed border-[#dfe3ea]", className)} />;
}
