import Image from "next/image";

const ASSET = "/figma/tablet-order-detail";

/** Data cells of the Figma QR (3152:20585), 29 × 29. The three finder squares are drawn separately. */
const QR_ROWS = [
  "00000000111001110010000000000",
  "00000000111111110111100000000",
  "00000000111101100000100000000",
  "00000000011110110101100000000",
  "00000000111011010111000000000",
  "00000000010001100100100000000",
  "00000000101010101010100000000",
  "00000000010010100000000000000",
  "10011111110011111100010010111",
  "10100000100010100101010110110",
  "01101110011000100110010100100",
  "00011000111000110100111001001",
  "11110010001011100010101100001",
  "00100000000110000110011011111",
  "01000111101000110101111100101",
  "11001001011001101010000110101",
  "00001010000010010001100001000",
  "10010000110000000111000010110",
  "11100011011001101011011001001",
  "11001101111101011001011111100",
  "11100110011011000101111111110",
  "00000000100101001110100011000",
  "00000000100001011001101011000",
  "00000000111011001101100010011",
  "00000000100111011001111111000",
  "00000000100011101111110100010",
  "00000000001001001000010110111",
  "00000000000101010000010101101",
  "00000000100110000111101011000",
];

/** A dynamic QR lives for an hour from the moment the table is opened. */
const QR_TTL_MINUTES = 60;

/** Minutes the table's QR still works; the seated clock starts when the table opens. */
export const qrMinutesLeft = (seatedMinutes = 0) => Math.max(0, QR_TTL_MINUTES - seatedMinutes);

/** "75" -> "1h", "60" -> "1h", "55" -> "55m", "1" -> "1m": whole hours once it is an hour or more, minutes below. */
export const formatExpiry = (minutes: number) => (minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes}m`);

const SIZE = QR_ROWS.length;
const FINDERS = [
  [0, 0],
  [SIZE - 7, 0],
  [0, SIZE - 7],
];

/** Standard 7 × 7 finder: ring, gap, 3 × 3 core. */
const inFinder = (x: number, y: number) =>
  FINDERS.some(([fx, fy]) => {
    const dx = x - fx;
    const dy = y - fy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
    const edge = dx === 0 || dx === 6 || dy === 0 || dy === 6;
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
    return edge || core;
  });

/** Decorative stand-in for the table's QR: the simulation never encodes a real code. */
export function QrMock() {
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (QR_ROWS[y][x] === "1" || inFinder(x, y)) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={260}
      height={260}
      shapeRendering="crispEdges"
      fill="#E8BC6B"
      role="img"
      aria-label="Table QR code"
    >
      {cells}
    </svg>
  );
}

/**
 * Figma 3152:16449: the left column of the order detail when the table uses a dynamic QR.
 * Replaces the guest profiling column: the customer scans the code and fills in their own guest info.
 */
export function DynamicQrPanel({ minutesLeft }: { minutesLeft: number }) {
  return (
    <div className="absolute top-2 left-2 h-[670px] w-[360px] overflow-hidden rounded-tl-[20px] bg-[#17181a]">
      <div className="absolute top-5 left-5 flex w-[320px] flex-col items-start gap-2">
        <p className="text-2xl leading-none font-bold whitespace-nowrap text-[#fcdfa2]">Guest list</p>
        <div className="relative h-px w-full">
          <Image src={`${ASSET}/divider.svg`} alt="" fill className="object-fill" />
        </div>
        <p className="w-full text-sm leading-none text-[#fff8eb]">Scan the QR with customer phone camera</p>
      </div>

      <div className="absolute top-[174px] left-5 flex w-[320px] flex-col items-center gap-5">
        <div className="flex w-[260px] items-center justify-center gap-1.5 rounded-lg bg-[#1b1b1a] p-3">
          <Image src={`${ASSET}/clock.svg`} alt="" width={14} height={14} className="size-[14px]" />
          <p className="text-sm leading-none whitespace-nowrap text-white">
            {minutesLeft > 0 ? (
              <>
                <span className="font-semibold">{formatExpiry(minutesLeft)}</span> left QR will expired
              </>
            ) : (
              <span className="font-semibold">QR expired</span>
            )}
          </p>
        </div>
        <QrMock />
      </div>
    </div>
  );
}
