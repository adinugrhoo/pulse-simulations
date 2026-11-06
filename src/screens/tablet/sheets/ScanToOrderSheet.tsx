import Image from "next/image";
import type { Table } from "@/engine/types";
import { formatExpiry, QrMock } from "../order-detail/DynamicQrPanel";
import { CloseIcon, Sheet } from "./PaidTableSheets";

const ASSET = "/figma/tablet-order-detail";

const ghostButton =
  "absolute left-[30px] flex w-[400px] items-center justify-center gap-3 rounded-xl border border-[#6e5e41] bg-[#1b1b1b] px-3 py-4 transition hover:brightness-125";

/**
 * Figma 3148:16104: the "Print QR" bottom sheet on a dynamic-QR table. Shows the table's QR for the
 * customer to scan with their own phone.
 */
export function ScanToOrderSheet({
  table,
  minutesLeft,
  onClose,
  onPrint,
}: {
  table: Table;
  minutesLeft: number;
  onClose: () => void;
  onPrint: () => void;
}) {
  return (
    <Sheet width={460} height={650} onClose={onClose}>
      <div className="absolute top-[58px] left-[30px] flex h-[42px] w-[400px] items-center justify-between">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Scan to Order</p>
        <CloseIcon size={42} onClick={onClose} />
      </div>

      <p className="absolute top-[120px] left-[30px] w-[400px] text-base leading-[21px] text-[#fff8eb]">
        Scan the QR with phone camera to place an order
      </p>

      <div className="absolute top-[157px] left-[30px] flex h-[38px] w-[400px] items-center justify-center gap-1.5 rounded-lg bg-[#1b1b1a]">
        <Image src={`${ASSET}/clock.svg`} alt="" width={14} height={14} className="size-[14px]" />
        <p className="text-sm leading-none text-white">
          {minutesLeft > 0 ? (
            <>
              <span className="font-semibold">{formatExpiry(minutesLeft)}</span> left QR will expired
            </>
          ) : (
            <span className="font-semibold">QR expired</span>
          )}
        </p>
      </div>

      <div className="absolute top-[225px] left-[100px]">
        <QrMock />
      </div>
      <p className="absolute top-[505px] left-0 w-[460px] text-center text-2xl leading-[26px] font-bold whitespace-nowrap text-[#e8bc6b]">
        {table.label}
      </p>

      <button type="button" onClick={onPrint} className={`${ghostButton} top-[575px]`}>
        <Image src={`${ASSET}/printer-gold.svg`} alt="" width={14} height={14} className="size-[14px]" />
        <span className="text-sm leading-none font-bold whitespace-nowrap text-[#e8bc6b]">Print QR Order</span>
      </button>
    </Sheet>
  );
}
