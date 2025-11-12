"use client";

import React from "react";

type Props = {
  items: string[];
  label?: string; // optional aria-label
  className?: string;
};

export default function InfoTooltip({ items, label = "Detalii", className = "" }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <span className={`relative inline-flex select-none align-top ${className} group`}>
      <span
        role="button"
        aria-label={label}
        tabIndex={0}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#C9B8A8] bg-white text-[11px] font-bold leading-none text-[#7A6455] outline-none transition group-hover:border-[#A08F82] group-hover:text-[#5C4F45] focus:ring-1 focus:ring-[#E60012]"
      >
        i
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 z-20 hidden w-[min(84vw,380px)] translate-y-1 rounded-[10px] border border-[#E4D8CE] bg-white px-3 py-2 text-[12px] text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.08)] group-hover:block group-focus-within:block"
      >
        <ul className="list-disc pl-4">
          {items.map((it) => (
            <li key={it} className="mb-1 last:mb-0">
              {it}
            </li>
          ))}
        </ul>
      </div>
    </span>
  );
}

