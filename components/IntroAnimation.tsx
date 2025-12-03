"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Manrope, Space_Grotesk } from "next/font/google";

const manropeFont = Manrope({
  subsets: ["latin"],
  weight: ["500", "600"],
});

const spaceGroteskFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
});

const animatedFonts = [manropeFont, spaceGroteskFont];

declare global {
  interface Window {
    gsap?: typeof import("gsap");
  }
}

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [userCompleted, setUserCompleted] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const safeComplete = useCallback(() => {
    if (userCompleted) return;
    setUserCompleted(true);
    onComplete?.();
  }, [userCompleted, onComplete]);

  const wordsList = useMemo(
    () => [
      "claritate",
      "focus",
      "vrei",
      "adaptare",
      "echilibru",
      "stres free",
      "carieră",
      "respirație",
      "energie",
      "reziliență",
      "încredere",
      "comunicare",
      "mindfulness",
      "relații",
      "alegi",
      "biofeedback",
    ],
    []
  );

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (typeof window === "undefined" || !window.gsap) {
      return;
    }

    const gsap = window.gsap;
    const overlay = document.querySelector(".words-overlay") as HTMLDivElement | null;
    const container = document.querySelector(".intro-container") as HTMLDivElement | null;
    if (!overlay || !container) return;

    function createWord() {
      if (!overlay) return;
      const selectedFont = animatedFonts[Math.floor(Math.random() * animatedFonts.length)];
      const wordElem = document.createElement("div");
      wordElem.className = [
        "word",
        "absolute",
        "text-2xl",
        "md:text-4xl",
        "lg:text-5xl",
        "font-semibold",
        "text-zinc-600/80",
        "drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]",
        "tracking-wide",
        "transition-colors",
      ].join(" ");
      wordElem.classList.add(selectedFont.className);

      wordElem.textContent = wordsList[Math.floor(Math.random() * wordsList.length)];
      wordElem.style.left = `${Math.random() * 80 + 10}%`;
      wordElem.style.bottom = `${Math.random() * 10}%`;

      overlay.appendChild(wordElem);

      const randomDuration = 6 + Math.random() * 2;

      gsap.fromTo(
        wordElem,
        { y: overlay.clientHeight * 0.8, opacity: 0, scale: 0.95 },
        {
          y: -overlay.clientHeight * 0.8,
          opacity: 1,
          scale: 1.05,
          duration: randomDuration,
          ease: "power1.out",
          onUpdate: function () {
            const progress = this.progress();
            if (progress > 0.3 && progress < 0.7) {
              wordElem.style.color = "rgba(28, 25, 23, 0.95)";
            } else {
              wordElem.style.color = "rgba(82, 82, 91, 0.8)";
            }
            const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.03;
            const currentY = gsap.getProperty(wordElem, "y") as number;
            wordElem.style.transform = `translateY(${currentY}px) scale(${scale})`;
          },
          onComplete: () => wordElem.remove(),
        }
      );
    }

    let interval: number | undefined;
    const startDelay = window.setTimeout(() => {
      createWord();
      const baseInterval = prefersReducedMotion ? 1200 : 800;
      interval = window.setInterval(createWord, baseInterval);
    }, 100);

    return () => {
      window.clearTimeout(startDelay);
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [wordsList, prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.gsap) return;
    if (!imageLoaded) return;

    const gsap = window.gsap;
    const filterLayer = document.querySelector(".intro-filter-layer") as HTMLDivElement | null;
    const card = document.querySelector(".intro-card") as HTMLDivElement | null;
    if (!filterLayer || !card) return;

    if (prefersReducedMotion) {
      gsap.set(filterLayer, { opacity: 0 });
      gsap.set(card, { opacity: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (!userCompleted) safeComplete();
      },
    });

    tl.fromTo(
      filterLayer,
      { opacity: 0, backdropFilter: "blur(12px)" },
      { opacity: 1, duration: 0.8, ease: "power2.out" },
    )
      .to(filterLayer, {
        opacity: 0.6,
        backdropFilter: "blur(6px)",
        duration: 1.2,
        ease: "power2.out",
      })
      .fromTo(
        card,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
        "-=0.6",
      );

    return () => {
      tl.kill();
    };
  }, [imageLoaded, prefersReducedMotion, safeComplete, userCompleted]);

  return (
    <div className="intro-container fixed inset-0 z-[60] w-screen h-screen overflow-hidden bg-[var(--omni-bg-main)]">
      <div className="relative flex w-full h-full items-center justify-center">
        <Image
          src="/assets/vitruvian.png"
          alt="OmniMental intro"
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 100vh"
          onLoad={() => setImageLoaded(true)}
        />

        <div className="intro-filter-layer pointer-events-none absolute inset-0 bg-black/35 backdrop-blur-[6px] opacity-0" />

        <div className="words-overlay pointer-events-none absolute inset-0 overflow-hidden" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 pt-16 sm:pt-20">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.45em] text-[var(--omni-ink-soft)] sm:text-base">
              OmniMental
            </p>
            <p className="text-[15px] font-semibold text-[var(--omni-ink-soft)] sm:text-lg">
              Dezvoltă-ți inteligența adaptativă
            </p>
          </div>
          <div className="intro-button-panel w-full max-w-[18rem] rounded-[26px] bg-[rgba(255,249,242,0.32)] backdrop-blur-md shadow-[0_3px_18px_rgba(0,0,0,0.12)] py-4 px-3 flex flex-col gap-3.5 sm:max-w-[20rem]">
            <button
              className="relative w-full rounded-card bg-[var(--omni-bg-paper)] py-2.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--omni-ink)] transition-transform duration-200 hover:-translate-y-1"
              onClick={safeComplete}
              aria-label="Pornește animația"
            >
              START
              <span className="pointer-events-none absolute inset-0">
                <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-full w-full">
                  <path
                    d="M4 10 C10 4, 190 4, 196 10 L196 50 C190 56, 10 56, 4 50 Z"
                    stroke="var(--omni-ink)"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <button
              className="relative w-full rounded-card bg-[var(--omni-bg-paper)] py-2.5 text-[11px] font-semibold tracking-[0.28em] text-[var(--omni-ink-soft)] transition-transform duration-200 hover:-translate-y-1"
              onClick={() => router.push(user && !user.isAnonymous ? "/progress" : "/auth")}
              aria-label="Deschide autentificarea"
            >
              AM CONT
              <span className="pointer-events-none absolute inset-0">
                <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="h-full w-full">
                  <path
                    d="M4 10 C10 4, 190 4, 196 10 L196 50 C190 56, 10 56, 4 50 Z"
                    stroke="#4E3F32"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
