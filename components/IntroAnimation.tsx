"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

declare global {
  interface Window {
    gsap?: typeof import("gsap");
  }
}

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const wordsList = useMemo(
    () => [
      "claritate",
      "focus",
      "vrei",
      "alegi",
      "echilibru",
      "stres free",
      "carieră",
      "respirație",
      "energie",
      "reziliență",
      "încredere",
      "comunicare",
      "relații",
      "biofeedback",
    ],
    []
  );

  useEffect(() => {
    if (!imageLoaded) return;
    if (typeof window === "undefined" || !window.gsap) return;

    const gsap = window.gsap;
    const overlay = document.querySelector(".words-overlay") as HTMLDivElement | null;
    const container = document.querySelector(".intro-container") as HTMLDivElement | null;
    if (!overlay || !container) return;

    function createWord() {
        const localOverlay = document.querySelector(".words-overlay") as HTMLDivElement | null;
        if (!localOverlay) return; // ✅ TS now knows it can't be null

        const wordElem = document.createElement("div");
        wordElem.classList.add(
            "word",
            "absolute",
            "text-2xl",
            "md:text-4xl",
            "lg:text-5xl",
            "font-semibold",
            "text-[#222]",
            "tracking-wide"
        );

        wordElem.textContent =
            wordsList[Math.floor(Math.random() * wordsList.length)];
        wordElem.style.left = `${Math.random() * 80 + 10}%`;
        wordElem.style.bottom = `${Math.random() * 10}%`;

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

      // zoom-out fade and exit after 10s
      const timeout = setTimeout(() => {
        clearInterval(interval);

        gsap.to(container, {
            filter: "blur(20px)",
            opacity: 0,
            duration: 1.6,
            ease: "power2.out",
            onComplete: onComplete,
            });
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }, 500);

    return () => clearTimeout(startDelay);
  }, [onComplete, wordsList, imageLoaded]);

  return (
    <div className="intro-container fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF9]/90 backdrop-blur-sm opacity-100">
      <Image
        src="/assets/vitruvian.png"
        alt="Omul Vitruvian"
        fill
        priority
        className="background object-cover opacity-60 transition-opacity duration-700"
        style={{ filter: "sepia(0.4) hue-rotate(20deg) saturate(1.2)" }}
        onLoadingComplete={() => setImageLoaded(true)}
      />

      <div className="words-overlay absolute inset-0 overflow-hidden pointer-events-none" />

      <button
        className="
          start-btn 
          absolute bottom-[37%]
          px-20 py-7
          text-2xl font-semibold tracking-wide
          rounded-2xl
          bg-gradient-to-b from-[#d9a066] via-[#cc7722] to-[#a55418]
          text-[#fdfcf9]
          border border-[#e8d6b1]/40
          shadow-[0_6px_20px_rgba(0,0,0,0.25)]
          transition-all duration-300
          hover:from-[#e0b070] hover:via-[#d27d24] hover:to-[#b15b1c]
          hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          active:scale-95
        "
        onClick={onComplete}
      >
        Start
      </button>
    </div>
  );
}
