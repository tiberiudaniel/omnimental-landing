Mesaj pentru Codex – Pagina „Recomandări” (Variantă B: Stack + Panou de detalii)
Context și obiectiv

Proiect: omnimental-landing-codex (Next.js + TypeScript + Tailwind + Firebase/Firestore + shadcn/ui + framer-motion).

Obiectiv: Implementarea unei pagini /recommendation care să afișeze:

În stânga: un stack de recomandări (teanc de carduri) – cea activă complet vizibilă, celelalte parțial vizibile (bare/titluri).

În dreapta: un panou de detalii pentru recomandarea selectată.

Integrare cu Firestore (user-scoped), astfel încât:

Recomandările să fie stocate per utilizator.

Onboarding-ul și alte module (OmniKuno, etc.) să poată scrie recomandări acolo.

Te rog să urmezi pașii de mai jos, să creezi fișierele indicate, să copiezi codul propus (adaptând doar importurile/specificele proiectului) și să conectezi la Firestore după modelul deja folosit (ex.: useProgressFacts).

Design de date și Firestore

1.1. Tipuri TypeScript

Creează un fișier nou:

lib/recommendations.ts

Conținut propus:

// lib/recommendations.ts

export type OmniRecommendationType =
  | "onboarding"
  | "next-step"
  | "quest"
  | "mindset"
  | "alert";

export type OmniRecommendationStatus = "new" | "active" | "snoozed" | "done";

export interface OmniRecommendation {
  id: string;
  userId: string;

  title: string;
  shortLabel: string; // text scurt, afișat în marginea/stripe-ul cardului
  type: OmniRecommendationType;
  status: OmniRecommendationStatus;

  createdAt: string; // ISO string
  updatedAt?: string; // ISO string

  priority: 1 | 2 | 3; // 1 = high, 3 = low
  estimatedMinutes?: number;

  tags?: string[]; // ex: ["somn", "energie", "mindset"]

  body: string; // text complet, afișat în panoul de detalii

  ctaLabel?: string; // ex: "Începe exercițiul"
  ctaHref?: string;  // ex: "/experience-onboarding?step=journal"

  // opțional, pentru a ști de unde a venit recomandarea:
  source?: "system" | "onboarding" | "coach" | "self";
  sourceRef?: string; // ex: id de test, quest, etc.
}

export function sortRecommendations(
  items: OmniRecommendation[]
): OmniRecommendation[] {
  return [...items].sort((a, b) => {
    // prioritate mai mare (1) înaintea celor cu prioritate mai mică (3)
    if (a.priority !== b.priority) return a.priority - b.priority;

    // apoi cele mai noi înainte
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function getPrimaryRecommendation(
  items: OmniRecommendation[]
): OmniRecommendation | undefined {
  if (!items.length) return undefined;
  const sorted = sortRecommendations(items);
  return sorted[0];
}

export function getRecommendationStatusLabel(
  status: OmniRecommendationStatus
): string {
  switch (status) {
    case "new":
      return "Nouă";
    case "active":
      return "În lucru";
    case "snoozed":
      return "Amânată";
    case "done":
      return "Finalizată";
    default:
      return status;
  }
}

1.2. Structura Firestore

Propunere de structură:

Colecție: userRecommendations

Document: {userId} (id = uid)

Subcolecție: items

Document: {recId} (id generat de client sau Firestore)

Path complet:
userRecommendations/{userId}/items/{recId}

Document tipic în items:

{
  "userId": "uid-123",
  "title": "Focalizează-te pe somn în următoarele 3 zile",
  "shortLabel": "Somn – 3 zile",
  "type": "next-step",
  "status": "new",
  "priority": 1,
  "createdAt": "2025-11-17T01:23:45.000Z",
  "estimatedMinutes": 15,
  "tags": ["somn", "energie"],
  "body": "Recomandare detaliată cu pași clari...",
  "ctaLabel": "Începe exercițiul de seară",
  "ctaHref": "/training/sleep-hygiene"
}

1.3. Reguli Firestore (schelet)

Adaugă în rules (adaptând la structura actuală):

match /userRecommendations/{userId} {
  allow read, write: if isOwner(userId);

  match /items/{recId} {
    allow read, write: if isOwner(userId);
  }
}


Folosește aceeași funcție isOwner deja definită în rules.

Hook pentru date: useUserRecommendations

Creează un nou hook:

components/useUserRecommendations.ts

Acesta trebuie să:

ia userId din useProfile() (folosește același câmp pe care îl folosești la useProgressFacts);

subscribe la userRecommendations/{userId}/items ordonate desc după createdAt;

returneze { recommendations, loading, error }.

Cod propus (te rog adaptează importurile pentru Firebase și useProfile exact cum sunt în proiect):

// components/useUserRecommendations.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { OmniRecommendation } from "@/lib/recommendations";
import { sortRecommendations } from "@/lib/recommendations";
import { useProfile } from "@/components/ProfileProvider";

// Ajustează importurile pentru Firestore conform proiectului tău
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseUserRecommendationsState {
  recommendations: OmniRecommendation[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useUserRecommendations(): UseUserRecommendationsState {
  const { profile } = useProfile(); // ajustă numele câmpului dacă e diferit
  const userId = profile?.uid || profile?.userId || null;

  const [state, setState] = useState<UseUserRecommendationsState>({
    recommendations: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState((prev) => ({
        ...prev,
        recommendations: [],
        loading: false,
      }));
      return;
    }

    const colRef = collection(db, "userRecommendations", userId, "items");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: OmniRecommendation[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            userId: userId,
            title: data.title ?? "",
            shortLabel: data.shortLabel ?? data.title ?? "",
            type: data.type ?? "next-step",
            status: data.status ?? "new",
            priority: data.priority ?? 2,
            createdAt: data.createdAt ?? new Date().toISOString(),
            updatedAt: data.updatedAt,
            estimatedMinutes: data.estimatedMinutes,
            tags: data.tags ?? [],
            body: data.body ?? "",
            ctaLabel: data.ctaLabel,
            ctaHref: data.ctaHref,
            source: data.source,
            sourceRef: data.sourceRef,
          };
        });
        setState({
          recommendations: sortRecommendations(items),
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error("[useUserRecommendations] onSnapshot error", error);
        setState({
          recommendations: [],
          loading: false,
          error,
        });
      }
    );

    return () => unsub();
  }, [userId]);

  const sorted = useMemo(
    () => sortRecommendations(state.recommendations),
    [state.recommendations]
  );

  return {
    recommendations: sorted,
    loading: state.loading,
    error: state.error,
  };
}


Te rog asigură-te că db și useProfile sunt importate corect (după cum sunt definite acum în proiect).

Componente UI – filtre, stack, detalii

Creează un folder nou:

components/recommendations/

3.1. Filtre – RecommendationFilters

Fișier nou:

components/recommendations/RecommendationFilters.tsx

// components/recommendations/RecommendationFilters.tsx
"use client";

import { cn } from "@/lib/utils";

export type RecommendationFilterKey =
  | "all"
  | "new"
  | "active"
  | "done"
  | "today";

const FILTERS: { key: RecommendationFilterKey; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "new", label: "Noi" },
  { key: "active", label: "În lucru" },
  { key: "done", label: "Finalizate" },
  { key: "today", label: "Azi" },
];

interface RecommendationFiltersProps {
  value: RecommendationFilterKey;
  onChange: (value: RecommendationFilterKey) => void;
}

export function RecommendationFilters({
  value,
  onChange,
}: RecommendationFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition",
            value === f.key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background/80 text-muted-foreground hover:bg-muted"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

3.2. Stiva de carduri – RecommendationListStack (coloana din stânga)

Fișier nou:

components/recommendations/RecommendationListStack.tsx

Scop: arată un teanc de carduri (Card shadcn) cu:

cardul activ complet vizibil sus;

restul cardurilor “stratificate” sub el (offset vertical mic, scalare, opacitate);

clic pe card schimbă cardul activ.

// components/recommendations/RecommendationListStack.tsx
"use client";

import { Card } from "@/components/ui/card";
import type { OmniRecommendation } from "@/lib/recommendations";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RecommendationListStackProps {
  items: OmniRecommendation[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
}

export function RecommendationListStack({
  items,
  activeId,
  onActiveChange,
}: RecommendationListStackProps) {
  if (!items.length) {
    return (
      <Card className="flex min-h-[160px] flex-col items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="font-medium">Nu ai încă recomandări.</div>
        <div className="mt-1 text-xs">
          După prima ta experiență de onboarding și antrenament, aici vor apărea
          pași următori sugerați.
        </div>
      </Card>
    );
  }

  // dacă nu avem activeId valid, folosim prima recomandare ca activă
  const fallbackActive = activeId && items.some((i) => i.id === activeId)
    ? activeId
    : items[0].id;

  // punem cardul activ primul în listă, restul în ordinea lor după sortRecommendations
  const ordered = [
    items.find((i) => i.id === fallbackActive)!,
    ...items.filter((i) => i.id !== fallbackActive),
  ];

  const total = ordered.length;
  const maxVisible = Math.min(total, 6); // limitează stack-ul pentru UX

  return (
    <div className="relative h-[260px] w-full">
      {ordered.slice(0, maxVisible).map((item, index) => {
        const isActive = item.id === fallbackActive;
        const offset = index * 18; // px
        const scale = isActive ? 1 : 1 - index * 0.03;
        const opacity = isActive ? 1 : 0.9 - index * 0.08;
        const zIndex = maxVisible - index;

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onActiveChange(item.id)}
            className={cn(
              "absolute inset-x-0 mx-auto flex w-full max-w-sm cursor-pointer text-left focus:outline-none",
              isActive ? "pointer-events-auto" : "pointer-events-auto"
            )}
            style={{ top: offset, zIndex }}
            initial={false}
            animate={{
              scale,
              opacity,
              y: 0,
            }}
            whileHover={{
              y: isActive ? -4 : -2,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <Card
              className={cn(
                "w-full border bg-background/95 px-3 py-3 shadow-md backdrop-blur-sm",
                isActive
                  ? "border-primary/40 shadow-lg"
                  : "border-border shadow-sm"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  #{total - index}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-xs font-semibold">
                {item.title}
              </div>
              {isActive && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="line-clamp-1">
                    {item.shortLabel || item.title}
                  </span>
                  {item.estimatedMinutes && (
                    <span>{item.estimatedMinutes} min</span>
                  )}
                </div>
              )}
            </Card>
          </motion.button>
        );
      })}

      {/* spacer pentru a nu se suprapune vizual cu secțiunea de jos */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

3.3. Panou de detalii – RecommendationDetailPanel (coloana din dreapta)

Fișier nou:

components/recommendations/RecommendationDetailPanel.tsx

// components/recommendations/RecommendationDetailPanel.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OmniRecommendation } from "@/lib/recommendations";
import { getRecommendationStatusLabel } from "@/lib/recommendations";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface RecommendationDetailPanelProps {
  item: OmniRecommendation | null;
}

export function RecommendationDetailPanel({
  item,
}: RecommendationDetailPanelProps) {
  if (!item) {
    return (
      <Card className="flex min-h-[260px] flex-col items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="font-medium">Selectează o recomandare din stânga.</div>
        <div className="mt-1 text-xs">
          Aici vei vedea detaliile, explicațiile și pașii următori.
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
      >
        <Card className="flex min-h-[260px] flex-col justify-between px-4 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase">
                {item.type}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {getRecommendationStatusLabel(item.status)}
              </Badge>
              {item.estimatedMinutes && (
                <Badge variant="outline" className="text-[10px]">
                  ~{item.estimatedMinutes} min
                </Badge>
              )}
            </div>

            <h2 className="mt-2 text-base font-semibold leading-snug">
              {item.title}
            </h2>

            {item.tags && item.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] lowercase"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[11px] text-muted-foreground">
            <span>
              Adăugată la:{" "}
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>

            {item.ctaHref ? (
              <Button size="sm" asChild>
                <Link href={item.ctaHref}>
                  {item.ctaLabel || "Începe acest pas"}
                </Link>
              </Button>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}


Pagina principală – /recommendation

4.1. Pagina Next.js

Presupunere: folosești routerul pages/.
Creează fișier nou:

pages/recommendation.tsx

Dacă ești pe app/ router, mută componenta în app/recommendation/page.tsx și adaugă "use client"; sus.

// pages/recommendation.tsx

import { useState, useMemo } from "react";
import Head from "next/head";
import { useUserRecommendations } from "@/components/useUserRecommendations";
import type { OmniRecommendation } from "@/lib/recommendations";
import { getPrimaryRecommendation } from "@/lib/recommendations";
import { RecommendationFilters } from "@/components/recommendations/RecommendationFilters";
import type { RecommendationFilterKey } from "@/components/recommendations/RecommendationFilters";
import { RecommendationListStack } from "@/components/recommendations/RecommendationListStack";
import { RecommendationDetailPanel } from "@/components/recommendations/RecommendationDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/components/I18nProvider";

function filterRecommendations(
  items: OmniRecommendation[],
  filter: RecommendationFilterKey
): OmniRecommendation[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  switch (filter) {
    case "new":
      return items.filter((i) => i.status === "new");
    case "active":
      return items.filter((i) => i.status === "active");
    case "done":
      return items.filter((i) => i.status === "done");
    case "today":
      return items.filter((i) =>
        (i.createdAt || "").startsWith(todayStr)
      );
    case "all":
    default:
      return items;
  }
}

export default function RecommendationPage() {
  const { recommendations, loading, error } = useUserRecommendations();
  const [filter, setFilter] = useState<RecommendationFilterKey>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const { i18n } = useI18n();

  const filtered = useMemo(
    () => filterRecommendations(recommendations, filter),
    [recommendations, filter]
  );

  const activeRecommendation: OmniRecommendation | null = useMemo(() => {
    if (!filtered.length) return null;
    if (activeId && filtered.some((r) => r.id === activeId)) {
      return filtered.find((r) => r.id === activeId)!;
    }
    return getPrimaryRecommendation(filtered) ?? null;
  }, [filtered, activeId]);

  const handleActiveChange = (id: string) => {
    setActiveId(id);
  };

  return (
    <>
      <Head>
        <title>Recomandările tale | OmniMental</title>
      </Head>

      <main className="mx-auto flex max-w-5xl flex-col px-4 py-6 md:py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Recomandările tale
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Aici vezi pașii sugerați pentru tine, în funcție de ce ai ales în
              onboarding, de testele tale și de progresul din platformă.
            </p>
          </div>

          <RecommendationFilters value={filter} onChange={setFilter} />
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] items-start">
          {/* Coloana stângă: stack */}
          <div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-2xl" />
                <Skeleton className="h-10 w-11/12 rounded-2xl" />
                <Skeleton className="h-10 w-10/12 rounded-2xl" />
              </div>
            ) : (
              <RecommendationListStack
                items={filtered}
                activeId={activeRecommendation?.id ?? null}
                onActiveChange={handleActiveChange}
              />
            )}
          </div>

          {/* Coloana dreaptă: detalii */}
          <div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : (
              <RecommendationDetailPanel item={activeRecommendation} />
            )}

            {error && !loading && (
              <p className="mt-2 text-xs text-destructive">
                A apărut o problemă la încărcarea recomandărilor. Te rog să
                reîncerci mai târziu.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}


Dacă folosești app router:

Mută componenta în app/recommendation/page.tsx.

Adaugă "use client"; la începutul fișierului.

Înlocuiește Head cu metadata sau cu next/head doar dacă păstrezi stylul actual.

Integrarea cu alte componente / fluxuri

5.1. Onboarding → scriere recomandări

Te rog să:

Identifici locul în care finalizezi recomandarea principală în onboarding (componenta RecommendationStep / experience-onboarding).

După ce algoritmul decide:

formatul recomandat (grup vs individual),

eventual un quest / exercițiu specific,
scrie o recomandare în Firestore la path:

userRecommendations/{userId}/items/{autoId}

cu câmpuri de forma:

{
  userId,
  title: "Începe cu programul de grup OmniMental",
  shortLabel: "Pasul 1 – Alege programul",
  type: "onboarding",
  status: "new",
  priority: 1,
  createdAt: new Date().toISOString(),
  estimatedMinutes: 10,
  tags: ["onboarding", "claritate"],
  body: "Bazat pe răspunsurile tale, îți recomandăm să începi cu programul de grup. Următorul pas este să alegi o sesiune de test / demo și să îți blochezi timp în calendar...",
  ctaLabel: "Vezi detaliile programului",
  ctaHref: "/progress?from=recommendation-onboarding"
}


Asigură-te că scrierea respectă mecanismul areWritesDisabled() dacă este folosit și în alte părți.

5.2. Dashboard / Progress – link către Recomandări

Pe dashboard sau în pagina /progress, adaugă un mic card / link:

„Vezi recomandările tale actuale”

href="/recommendation"

Scop: userul să poată reveni ușor în pagina de Recomandări după ce face teste / antrenamente.

Rezumat sarcini pentru implementare

Creează lib/recommendations.ts cu tipurile și helper-ele de sortare/status.

Creează components/useUserRecommendations.ts:

folosește useProfile pentru userId;

folosește onSnapshot pe userRecommendations/{userId}/items ordonate desc după createdAt;

returnează { recommendations, loading, error }.

Creează folderul components/recommendations/ și fișierele:

RecommendationFilters.tsx

RecommendationListStack.tsx

RecommendationDetailPanel.tsx

Creează pagina pages/recommendation.tsx (sau app/recommendation/page.tsx dacă folosești app router), folosind:

useUserRecommendations

componentele de mai sus

layout în 2 coloane (stack stânga, detaliu dreapta).

Adaugă reguli Firestore pentru userRecommendations/{userId}/items/{recId} (după modelul isOwner).

În fluxul de onboarding (RecommendationStep / experience-onboarding), după calculul recomandării:

scrie o intrare inițială în userRecommendations.

Adaugă un link/CTA către /recommendation în:

progress sau dashboard, astfel încât userul să ajungă ușor la această pagină.

După implementare:

testează cu câteva documente manuale în Firestore (3–5 recomandări cu tipuri și statusuri diferite) ca să verifici:

stack-ul vizual (încărcat cu mai multe recomandări),

filtrarea (All/New/Active/Done/Today),

panoul de detalii,

link-urile CTA.