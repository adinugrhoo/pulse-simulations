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
  className,
  style,
}: {
  spec: DeviceSpec;
  children: ReactNode;
  className?: string;
  /** Applied to the screen viewport; themes pass their CSS variables through here. */
  style?: CSSProperties;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  /** Logical width of the screen. Grows past the authored width to fill a wide host. */
  const [screenW, setScreenW] = useState(spec.width);

  const skin = spec.skin;
  const photo = spec.photo;
  const outerW = skin ? skin.width : screenW + spec.bezel * 2;
  const outerH = skin ? skin.height : spec.height + spec.bezel * 2;
  /** Screens keep their authored size and scale, letterboxed, into the photo's display. */
  const screenScale = skin ? skin.screen.height / spec.height : 1;
  /** Skinned screens keep their height and stretch in width to fill the display. */
  const skinScreenW = skin ? skin.screen.width / screenScale : spec.width;

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const fit = (hostW: number, h: number) => {
      if (skin) return setScale(Math.min(hostW / skin.width, h / skin.height, 1));
      // a photo bezel's side bumpers need a little air so they never touch the host edges
      const w = photo ? hostW - 64 : hostW;
      // scale by height, then stretch the screen's width so the UI fills the host
      const minW = spec.width + spec.bezel * 2;
      const next = Math.min(h / outerH, w / minW, 1);
      setScale(next);
      setScreenW(Math.max(spec.width, Math.round(w / next - spec.bezel * 2)));
    };
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      fit(width, height);
    });
    ro.observe(el);
    fit(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, [skin, photo, spec.width, spec.bezel, outerH]);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}>
      {/* a photo bezel's parts (e.g. the printer dock) stick out above the frame */}
      <div
        ref={hostRef}
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 items-center justify-center",
          photo ? "overflow-visible" : "overflow-hidden",
        )}
      >
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
                    width: skinScreenW,
                    height: spec.height,
                    transform: `scale(${screenScale})`,
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          ) : photo ? (
            <PhotoBezel photo={photo} outerW={outerW} outerH={outerH} scale={scale} screenH={spec.height} style={style}>
              {children}
            </PhotoBezel>
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
                width: screenW,
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

/**
 * A device photo fitted to the frame's footprint (outerW x outerH, the same box a plain
 * bezel would take): the body is a 9-slice so it takes any width, the parts sit on top at
 * the body's scale, and the screen (authored `screenH` tall) scales into what's inside the
 * photo's bezel, stretching in width as the plain frame does.
 */
function PhotoBezel({
  photo,
  outerW,
  outerH,
  scale,
  screenH,
  style,
  children,
}: {
  photo: NonNullable<DeviceSpec["photo"]>;
  outerW: number;
  outerH: number;
  scale: number;
  screenH: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const q = outerH / photo.height;
  const { top, right, bottom, left } = photo.slice;
  const innerW = outerW - (left + right) * q;
  const innerH = outerH - (top + bottom) * q;
  const screenScale = innerH / screenH;
  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{ width: outerW, height: outerH, transform: `scale(${scale})` }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          borderStyle: "solid",
          borderWidth: `${top * q}px ${right * q}px ${bottom * q}px ${left * q}px`,
          // fill: the photo's glass runs under the screen too, so its rounded corners sit on
          // dark glass instead of showing the page through
          borderImage: `url(${photo.src}) ${top} ${right} ${bottom} ${left} fill stretch`,
        }}
      />
      {photo.parts.map((p) => {
        const w = p.width * q;
        const x = p.anchor === "left" ? p.x * q : p.anchor === "right" ? outerW - p.x * q - w : outerW / 2 + p.x * q - w / 2;
        return (
          // eslint-disable-next-line @next/next/no-img-element -- cut-outs of one device photo, drawn at a computed size
          <img
            key={p.src}
            src={p.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{ left: x, top: p.y * q, width: w, height: p.height * q }}
          />
        );
      })}
      {/* corners follow the photo's glass so they never touch the frame */}
      <div
        className="absolute overflow-hidden bg-black"
        style={{ left: left * q, top: top * q, width: innerW, height: innerH, borderRadius: photo.screenRadius * q }}
      >
        <div
          className="relative origin-top-left overflow-hidden bg-white"
          style={{ ...style, width: innerW / screenScale, height: screenH, transform: `scale(${screenScale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
