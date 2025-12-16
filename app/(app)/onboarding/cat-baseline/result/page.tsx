"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import CatRadarChart from "@/components/cat/CatRadarChart";
import { CAT_AXES, type CatAxisId } from "@/config/catEngine";
import { getCatProfile, updateCatSelfInsight } from "@/lib/firebase/cat";
import type { CatProfileDoc, SelfInsightAgreement } from "@/types/cat";

const REFLECTION_OPTIONS: { value: SelfInsightAgreement; label: string }[] = [
  { value: "yes", label: "Da, mă reprezintă" },
  { value: "partial", label: "Parțial" },
  { value: "no", label: "Nu prea" },
];

export default function CatBaselineResultPage() {
  const router = useRouter();
  const { user, loading, authReady } = useAuth();
  const [profile, setProfile] = useState<CatProfileDoc | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState<SelfInsightAgreement | null>(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!user) {
      setLoadingProfile(false);
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await getCatProfile(user.uid);
        if (cancelled) return;
        if (!doc) {
          router.replace("/onboarding/cat-baseline");
          return;
        }
        setProfile(doc);
        setReflectionAnswer(doc.selfInsightAgreement ?? null);
        setReflectionNote(doc.selfInsightNote ?? "");
        setReflectionSaved(false);
      } catch (err) {
        console.error("Failed to load CAT profile", err);
        if (!cancelled) {
          setPageError("Nu putem încărca profilul în acest moment.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, router, user]);

  const axisMeta = useMemo(() => {
    const map = new Map<CatAxisId, { label: string; shortLabel: string; description: string }>();
    for (const axis of CAT_AXES) {
      map.set(axis.id, { label: axis.label, shortLabel: axis.shortLabel, description: axis.description });
    }
    return map;
  }, []);

  const sortedAxes = useMemo(() => {
    if (!profile) return [];
    return (Object.entries(profile.axisScores) as [CatAxisId, number][])
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value);
  }, [profile]);

  const strongest = sortedAxes[0];
  const weakest = sortedAxes[sortedAxes.length - 1];

  const chartData = profile
    ? (Object.entries(profile.axisScores) as [CatAxisId, number][]).map(([id, value]) => ({
        id,
        label: axisMeta.get(id)?.shortLabel ?? axisMeta.get(id)?.label ?? id,
        value,
      }))
    : [];

  const initialAgreement = profile?.selfInsightAgreement ?? null;
  const initialNote = profile?.selfInsightNote ?? "";
  const normalizedInitialNote = initialNote.trim();
  const reflectionChanged =
    reflectionAnswer !== initialAgreement || reflectionNote.trim() !== normalizedInitialNote;

  const handleReflectionChange = (value: SelfInsightAgreement) => {
    setReflectionAnswer(value);
    setReflectionSaved(false);
  };

  const handleReflectionNoteChange = (value: string) => {
    setReflectionNote(value);
    setReflectionSaved(false);
  };

  const handleReflectionSave = async () => {
    if (!user?.uid) return;
    setSavingReflection(true);
    setReflectionSaved(false);
    setReflectionError(null);
    try {
      await updateCatSelfInsight(user.uid, {
        agreement: reflectionAnswer ?? null,
        note: reflectionNote.trim() ? reflectionNote.trim() : null,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              selfInsightAgreement: reflectionAnswer ?? null,
              selfInsightNote: reflectionNote.trim() ? reflectionNote.trim() : null,
            }
          : prev,
      );
      setReflectionSaved(true);
    } catch (error) {
      console.error("Failed to save self insight", error);
      setReflectionError("Nu am putut salva reflecția. Încearcă din nou.");
    } finally {
      setSavingReflection(false);
    }
  };

  const hasCompletedPillars = profile?.pillarsIntroCompleted ?? false;

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">CAT Profil</p>
          <h1 className="text-3xl font-semibold">Bazeline completată</h1>
          <p className="text-base text-[var(--omni-ink)]/80">
            Acesta este profilul tău OmniMental – modul în care îți folosești claritatea, flexibilitatea și energia în fața schimbării.
          </p>
        </header>

        {loadingProfile || loading ? (
          <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
            Încărcăm scorurile tale…
          </div>
        ) : pageError ? (
          <div className="rounded-2xl border border-[var(--omni-danger)] bg-[#FDEAEA] px-6 py-8 text-center text-sm text-[var(--omni-danger)] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
            {pageError}
          </div>
        ) : !profile ? (
          <div className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <p className="text-base">Nu am găsit un profil CAT. Completează baseline-ul pentru a vedea rezultatele.</p>
            <OmniCtaButton as="link" href="/onboarding/cat-baseline">
              Reia evaluarea
            </OmniCtaButton>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-6 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <CatRadarChart data={chartData} />
              </div>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Scoruri pe axe</h2>
                  <ul className="space-y-3">
                    {sortedAxes.map((axis) => (
                      <li key={axis.id} className="flex items-center justify-between rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{axisMeta.get(axis.id)?.label ?? axis.id}</p>
                          <p className="text-xs text-[var(--omni-ink)]/60 line-clamp-2">
                            {axisMeta.get(axis.id)?.description ?? ""}
                          </p>
                        </div>
                        <span className="text-2xl font-semibold">{axis.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              <article className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Punct forte</p>
                <h3 className="text-lg font-semibold">
                  {strongest ? axisMeta.get(strongest.id)?.label : "—"}
                </h3>
                <p className="text-sm text-[var(--omni-ink)]/80">
                  {strongest
                    ? `Ai construit o fundație solidă pe ${axisMeta.get(strongest.id)?.label?.toLowerCase() ?? ""}. Continuăm să extindem această zonă în practică.`
                    : "Completează evaluarea pentru insights."}
                </p>
              </article>
              <article className="space-y-2 rounded-2xl border border-[var(--omni-border-strong)] bg-[var(--omni-bg-paper)] px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zonă vulnerabilă</p>
                <h3 className="text-lg font-semibold">
                  {weakest ? axisMeta.get(weakest.id)?.label : "—"}
                </h3>
                <p className="text-sm text-[var(--omni-ink)]/80">
                  {weakest
                    ? `Aici simți cea mai mare fricțiune. Practicile Kuno + Abil vor întări ${axisMeta.get(weakest.id)?.shortLabel ?? "axa"} în următoarea etapă.`
                    : "Mai avem nevoie de date pentru a stabili focusul."}
                </p>
              </article>
              <article className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ce înseamnă</p>
                <h3 className="text-lg font-semibold">Implicație adaptivă</h3>
                <p className="text-sm text-[var(--omni-ink)]/80">
                  Aceste patternuri setează modul în care înveți, execuți și reacționezi sub stres. OmniAI îți adaptează
                  practica zilnică pornind de aici.
                </p>
              </article>
            </section>

            <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Micro-reflecție</p>
                <h3 className="text-lg font-semibold">Simți că acest profil te reprezintă?</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {REFLECTION_OPTIONS.map((option) => (
                  <button
                    key={option.value ?? "null"}
                    type="button"
                    onClick={() => handleReflectionChange(option.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
                      reflectionAnswer === option.value
                        ? "border-[var(--omni-energy)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                        : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="flex flex-col gap-2 text-sm text-[var(--omni-ink)]/80">
                Mică clarificare (opțional)
                <textarea
                  value={reflectionNote}
                  onChange={(event) => handleReflectionNoteChange(event.target.value)}
                  rows={3}
                  placeholder="Ce vrei să adaugi despre cum te vezi?"
                  className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm focus:border-[var(--omni-energy)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-energy-soft)]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <OmniCtaButton
                  onClick={handleReflectionSave}
                  disabled={!reflectionChanged || savingReflection}
                  size="sm"
                >
                  {savingReflection ? "Salvez..." : "Salvează reflecția"}
                </OmniCtaButton>
                {reflectionSaved ? (
                  <span className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                    Salvat.
                  </span>
                ) : null}
              </div>
              {reflectionError ? (
                <p className="text-sm text-[var(--omni-danger)]">{reflectionError}</p>
              ) : null}
              <p className="text-xs text-[var(--omni-ink)]/70">
                (Folosim acest răspuns doar pentru calibrare internă, nu îți afectează scorul.)
              </p>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
              <p className="text-base text-[var(--omni-ink)]/85">
                Ai deblocat Foundation Cycle (15 zile ghidate). De aici începem să stabilizăm claritatea, energia și flexibilitatea mentală.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <OmniCtaButton as="link" href="/today">
                  Începe Foundation Cycle
                </OmniCtaButton>
                <OmniCtaButton
                  as="link"
                  href={hasCompletedPillars ? "/onboarding/adaptive-practice" : "/onboarding/pillars"}
                  variant="neutral"
                >
                  {hasCompletedPillars ? "Continuă cu Adaptive Practice" : "Opțional: Pilonii OmniMental"}
                </OmniCtaButton>
              </div>
              <p className="text-xs text-[var(--omni-muted)]">
                Pilonii sunt resurse de orientare și pot fi parcurși oricând. Foundation Cycle rămâne prioritatea urgență (15 zile).
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
