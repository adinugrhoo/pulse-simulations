"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { figtree } from "@/lib/fonts";
import { cn } from "@/lib/cn";
import { cartTotal } from "@/engine/reducer";
import { useSim } from "@/engine/store";
import { DishImage } from "@/menu/DishImage";
import { useMenu } from "@/menu/hooks";
import type { Dish } from "@/menu/types";
import { MobileTabBar } from "../shared/MobileTabBar";

const fmt = (n: number) => `SGD ${n.toFixed(2)}`;

/**
 * Figma: SmartWeb Pro 2025 H1, node 4477:73545 ("For You Page") — the
 * post-login menu landing screen. Figma authors the sticky search/category
 * bar as a duplicated "Sticky Header" frame that swaps in on scroll; the web
 * gets that for free via `position: sticky`, so only one copy is built here.
 */
export function MenuScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const tableLabel = useSim((s) => s.tables.find((t) => t.id === s.customer.tableId)?.label ?? "Table");
  const cart = useSim((s) => s.customer.cart);
  const categories = useMenu().mobile;
  // empty categories keep their tab but get no section
  const sections = categories.filter((c) => c.dishes.length > 0);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(categories[0]?.id);

  const sectionRefs = useRef<Partial<Record<string, HTMLDivElement | null>>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const goToSection = (id: string) => {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addDish = (dish: Dish) =>
    dispatch({
      type: "customer/add-to-cart",
      line: { itemId: dish.id, name: dish.name, unitPrice: dish.price, qty: 1 },
    });

  const cartQty = cart.reduce((n, l) => n + l.qty, 0);
  const cartAmount = cartTotal(cart);

  return (
    <div className={cn(figtree.className, "relative flex size-full flex-col bg-white")}>
      {/* top strip + brand row */}
      <div className="relative z-20 shrink-0 bg-white">
        <div className="h-1.5 w-full bg-(--mobile-primary)" />
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button className="flex size-7 items-center justify-center">
              <Image src="/figma/mobile-menu/menu-icon.svg" alt="Menu" width={28} height={28} />
            </button>
            <Image src="/figma/mobile-menu/logo.png" alt="Canton Paradise" width={71} height={32} />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <p className="text-[10px] leading-3 whitespace-nowrap text-[#4a4857]">Choose Language</p>
            <div className="flex items-center gap-1">
              <Image src="/figma/mobile-menu/globe.svg" alt="" width={16} height={16} />
              <span className="text-sm leading-5 font-bold text-[#4a4857]">English</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 flex -translate-x-1/2 items-center">
          <div className="flex items-center gap-2 border-b-[1.5px] border-(--mobile-primary) bg-(--mobile-primary) px-4 py-2.5 rounded-bl-[21px] rounded-br-[21px]">
            <Image src="/figma/mobile-menu/table-icon.svg" alt="" width={20} height={20} />
            <span className="text-xs leading-6 font-bold text-white">{tableLabel}</span>
          </div>
        </div>
      </div>

      {/* sticky search + category tabs — native `sticky`, one DOM copy */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[#dfdfe8] bg-white px-4 pt-3 pb-0 shadow-[0px_-4px_12px_0px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2.5 rounded-lg border border-black/10 px-3 py-2">
          <Image src="/figma/mobile-menu/search.svg" alt="" width={20} height={20} />
          <div className="h-full w-px bg-[#e4e4eb]" />
          <span className="text-sm leading-6 text-[#7b7d8d]">Try &ldquo;Steamed Chicken Dim Sum&rdquo;...</span>
        </div>
        <div className="flex items-start gap-0 overflow-x-auto">
          {categories.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => goToSection(cat.id)}
                className="relative flex shrink-0 flex-col items-center gap-2 px-2 pb-4"
              >
                <div className="size-12 overflow-hidden rounded-full border border-[#dfdfe8] bg-[#f0f2f5]">
                  <div className="relative size-full">
                    <DishImage src={cat.image} alt={cat.name} sizes="48px" className="object-cover text-xs" />
                  </div>
                </div>
                <span
                  className={cn(
                    "w-[67px] text-center text-[13px] leading-[18px]",
                    active ? "font-bold text-[#4a4857]" : "font-normal text-[#4a4857]",
                  )}
                >
                  {cat.label ?? cat.name}
                </span>
                {active ? (
                  <Image
                    src="/figma/mobile-menu/tab-underline.svg"
                    alt=""
                    width={72}
                    height={4}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* FYP highlights */}
        <div className="flex flex-col items-start gap-4 px-4 py-6">
          <div className="flex w-full items-center gap-4">
            <div className="flex w-[105px] shrink-0 flex-col gap-3">
              <p className="text-[18px] leading-[1.1] font-bold tracking-[-0.4px] text-[#333]">
                Check out our highlights!🔥
              </p>
              <div className="flex flex-col gap-1">
                <p className="text-xs leading-[1.2] tracking-[-0.4px] text-[#333]">Swipe to see more</p>
                <Image src="/figma/mobile-menu/arrow-right.svg" alt="" width={16} height={16} />
              </div>
            </div>
            <div className="flex gap-2.5 overflow-x-auto">
              {["highlight-1.gif", "highlight-2.gif", "highlight-3.gif"].map((src) => (
                <div key={src} className="relative h-40 w-[102px] shrink-0 overflow-hidden rounded-[10px]">
                  <Image src={`/figma/mobile-menu/${src}`} alt="" fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div
            key={section.id}
            ref={(el) => {
              sectionRefs.current[section.id] = el;
            }}
            className="flex flex-col items-start gap-3 px-4 py-3"
          >
            <p className="text-[18px] leading-[1.35] font-bold tracking-[-0.4px] text-[#333]">{section.name}</p>
            <div className="grid w-full grid-cols-2 gap-3">
              {section.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex flex-col items-center rounded-lg bg-white p-1 shadow-[0px_1px_1.5px_rgba(0,0,0,0.1),0px_1px_1px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative h-40 w-full overflow-hidden rounded-md bg-[#f0f2f5]">
                    <DishImage src={dish.image} alt={dish.name} className="object-cover" />
                  </div>
                  <div className="flex w-full flex-col items-start gap-1 px-1.5 pt-2.5 pb-1.5">
                    <p className="text-sm leading-5 text-[#24242e]">{dish.name}</p>
                    <p className="text-sm leading-6 font-bold text-[#24242e]">{fmt(dish.price)}</p>
                    <button
                      onClick={() => addDish(dish)}
                      className="flex h-8 w-full items-center justify-center rounded-lg border border-[#dfdfe8] text-xs leading-5 font-bold text-(--mobile-primary)"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={cn("shrink-0", cartQty > 0 ? "h-24" : "h-6")} />
      </div>

      {/* floating cart CTA — Figma node 2099:5395, recoloured to home's maroon */}
      {cartQty > 0 ? (
        <div className="absolute right-0 bottom-[58px] left-0 flex flex-col items-center p-4">
          <button
            onClick={() => dispatch({ type: "customer/open-cart" })}
            className="flex w-full items-center justify-between rounded-xl bg-(--mobile-primary) px-5 py-4 shadow-[0px_4px_3px_rgba(0,0,0,0.1),0px_2px_2px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-2">
              <div className="relative size-6">
                {/* bag glyph is inset inside its 24px box; the badge overhangs the top-right */}
                <Image
                  src="/figma/mobile-nav/cart-bag.svg"
                  alt=""
                  width={21}
                  height={19}
                  className="absolute top-[9.93%] left-[7.14%] h-[18.5px] w-[20.57px]"
                />
                <span className="absolute -top-0.5 -right-0.5 flex size-[14px] items-center justify-center rounded-full bg-[#f51b34] text-[8.167px] leading-[1.2] font-bold tracking-[-0.175px] text-white">
                  {cartQty}
                </span>
              </div>
              <span className="text-[15px] leading-6 font-bold text-white">{fmt(cartAmount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[15px] leading-6 font-bold text-white">Checkout</span>
              <Image src="/figma/mobile-menu/chevron-right.svg" alt="" width={20} height={20} className="size-5" />
            </div>
          </button>
        </div>
      ) : null}

      <MobileTabBar active="home" />
    </div>
  );
}
