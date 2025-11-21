"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Cormorant_Garamond, Bodoni_Moda } from "next/font/google";

const garamondFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
});

const bodoniFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400"],
});

const animatedFonts = [garamondFont, bodoniFont];

declare global {
  interface Window {
    gsap?: typeof import("gsap");
  }
}

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const completedRef = useRef(false);
  const router = useRouter();
  const { user } = useAuth();

  const safeComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

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

  useEffect(() => {
    const ready = imageLoaded || typeof window === "undefined" || window.gsap;
    if (!ready) return;
  }, [imageLoaded]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.gsap) {
      return;
    }

    const gsap = window.gsap;
    const overlay = document.querySelector(".words-overlay") as HTMLDivElement | null;
    const container = document.querySelector(".intro-container") as HTMLDivElement | null;
    if (!overlay || !container) return;

    function createWord() {
        const localOverlay = document.querySelector(".words-overlay") as HTMLDivElement | null;
        if (!localOverlay) return; // ✅ TS now knows it can't be null

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

        wordElem.textContent =
            wordsList[Math.floor(Math.random() * wordsList.length)];
        wordElem.style.left = `${Math.random() * 80 + 10}%`;
        wordElem.style.bottom = `${Math.random() * 10}%`;
        // font handled via className above

        localOverlay.appendChild(wordElem); // ✅ safe now

        const randomDuration = 6 + Math.random() * 2;

        gsap.fromTo(
            wordElem,
            { y: localOverlay.clientHeight * 0.8, opacity: 0, scale: 0.95 },
            {
            y: -localOverlay.clientHeight * 0.8,
            opacity: 1,
            scale: 1.05,
            duration: randomDuration,
            ease: "power1.out",
            onUpdate: function () {
                const progress = this.progress();
                if (progress > 0.3 && progress < 0.7) {
                  wordElem.style.color = "rgba(28, 25, 23, 0.95)"; // very dark (stone-900)
                } else {
                  wordElem.style.color = "rgba(82, 82, 91, 0.8)"; // zinc-600/80
                }
                const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.03;
                const currentY = gsap.getProperty(wordElem, "y") as number;
                wordElem.style.transform = `translateY(${currentY}px) scale(${scale})`;
            },
            onComplete: () => wordElem.remove(),
            }
        );
        }
  

    // start animation after short delay for smooth image load
    const startDelay = setTimeout(() => {
      createWord();
      const interval = setInterval(createWord, 500);
      // No auto exit; user advances via START. Clean up interval on unmount.
      return () => {
        clearInterval(interval);
      };
    }, 100);

    return () => clearTimeout(startDelay);
  }, [safeComplete, wordsList]);

  // Remove auto-complete fallback; user advances explicitly.

  return (
    <div className="intro-container fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF9]/90 backdrop-blur-sm opacity-100">
      <Image
        src="/assets/vitruvian.png"
        alt="Omul Vitruvian"
        fill
        priority
        className="background object-cover opacity-60 transition-opacity duration-700"
        style={{ filter: "sepia(0.4) hue-rotate(20deg) saturate(1.2)" }}
        onLoad={() => setImageLoaded(true)}
      />

      <div className="words-overlay absolute inset-0 overflow-hidden pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none translate-y-14">
        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-[14px] border border-[#2C2C2C] bg-white/95 px-12 py-4 sm:px-16 sm:py-5 text-xl sm:text-2xl font-semibold tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] font-['Courier_Prime',monospace]"
            onClick={safeComplete}
            aria-label="Pornește animația"
          >
            START
          </button>
          <button
            className="rounded-[14px] border border-[#2C2C2C] bg-white/85 px-10 py-3 text-base font-semibold tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] font-['Courier_Prime',monospace]"
            onClick={() => router.push(user && !user.isAnonymous ? "/progress" : "/auth")}
            aria-label="Deschide autentificarea"
          >
            AM CONT
          </button>
        </div>
      </div>
    </div>
  );
}
