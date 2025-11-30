"use client";

import type { OmniRecommendation } from "@/lib/recommendations";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface RecommendationListStackProps {
  items: OmniRecommendation[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
  onActiveMidpoint?: (midY: number) => void; // relative to container top
}

export function RecommendationListStack({ items, activeId, onActiveChange, onActiveMidpoint }: RecommendationListStackProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const MAX_VISIBLE = 5;
  const ordered = [...items].sort((a, b) => {
    const at = new Date(a.createdAt || 0).getTime();
    const bt = new Date(b.createdAt || 0).getTime();
    return bt - at; // newest first, oldest last
  });
  const visible = ordered.slice(0, MAX_VISIBLE);
  const enableFancyHover = items.length <= 6;
  // Measure active midpoint and report to parent
  useEffect(() => {
    const el = itemRefs.current[(activeId ?? visible[0]?.id) as string];
    const container = containerRef.current;
    if (!el || !container || !onActiveMidpoint) return;
    const mid = el.offsetTop + el.clientHeight / 2;
    onActiveMidpoint(mid);
  }, [activeId, visible.length, onActiveMidpoint, visible]);
  // Update on resize too
  useEffect(() => {
    if (!onActiveMidpoint) return;
    const handler = () => {
      const el = itemRefs.current[(activeId ?? visible[0]?.id) as string];
      const container = containerRef.current;
      if (!el || !container) return;
      const mid = el.offsetTop + el.clientHeight / 2;
      onActiveMidpoint(mid);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [activeId, visible.length, onActiveMidpoint, visible]);
  return (
    <div className="relative" ref={containerRef}>
      {visible.map((item, index) => {
        const isActive = item.id === activeId || (!activeId && index === 0);
        const collapsed = "max-h-[52px] overflow-hidden";
        const expanded = "max-h-[260px]";
        const displayIndex = visible.length - index; // oldest (bottom) = 1
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onActiveChange(item.id)}
            layout
            ref={(el: HTMLButtonElement | null) => { itemRefs.current[item.id] = el; }}
            className={`mb-2 w-full cursor-pointer rounded-[12px] border text-left transition-[box-shadow,transform,opacity] duration-150 ${
              isActive
                ? "border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] shadow-md"
                : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] opacity-30 hover:opacity-100"
            } ${isActive ? expanded : collapsed}`}
            whileHover={
              !enableFancyHover
                ? {}
                : isActive
                ? { y: -1 }
                : { y: -2, scale: 1.01, boxShadow: "0 10px 22px rgba(0,0,0,0.06)" }
            }
            whileTap={{ scale: 0.99 }}
          >
            {/* header comun */}
            <div className="flex items-center gap-2 rounded-t-[12px] bg-[var(--omni-bg-paper)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              <span className="rounded-full bg-[var(--omni-ink)] px-2 py-0.5 text-white">
                {displayIndex}
              </span>
              <span className="truncate flex-1">
                {item.shortLabel || item.title}
              </span>
              <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] lowercase text-[var(--omni-muted)]">
                {item.type}
              </span>
            </div>

            {/* conținut: full doar pentru activ */}
            {isActive ? (
              <div className="px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--omni-ink)]">{item.title}</h3>
                {item.tags?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] lowercase text-[var(--omni-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="px-4 py-2 text-xs text-[var(--omni-muted)]">
                <p className="truncate">{item.title}</p>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
