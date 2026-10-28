import { cn } from "@/lib/cn";

/**
 * Placeholder for a screen not yet imported from Figma.
 * Replace the registry entry with the real component when the frame lands.
 */
export function ScreenStub({
  screenId,
  device,
  figmaNode,
  children,
  className,
}: {
  screenId: string;
  device: "mobile" | "tablet";
  figmaNode?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-100 p-6 text-center",
        className,
      )}
    >
      <span className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold tracking-widest text-white uppercase">
        {device} · {screenId}
      </span>
      <p className="max-w-[80%] text-sm text-neutral-500">
        Screen not imported yet. Drop the Figma frame in and register it.
      </p>
      {figmaNode ? (
        <code className="rounded bg-neutral-200 px-2 py-1 text-[11px] text-neutral-700">{figmaNode}</code>
      ) : null}
      {children}
    </div>
  );
}
