"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OmniRecommendation } from "@/lib/recommendations";
import { getRecommendationStatusLabel } from "@/lib/recommendations";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import { useI18n } from "@/components/I18nProvider";
import { doc, updateDoc } from "firebase/firestore";

export function RecommendationDetailPanel({ item }: { item: OmniRecommendation | null }) {
  const { lang } = useI18n();
  const [busy, setBusy] = useState<null | 'done' | 'snooze'>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const perform = async (next: 'done' | 'snooze') => {
    if (!item) return;
    if (areWritesDisabled()) {
      setMsg('Demo: status updated locally.');
      return;
    }
    try {
      setBusy(next);
      const db = getDb();
      const ref = doc(db, 'userRecommendations', item.userId, 'items', item.id);
      await updateDoc(ref, { status: next === 'done' ? 'done' : 'snoozed', updatedAt: new Date().toISOString() });
      setMsg(next === 'done' ? (lang === 'ro' ? 'Marcat ca finalizat.' : 'Marked as done.') : (lang === 'ro' ? 'Amânat.' : 'Snoozed.'));
    } catch {
      setMsg(lang === 'ro' ? 'Nu am putut actualiza. Încearcă din nou.' : 'Could not update. Please try again.');
    } finally {
      setBusy(null);
    }
  };
  if (!item) {
    return (
      <div className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-5 text-sm text-[#7B6B60]">
        Nu există recomandări în acest moment.
      </div>
    );
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-5 shadow-sm"
      >
        <div className="rounded-[10px] bg-[#FFFBF7] p-3">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#7B6B60]">
            <span className="rounded-full border border-[#E4D8CE] px-2 py-0.5">{item.type}</span>
            <span className="rounded-full border border-[#E4D8CE] px-2 py-0.5">{getRecommendationStatusLabel(item.status)}</span>
            {item.estimatedMinutes ? (
              <span className="rounded-full border border-[#E4D8CE] px-2 py-0.5">~{item.estimatedMinutes} min</span>
            ) : null}
          </div>
          <h2 className="mt-2 text-base font-semibold leading-snug text-[#2C2C2C]">{item.title}</h2>
        </div>

        {item.tags && item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full border border-[#E4D8CE] px-2 py-0.5 text-[10px] lowercase text-[#7B6B60]">{t}</span>
            ))}
          </div>
        ) : null}
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#4A3A30]">{item.body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[11px] text-[#7B6B60]">
          <span>
            {lang === 'ro' ? 'Adăugată la:' : 'Added on:'} {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
          </span>
          {item.ctaHref ? (
            <Link href={item.ctaHref} className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]">
              {item.ctaLabel || 'Începe acest pas'}
            </Link>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(item.sourceRef === 'path-recommendation' || item.id === 'base-path') ? (
            <>
              <Link
                href="/?step=cards"
                className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === 'ro' ? 'Vezi opțiunile inițiale' : 'See initial options'}
              </Link>
              <Link
                href="/choose?from=reco"
                className="rounded-[10px] border border-[#D8C6B6] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]"
              >
                {lang === 'ro' ? 'Deschide hub-ul de opțiuni' : 'Open options hub'}
              </Link>
            </>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void perform('done')}
              className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#1F7A53] hover:text-[#1F7A53]"
            >
              {lang === 'ro' ? 'Marchează finalizat' : 'Mark as done'}
            </button>
          )}
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void perform('snooze')}
            className="rounded-[10px] border border-[#D8C6B6] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C] disabled:opacity-60"
          >
            {lang === 'ro' ? 'Amână' : 'Snooze'}
          </button>
          {msg ? <span className="ml-2 text-[11px] text-[#7B6B60]">{msg}</span> : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
