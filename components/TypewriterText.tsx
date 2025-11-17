"use client";

import { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  enableSound?: boolean;
  onComplete?: () => void;
  wrapperClassName?: string;
  cursorClassName?: string;
  pauseAtEndMs?: number;
  skipEnabled?: boolean;
}

export default function TypewriterText({
  text,
  speed = 60, // ~50–70ms/char țintă
  enableSound = false,
  onComplete,
  wrapperClassName = "mb-6 w-full bg-[#F6F2EE] px-6 py-5 text-left",
  cursorClassName = "typewriter-cursor",
  pauseAtEndMs = 1200, // ~1–1.5s pauză înainte de onComplete
  skipEnabled = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  // -----------------------------
  // Sunet typewriter
  // -----------------------------
  useEffect(() => {
    if (!enableSound) {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
      audioContextRef.current = null;
      noiseBufferRef.current = null;
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const maybeWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor =
        window.AudioContext ?? maybeWindow.webkitAudioContext;

      if (!AudioContextCtor) {
        console.warn("AudioContext is not supported in this browser.");
        return;
      }

      const context = new AudioContextCtor();
      audioContextRef.current = context;

      const frameCount = Math.max(Math.round(context.sampleRate * 0.08), 1);
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.45;
      }

      noiseBufferRef.current = buffer;
    } catch (error) {
      console.warn("Could not create AudioContext:", error);
      audioContextRef.current = null;
      noiseBufferRef.current = null;
    }

    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      noiseBufferRef.current = null;
    };
  }, [enableSound]);

  const playClick = () => {
    const context = audioContextRef.current;
    if (!context) return;

    const resumePromise =
      context.state === "suspended" ? context.resume() : Promise.resolve();

    void resumePromise
      .then(() => {
        const now = context.currentTime;

        let noiseSource: AudioBufferSourceNode | null = null;
        if (noiseBufferRef.current) {
          noiseSource = context.createBufferSource();
          noiseSource.buffer = noiseBufferRef.current;

          const bandpass = context.createBiquadFilter();
          bandpass.type = "bandpass";
          const centerFreq = 2200 + Math.random() * 600;
          bandpass.frequency.setValueAtTime(centerFreq, now);
          bandpass.Q.setValueAtTime(1.4, now);

          const noiseGain = context.createGain();
          noiseGain.gain.setValueAtTime(0.014, now);
          noiseGain.gain.linearRampToValueAtTime(0.004, now + 0.012);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

          noiseSource.connect(bandpass);
          bandpass.connect(noiseGain);
          noiseGain.connect(context.destination);

          noiseSource.start(now + 0.001);
          noiseSource.stop(now + 0.09);
          noiseSource.addEventListener("ended", () => {
            bandpass.disconnect();
            noiseGain.disconnect();
          });
        }

        const thockOsc = context.createOscillator();
        thockOsc.type = "sine";
        const thockFreq = 180 + Math.random() * 60;
        thockOsc.frequency.setValueAtTime(thockFreq, now);

        const thockGain = context.createGain();
        thockGain.gain.setValueAtTime(0.02, now);
        thockGain.gain.linearRampToValueAtTime(0.005, now + 0.02);
        thockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        thockOsc.connect(thockGain);
        thockGain.connect(context.destination);

        thockOsc.start(now + 0.001);
        thockOsc.stop(now + 0.1);
        thockOsc.addEventListener("ended", () => {
          thockGain.disconnect();
          if (noiseSource) {
            noiseSource.disconnect();
          }
        });
      })
      .catch((error) => {
        console.warn("Keyboard sound resume failed:", error);
      });
  };

  // -----------------------------
  // Reset animatia când se schimbă textul
  // -----------------------------
  useEffect(() => {
    // clear timeouts vechi
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }

    completionRef.current = false;
    // Schedule state resets to avoid synchronous setState in effect
    const id = (typeof window !== 'undefined' ? window.requestAnimationFrame : (fn: () => void) => setTimeout(fn, 0))(() => {
      setDisplayedText("");
      setIndex(0);
      setShowCursor(true);

      if (!text || text.trim().length === 0) {
        setShowCursor(false);
        completionRef.current = true;
        onComplete?.();
      }
    });
    return () => {
      if (typeof window !== 'undefined' && typeof id === 'number' && 'cancelAnimationFrame' in window) {
        window.cancelAnimationFrame(id as number);
      }
    };
  }, [text, onComplete]);

  // -----------------------------
  // Efectul de typewriter
  // -----------------------------
  useEffect(() => {
    if (!text || text.trim().length === 0) return;

    // dacă am terminat toate caracterele
    if (index >= text.length) {
      if (!completionRef.current) {
        completionRef.current = true;

        const jitter = Math.random() * 500 - 250; // ±250ms
        const endPause = Math.max(
          800,
          Math.min(1600, Math.round(pauseAtEndMs + jitter))
        );

        cursorTimeoutRef.current = setTimeout(() => {
          setShowCursor(false);
          onComplete?.();
        }, endPause);
      }
      return;
    }

    const char = text[index];
    const baseSpeed = Math.max(speed, 30);
    const jitter = 12;
    let delay = baseSpeed + (Math.random() * (jitter * 2) - jitter);

    if (char === "," || char === ";") {
      delay *= 2.4;
    } else if (char === "." || char === "!" || char === "?") {
      delay *= 4.8;
    } else if (char === " ") {
      delay *= 1.9;
    }

    const safeDelay = Math.max(delay, 24);

    typingTimeoutRef.current = setTimeout(() => {
      setDisplayedText((prev) => prev + char);
      setIndex((prev) => prev + 1);

      if (enableSound && char.trim()) {
        playClick();
      }
    }, safeDelay);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [index, text, speed, enableSound, pauseAtEndMs, onComplete]);

  // -----------------------------
  // Cleanup general
  // -----------------------------
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
    };
  }, []);

  // -----------------------------
  // Skip pe click (arată tot textul)
  // -----------------------------
  const handleSkip = () => {
    if (!skipEnabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }

    setDisplayedText(text);
    setIndex(text.length);
    setShowCursor(false);

    if (!completionRef.current) {
      completionRef.current = true;
      onComplete?.();
    }
  };

  return (
    <div className={wrapperClassName} onClick={handleSkip} role="presentation">
      <div className="min-h-[7.5rem] flex items-start">
        <h2
          className="text-2xl font-semibold leading-snug text-[#1F1F1F] md:text-[28px] text-left"
          style={{
            letterSpacing: "0.04em",
            fontFamily: '"Courier Prime", monospace',
          }}
        >
          <span aria-label={text} role="text" className="block w-full">
            {displayedText}
            {showCursor ? <span className={cursorClassName}>|</span> : null}
          </span>
        </h2>
      </div>
      <style jsx>{`
        .typewriter-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: cursorBlink 0.85s step-end infinite;
        }

        @keyframes cursorBlink {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
