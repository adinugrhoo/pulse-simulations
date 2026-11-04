"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { DeviceSpec } from "@/config/global";
import { cn } from "@/lib/cn";

/**
 * Renders a device at its exact Figma pixel size, then scales the whole thing
 * down to fit the available space. Screens never need responsive CSS — they are
 * authored at 375x812 / 1280x800 and scaled as a unit.
 */
export function DeviceFrame({
  spec,
  children,
  badge,
  className,
  style,
}: {
  spec: DeviceSpec;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
  /** Applied to the screen viewport; themes pass their CSS variables through here. */
  style?: CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  const skin = spec.skin;
  const outerW = skin ? skin.width : spec.width + spec.bezel * 2;
  const outerH = skin ? skin.height : spec.height + spec.bezel * 2;
  /** Screens keep their authored size and scale, letterboxed, into the photo's display. */
  const screenScale = skin ? Math.min(skin.screen.width / spec.width, skin.screen.height / spec.height) : 1;

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const fit = (w: number, h: number) => setScale(Math.min(w / outerW, h / outerH, 1));
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      fit(width, height);
    });
    ro.observe(el);
    fit(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, [outerW, outerH]);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
        <span>{spec.label}</span>
        <span className="flex items-center gap-2 normal-case tracking-normal">{badge}</span>
      </div>

      <div ref={hostRef} className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
        {/*
          `transform: scale()` repaints visually but keeps the original layout
          footprint, so a naive scaled box still reserves outerW x outerH in
          the flex layout and spills past a smaller host. Reserve the true
          (scaled) footprint here, then scale an absolutely-positioned,
          full-size box from its top-left corner inside it.
        */}
        <div
          className="relative"
          style={{ width: outerW * scale, height: outerH * scale, visibility: scale ? "visible" : "hidden" }}
        >
          {skin ? (
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ width: outerW, height: outerH, transform: `scale(${scale})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size device photo, drawn at its own pixels */}
              <img src={skin.src} alt="" width={skin.width} height={skin.height} className="absolute inset-0 select-none" draggable={false} />
              <div
                className="absolute flex items-center justify-center overflow-hidden rounded-[4px] bg-black"
                style={{ left: skin.screen.x, top: skin.screen.y, width: skin.screen.width, height: skin.screen.height }}
              >
                <div
                  className="relative shrink-0 overflow-hidden bg-white"
                  style={{
                    ...style,
                    width: spec.width,
                    height: spec.height,
                    transform: `scale(${screenScale})`,
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          ) : (
          <div
            className="absolute top-0 left-0 origin-top-left bg-neutral-950 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-neutral-800"
            style={{
              width: outerW,
              height: outerH,
              padding: spec.bezel,
              borderRadius: spec.radius,
              transform: `scale(${scale})`,
            }}
          >
            <div
              className="relative overflow-hidden bg-white"
              style={{
                ...style,
                width: spec.width,
                height: spec.height,
                borderRadius: Math.max(spec.radius - spec.bezel, 4),
              }}
            >
              {children}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
