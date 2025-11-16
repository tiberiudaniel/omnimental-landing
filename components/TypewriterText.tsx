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
  speed = 60,
  enableSound = false,
  onComplete,
  wrapperClassName = "mb-6 w-full bg-[#F6F2EE] px-6 py-5",
  cursorClassName = "typewriter-cursor",
  // target pause after a short sentence: 1.0–1.5s
  pauseAtEndMs = 1200,
  skipEnabled = true,
}: TypewriterTextProps) {
  // Revert to simple "test only" static mode to avoid accidental skips
  const [reducedMotion, setReducedMotion] = useState(false);
  const staticMode = (typeof window !== 'undefined' && window.location.search.includes('e2e=1')) || reducedMotion;
  const [displayedText, setDisplayedText] = useState(staticMode ? text : "");
  const [index, setIndex] = useState(staticMode ? text.length : 0);
  const [showCursor, setShowCursor] = useState(!staticMode);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Respect system reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mq: MediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = () => setReducedMotion(!!mq.matches);
      handler();
      if ('addEventListener' in mq) (mq as unknown as { addEventListener: (type: 'change', listener: () => void) => void }).addEventListener('change', handler);
      else if ('addListener' in mq) (mq as unknown as { addListener: (listener: () => void) => void }).addListener(handler);
      return () => {
        if ('removeEventListener' in mq) (mq as unknown as { removeEventListener: (type: 'change', listener: () => void) => void }).removeEventListener('change', handler);
        else if ('removeListener' in mq) (mq as unknown as { removeListener: (listener: () => void) => void }).removeListener(handler);
      };
    } catch {
      // noop: keep default reducedMotion=false
    }
  }, []);

  useEffect(() => {
    if (!enableSound) {
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
      }
      audioContextRef.current = null;
      return undefined;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    try {
      const maybeWindow = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor =
        window.AudioContext ?? maybeWindow.webkitAudioContext;
      if (!AudioContextCtor) {
        console.warn("AudioContext is not supported in this browser.");
        return undefined;
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
    if (!context) {
      return;
    }

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

  useEffect(() => {
    if (staticMode) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text) {
      if (!completionRef.current && onComplete) {
        completionRef.current = true;
        onComplete();
      }
      return;
    }

    if (index >= text.length) {
      if (!completionRef.current && onComplete) {
        completionRef.current = true;
        // small natural variance around the pause window (1000–1500ms)
        const endPause = Math.max(1000, Math.min(1500, Math.round(pauseAtEndMs + (Math.random() * 500 - 250))));
        const timeout = setTimeout(() => {
          setShowCursor(false);
        }, endPause);
        cursorTimeoutRef.current = timeout;
        onComplete();
      }
      return;
    }

    completionRef.current = false;

    const char = text[index];
    const baseSpeed = Math.max(speed, 30); // 50–70ms target (default 60)
    const jitter = 12; // ±10–15ms variation → pick 12ms
    let delay = baseSpeed + (Math.random() * (jitter * 2) - jitter);

    if (char === "," || char === ";") {
      delay *= 2.4;
    } else if (char === "." || char === "!" || char === "?") {
      delay *= 4.8;
    } else if (char === " ") {
      delay *= 1.9;
    }

    timeoutRef.current = setTimeout(() => {
      setDisplayedText((prev) => prev + char);
      setIndex((prev) => prev + 1);

      if (enableSound && char.trim()) {
        playClick();
      }
    }, Math.max(delay, 24));

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [index, text, speed, enableSound, onComplete, pauseAtEndMs, staticMode]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    if (!skipEnabled) return;
    setDisplayedText(text);
    setIndex(text.length);
    setShowCursor(false);
    if (!completionRef.current && onComplete) {
      completionRef.current = true;
      onComplete();
    }
  };

  return (
    <div className={wrapperClassName} onClick={handleSkip} role="presentation">
      <h2
        className="text-center text-2xl font-semibold leading-snug text-[#1F1F1F] md:text-[28px]"
        style={{
          letterSpacing: "0.04em",
          fontFamily: '"Courier Prime", monospace',
          minHeight: "3.2rem",
        }}
      >
        <span aria-label={text} role="text" className="inline-block">
          {displayedText}
          {showCursor ? <span className={cursorClassName}>|</span> : null}
        </span>
      </h2>
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
