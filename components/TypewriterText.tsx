"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  speed?: number; // milisecunde între caractere
  mistakeChance?: number; // șansa de a face o greșeală (0-1)
}

export default function TypewriterText({ text, speed = 50, mistakeChance = 0.05 }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let i = 0;

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        let nextChar = text[i];

        // Simulare greșeală
        if (Math.random() < mistakeChance) {
          const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
          setDisplayText((prev) => prev + wrongChar);

          // Mic delay și backspace pentru corectare
          setTimeout(() => {
            setDisplayText((prev) => prev.slice(0, -1) + nextChar);
          }, speed * 3);
        } else {
          setDisplayText((prev) => prev + nextChar);
        }

        i++;

        // Pauză naturală după punct sau virgulă
        if (nextChar === "." || nextChar === ",") {
          clearInterval(typeInterval);
          setTimeout(() => i, speed * 5); // mic delay
        }
      } else {
        clearInterval(typeInterval);
      }
    }, speed);

    // Cursor animat
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, [text, speed, mistakeChance]);

  return (
    <h2
      className="text-3xl md:text-4xl font-mono font-medium text-center leading-snug mb-6"
      style={{
        color: "#232020ff",
        letterSpacing: "0.05em",
        textShadow: "1px 1px 2px rgba(0,0,0,0.08)",
        fontFamily: '"Courier Prime", monospace',
      }}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        _
      </motion.span>
    </h2>
  );
}
