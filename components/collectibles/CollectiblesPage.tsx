"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";
import { useProfile } from "@/components/ProfileProvider";
import { loadUserCollectibles, type UnlockedCollectible } from "@/lib/collectibles";
import { OMNI_COLLECTIBLES, type OmniCollectible } from "@/config/omniCollectibles";
import { OMNIKUNO_MODULES as OMNIKUNO_LESSON_MODULES } from "@/config/omniKunoLessons";

const ICON_BY_COLLECTIBLE: Record<string, string> = {
  "protocol-respiratie-4-4-6": "🌬️",
  "regula-3-checkpoints": "⏱️",
  "jurnal-2-minute": "📓",
  "protectie-somn-30min": "🌙",
  "pauza-energie-90sec": "🌀",
  "arc1-body-scan-window": "🧠",
  "arc1-story-reset": "📖",
  "arc1-intent-commit": "✍️",
  "arc1-energy-loop": "⚡",
};

const LESSON_TITLE_LOOKUP = (() => {
  const map = new Map<string, string>();
  Object.values(OMNIKUNO_LESSON_MODULES).forEach((module) => {
    module.lessons.forEach((lesson) => {
      if (!map.has(lesson.id)) {
        map.set(lesson.id, lesson.title);
      }
    });
  });
  return map;
})();

function getLessonTitle(lessonId: string) {
  return LESSON_TITLE_LOOKUP.get(lessonId) ?? lessonId;
}

export default function CollectiblesPage() {
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useI18n();
  const { profile } = useProfile();
  const profileId = profile?.id ?? null;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UnlockedCollectible[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const result = await loadUserCollectibles(profileId);
        if (cancelled) return;
        setItems(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error)?.message ?? "Failed to load collectibles");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    run().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const effectiveItems = useMemo(() => (profileId ? items : []), [items, profileId]);
  const effectiveLoading = profileId ? loading : false;
  const effectiveError = profileId ? error : null;
  const unlockedSet = useMemo(() => new Set(effectiveItems.map((item) => item.id)), [effectiveItems]);
  const unlockedList = useMemo(
    () => OMNI_COLLECTIBLES.filter((item) => unlockedSet.has(item.id)),
    [unlockedSet],
  );
  const lockedList = useMemo(
    () => OMNI_COLLECTIBLES.filter((item) => !unlockedSet.has(item.id)),
    [unlockedSet],
  );
  const unlockedCount = unlockedSet.size;
  const totalCollectibles = OMNI_COLLECTIBLES.length;
  const selectedCollectible = useMemo(
    () => OMNI_COLLECTIBLES.find((item) => item.id === selectedCollectibleId) ?? null,
    [selectedCollectibleId],
  );
  const selectedUnlocked = selectedCollectible ? unlockedSet.has(selectedCollectible.id) : false;

  const headerTitle = lang === "ro" ? "Colecția mea de protocoale" : "My protocol collection";
  const headerCopy =
    lang === "ro"
      ? "Deblochezi aceste carduri după lecții cheie din Arc 1. Fiecare reprezintă un protocol practic pe care îl poți activa din nou."
      : "Unlock these cards after key Arc 1 lessons. Each one represents a practical protocol you can reactivate anytime.";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="rounded-3xl border border-[#E4DAD1] bg-white/95 p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B08A78]">
            {lang === "ro" ? "Colecții mentale" : "Mental collectibles"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#2C2C2C] sm:text-4xl">{headerTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5A4334] sm:text-base">{headerCopy}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-[#7B6B60]">
            <div className="rounded-2xl border border-[#DECFC0] bg-[#FFF8F0] px-3 py-1.5">
              {lang === "ro" ? "Deblocate" : "Unlocked"}: {unlockedCount}/{totalCollectibles}
            </div>
            {effectiveLoading ? (
              <span>{lang === "ro" ? "Se încarcă..." : "Loading..."}</span>
            ) : null}
            {effectiveError ? (
              <span className="text-[#B03C2F]">{lang === "ro" ? "Nu putem încărca acum." : "Unable to load now."}</span>
            ) : null}
            <div className="ml-auto flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Link
                href="/omni-kuno"
                className="rounded-full border border-[#C5B29E] px-3 py-1 text-[#5A3E2B] hover:border-[#8B5A3A]"
              >
                {lang === "ro" ? "Continuă OmniKuno" : "Continue OmniKuno"}
              </Link>
              <Link
                href="/mental-universe"
                className="rounded-full border border-transparent bg-[#F5EAE0] px-3 py-1 text-[#5A3E2B] hover:border-[#C5B29E]"
              >
                {lang === "ro" ? "Vezi harta" : "View map"}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-[#2D2017]">
              {lang === "ro" ? "Protocoale deblocate" : "Unlocked protocols"}
            </h2>
            <p className="text-sm text-[#7B6B60]">
              {lang === "ro"
                ? unlockedList.length
                  ? "Notează-le în jurnal și revino la ele înainte de sesiunile grele."
                  : "Completează lecțiile OmniKuno pentru a debloca primul tău protocol."
                : unlockedList.length
                  ? "Capture them in your journal and relaunch them before demanding sessions."
                  : "Complete OmniKuno lessons to unlock your first protocol."}
            </p>
          </div>
          {unlockedList.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {unlockedList.map((collectible) => (
                <CollectibleCard
                  key={collectible.id}
                  collectible={collectible}
                  lang={lang}
                  unlocked
                  onOpenDetail={setSelectedCollectibleId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[#E6DAD0] bg-white/70 px-4 py-6 text-sm text-[#7B6B60]">
              {lang === "ro"
                ? "Continuă lecțiile Arc 1 pentru a dezvălui protocoale exclusive."
                : "Continue Arc 1 lessons to reveal exclusive protocols."}
            </div>
          )}
        </section>

        {lockedList.length ? (
          <section className="mt-10 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#2D2017]">
                {lang === "ro" ? "În pregătire" : "In progress"}
              </h2>
              <p className="text-sm text-[#7B6B60]">
                {lang === "ro"
                  ? "Aceste carduri se vor activa pe măsură ce finalizezi lecțiile Arc 1."
                  : "These cards activate as you finish Arc 1 lessons."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {lockedList.map((collectible) => (
                <CollectibleCard
                  key={collectible.id}
                  collectible={collectible}
                  lang={lang}
                  unlocked={false}
                  onOpenDetail={setSelectedCollectibleId}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      {selectedCollectible ? (
        <CollectibleDetailDialog
          collectible={selectedCollectible}
          lang={lang}
          unlocked={selectedUnlocked}
          onClose={() => setSelectedCollectibleId(null)}
        />
      ) : null}
    </div>
  );
}

function CollectibleCard({
  collectible,
  lang,
  unlocked,
  onOpenDetail,
}: {
  collectible: UnlockedCollectible;
  lang: "ro" | "en";
  unlocked: boolean;
  onOpenDetail?: (id: string) => void;
}) {
  const icon = ICON_BY_COLLECTIBLE[collectible.id] ?? "📘";
  return (
    <div
      className={`rounded-3xl border px-4 py-5 ${
        unlocked ? "border-[#E6DAD0] bg-white shadow-sm" : "border-dashed border-[#E6DAD0] bg-[#F7F0E7]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${
            unlocked ? "text-[#1F7A43]" : "text-[#B08A78]"
          }`}
        >
          {unlocked ? (lang === "ro" ? "Deblocat" : "Unlocked") : lang === "ro" ? "În curând" : "Locked"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-[#2D2017]">{collectible.title}</h3>
      <p className="mt-1 text-sm text-[#5A4334]">{collectible.shortDescription}</p>
      {collectible.unlockAfterLessonIds?.length ? (
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#A08F82]">
          {lang === "ro"
            ? `Se activează după ${collectible.unlockAfterLessonIds.length} lecții`
            : `Unlocks after ${collectible.unlockAfterLessonIds.length} lessons`}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onOpenDetail?.(collectible.id)}
        className="mt-4 inline-flex items-center text-[12px] font-semibold text-[#B4634D] underline-offset-4 hover:underline"
      >
        {lang === "ro" ? "Vezi detalii" : "View details"}
      </button>
    </div>
  );
}

function CollectibleDetailDialog({
  collectible,
  lang,
  unlocked,
  onClose,
}: {
  collectible: OmniCollectible;
  lang: "ro" | "en";
  unlocked: boolean;
  onClose: () => void;
}) {
  const lessons = collectible.unlockAfterLessonIds ?? [];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white px-6 py-6 shadow-2xl">
        <button
          type="button"
          aria-label={lang === "ro" ? "Închide" : "Close"}
          className="absolute right-4 top-4 rounded-full border border-transparent bg-[#F5EAE0] px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#5A3E2B] transition hover:border-[#E5D2C3]"
          onClick={onClose}
        >
          {lang === "ro" ? "Închide" : "Close"}
        </button>
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-[#F7F0E7] shadow-inner sm:h-60">
          <Image
            src={collectible.imageUrl || "https://placehold.co/600x360?text=Protocol"}
            alt={collectible.title}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
            priority
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">
            <span className="rounded-full bg-[#FFF3EC] px-3 py-1 text-[#C07963]">
              {unlocked ? (lang === "ro" ? "Deblocat" : "Unlocked") : lang === "ro" ? "Blocată" : "Locked"}
            </span>
            <span>{lang === "ro" ? "Arc 1 — Claritate & Energie" : "Arc 1 — Clarity & Energy"}</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#2D2017]">{collectible.title}</h3>
          <p className="text-sm leading-relaxed text-[#5A4334]">{collectible.longDescription}</p>
          {lessons.length ? (
            <div className="rounded-2xl border border-[#F0E8E0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#5A4334]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
                {lang === "ro" ? "Se deblochează după" : "Unlocks after"}
              </p>
              <ul className="mt-2 space-y-1 text-[13px]">
                {lessons.map((lessonId) => (
                  <li key={lessonId}>• {getLessonTitle(lessonId)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
