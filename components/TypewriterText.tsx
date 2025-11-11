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
}

export default function TypewriterText({
  text,
  speed = 88,
  enableSound = false,
  onComplete,
  wrapperClassName = "mb-6 w-full bg-[#F6F2EE] px-6 py-5",
  cursorClassName = "typewriter-cursor",
  pauseAtEndMs = 800,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const timeout = setTimeout(() => {
          setShowCursor(false);
        }, pauseAtEndMs);
        cursorTimeoutRef.current = timeout;
        onComplete();
      }
      return;
    }

    completionRef.current = false;

    const char = text[index];
    const baseSpeed = Math.max(speed, 30);
    const variation = baseSpeed * 0.45;
    let delay = baseSpeed + (Math.random() - 0.5) * variation;

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
  }, [index, text, speed, enableSound, onComplete, pauseAtEndMs]);

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

  return (
    <div className={wrapperClassName}>
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
