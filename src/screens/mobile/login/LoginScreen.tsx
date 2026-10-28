"use client";

import Image from "next/image";
import { useState } from "react";
import { figtree } from "@/lib/fonts";
import { useSim } from "@/engine/store";
import { cn } from "@/lib/cn";

const MIN_PHONE_DIGITS = 8;

/**
 * Figma: SmartWeb Pro 2025 H1, node 3951:11269 ("Login Page") for the idle
 * state, node 4474:293727 for the typed state. That second frame mocks an
 * on-screen iOS QWERTY keyboard as static art — we deliberately don't
 * reproduce it. The phone field is a real `<input inputMode="numeric">`, so
 * the device's own native number pad shows instead.
 */
export function LoginScreen() {
  const dispatch = useSim((s) => s.dispatch);
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(false);

  const canContinue = phone.length >= MIN_PHONE_DIGITS;
  const login = () => {
    if (!canContinue) return;
    dispatch({ type: "customer/login", guestName: "Adi", guests: 2 });
  };
  const skipLogin = () => dispatch({ type: "customer/login", guestName: "Adi", guests: 2 });

  return (
    <div className={cn(figtree.className, "relative size-full bg-black")}>
      {/* background: blurred full-bleed + focused center band, same source photo */}
      <div className="absolute inset-x-0 top-0 h-[666.667px] overflow-hidden">
        <Image
          src="/figma/mobile-login/bg.gif"
          alt=""
          fill
          unoptimized
          className="object-cover blur-[10px]"
        />
      </div>
      <div className="absolute top-[161px] left-0 h-[210px] w-[375px] overflow-hidden">
        <Image src="/figma/mobile-login/bg.gif" alt="" fill unoptimized className="object-cover" />
      </div>

      {/* language switcher */}
      <div className="absolute top-4 left-[254px] flex w-[105px] flex-col items-start gap-0.5 rounded-xl bg-white/60 px-3 py-1.5 backdrop-blur-[22px]">
        <p className="text-[10px] leading-3 whitespace-nowrap text-[#24242e]">Choose Language</p>
        <div className="flex items-center gap-1">
          <Image src="/figma/mobile-login/globe.svg" alt="" width={16} height={16} />
          <div className="flex flex-col items-start">
            <p className="text-sm leading-5 font-bold text-[#24242e]">English</p>
          </div>
        </div>
      </div>

      {/* carousel dots */}
      <div className="absolute top-[556px] left-1/2 h-1.5 w-[18px] -translate-x-1/2">
        <Image src="/figma/mobile-login/dots.svg" alt="" fill />
      </div>

      {/* expand / mute controls */}
      <div className="absolute top-[532px] left-[287px] flex items-center gap-2 rounded-lg bg-white/80 p-1.5">
        <Image src="/figma/mobile-login/mute.svg" alt="Mute" width={20} height={20} />
      </div>
      <div className="absolute top-[532px] left-[327px] flex items-center gap-2 rounded-lg bg-white/80 p-1.5">
        <Image src="/figma/mobile-login/expand.svg" alt="Expand" width={20} height={20} />
      </div>

      {/* bottom sheet */}
      <div className="absolute top-[576px] left-0 flex w-[375px] flex-col items-center rounded-t-3xl bg-white px-4 pt-4 pb-6 drop-shadow-[0px_-2px_24px_rgba(0,0,0,0.1)]">
        <div className="flex w-full flex-col items-end gap-4">
          <div className="flex w-full flex-col items-start gap-4">
            <div
              className={cn(
                "flex w-full flex-col items-stretch rounded-lg bg-[#f0f2f5]",
                phone.length === 0 && "bg-transparent",
              )}
            >
              <div className="z-[2] flex h-12 w-full items-center gap-3 rounded-lg border border-[#e4e4eb] bg-white py-1.5 pl-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-5 w-7 overflow-hidden rounded-sm border-[0.5px] border-[#e4e4eb]">
                    <Image src="/figma/mobile-login/flag.png" alt="SG" fill className="object-cover" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-sm leading-5 font-bold text-[#4a4857]">+65</span>
                    <Image src="/figma/mobile-login/flag-chevron.svg" alt="" width={10} height={10} />
                  </div>
                </div>
                <div className="h-9 w-0 border-l border-[#e4e4eb]" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  pattern="[0-9]*"
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter Phone Number"
                  className="w-[211px] border-none bg-transparent text-sm leading-5 text-[#4a4857] outline-none placeholder:text-[#7b7d8d]"
                />
              </div>

              {phone.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOptIn((v) => !v)}
                  className="flex items-center gap-1.5 rounded-b-lg px-3 pt-2 pb-3 text-left"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[6px] border-[0.889px] border-[rgba(47,46,51,0.2)]",
                      optIn && "border-[#60362b] bg-[#60362b]",
                    )}
                  >
                    {optIn ? (
                      <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                        <path
                          d="M2.5 6l2.2 2.2L9.5 3.5"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="text-xs leading-4 text-[#24242e]">
                    <span className="font-bold">Get exclusive deal updates</span> via SMS &amp;
                    WhatsApp 🎁
                  </span>
                </button>
              ) : null}
            </div>

            <button
              onClick={login}
              disabled={!canContinue}
              className={cn(
                "flex h-12 w-full items-center justify-center rounded-lg bg-[#60362b] px-2.5 py-3.5 transition",
                !canContinue && "opacity-40",
              )}
            >
              <span className="text-base leading-6 font-bold text-white">Continue</span>
            </button>
          </div>

          <div className="flex w-full flex-col items-center">
            <p className="text-center text-xs leading-5 text-[#4a4857]">
              By logging in, you agree to our{" "}
              <span className="font-bold text-[#60362b]">Terms of Use</span> &{" "}
              <span className="font-bold text-[#60362b]">Privacy Policy</span>
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-4">
            <div className="relative flex h-4 w-full items-center justify-center">
              <div className="absolute inset-x-0 top-1/2 border-t-[0.6px] border-[#dfdfe8] opacity-50" />
              <span className="relative bg-white px-2 text-sm leading-5 font-bold text-[#9a9cab]">
                OR
              </span>
            </div>
            <button
              onClick={skipLogin}
              className="flex w-full items-center justify-center py-3.5 text-base leading-5 font-bold text-[#9a9cab] underline decoration-[#9a9cab]/60 underline-offset-4"
            >
              Continue without Logging In
            </button>
          </div>
        </div>
      </div>

      {/* device chrome */}
      <div className="absolute bottom-0 left-0 flex w-[375px] flex-col items-center border-t-[0.5px] border-black/[0.14] bg-white/80 pt-2.5 backdrop-blur-[10px]">
        <div className="mb-[-8px] flex items-center gap-1.5">
          <Image src="/figma/mobile-login/lock.svg" alt="" width={6} height={9} />
          <span className="text-xs leading-4 text-black">smartweb.com/ts-cafe</span>
        </div>
        <div className="relative h-[34px] w-full">
          <div className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}
