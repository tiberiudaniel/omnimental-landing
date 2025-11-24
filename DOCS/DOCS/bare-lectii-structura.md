OmniKuno „accordion”: cardul se deschide fix sub bara activă
Obiectiv

Pe pagina de modul OmniKuno, toate lecțiile sunt afișate ca bare orizontale (timeline).

Doar lecția activă poate fi deschisă ca accordion:

când userul dă click pe bara activă → se deschide cardul lecției imediat sub bară, iar barele de dedesubt sunt împinse în jos;

cardul se închide fie la finalizare, fie la click repetat.

Lecțiile:

done = bară cu check (nu se mai deschide în modul principal),

active = bară accentuată, expandabilă,

locked = bară gri/fade, cu lacăt, ne-clickabilă.

După ce userul finalizează lecția activă:

lecția curentă devine done,

cardul se închide,

următoarea lecție devine active, dar nu se deschide automat (userul trebuie să dea click).

Se păstrează logica secvențială pentru computeLessonsStatus (deja discutată: done → active → locked).

1) Componentă nouă: LessonAccordionRow

Creează un fișier nou:

components/omniKuno/LessonAccordionRow.tsx

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LessonStripStatus = "done" | "active" | "locked";

export type LessonAccordionRowProps = {
  index: number;
  title: string;
  levelLabel?: string;     // ex: "Ușor"
  centerLabel?: string;    // ex: "Inimă"
  durationLabel?: string;  // ex: "~6 min"
  status: LessonStripStatus;
  lang: "ro" | "en";

  isOpen: boolean;
  onToggle: () => void;

  children?: ReactNode;    // cardul mare de lecție (randat când isOpen && active)
};

export default function LessonAccordionRow({
  index,
  title,
  levelLabel,
  centerLabel,
  durationLabel,
  status,
  lang,
  isOpen,
  onToggle,
  children,
}: LessonAccordionRowProps) {
  const isClickable = status === "active";

  const statusLabel =
    status === "done"
      ? lang === "ro"
        ? "FINALIZATĂ"
        : "COMPLETED"
      : status === "active"
      ? lang === "ro"
        ? "ÎN DESFĂȘURARE"
        : "IN PROGRESS"
      : lang === "ro"
      ? "URMEAZĂ"
      : "NEXT";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable}
        className={cn(
          "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition-all",
          "md:px-5 md:py-4",
          status === "done" && "border-transparent bg-white/70 text-neutral-700",
          status === "active" &&
            "border-[#f2b39b] bg-[#fff8f4] shadow-sm hover:bg-[#fff4ee]",
          status === "locked" && "border-transparent bg-neutral-100 text-neutral-400",
          !isClickable && "cursor-default",
        )}
      >
        <div className="flex items-center gap-3">
          {/* icon status simplu */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">
            {status === "done" ? "✓" : status === "active" ? "▶" : "🔒"}
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              {index}.{" "}
              {lang === "ro" ? "Lecție" : "Lesson"}
            </span>
            <span className="text-sm font-medium md:text-base">
              {title}
            </span>
            {(levelLabel || centerLabel || durationLabel) && (
              <span className="mt-1 text-xs text-neutral-500 md:text-sm">
                {[levelLabel, centerLabel, durationLabel].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end text-[10px] uppercase tracking-[0.18em]">
          <span
            className={cn(
              status === "done" && "text-emerald-500",
              status === "active" && "text-[#f26f4b]",
              status === "locked" && "text-neutral-400",
            )}
          >
            {statusLabel}
          </span>
        </div>
      </button>

      {/* zona de expand: cardul lecției active */}
      {isOpen && status === "active" && (
        <div className="mt-3 rounded-3xl border border-[#f2b39b]/60 bg-white p-4 md:p-5">
          {children}
        </div>
      )}
    </div>
  );
}


Notă: cn este utilitarul existent pentru className (dacă numele e altul, adaptează).

2) Integrare în ModuleExperience (OmniKunoPage)

Fișier: components/omniKuno/OmniKunoPage.tsx
Componentă: ModuleExperience (cea care primește module, timeline, lang, etc.).

2.1. State pentru lecția deschisă

În interiorul ModuleExperience, adaugă:

const [openLessonId, setOpenLessonId] = useState<string | null>(null);

const flatTimeline = useMemo(
  () => [...timeline].sort((a, b) => a.order - b.order),
  [timeline],
);

const activeItem = flatTimeline.find((item) => item.status === "active") ?? null;

useEffect(() => {
  // la prima randare / schimbare de modul:
  // dacă există lecția din URL și e validă, o deschidem
  if (initialLessonId && flatTimeline.some((item) => item.id === initialLessonId)) {
    setOpenLessonId(initialLessonId);
    return;
  }
  // altfel, deschidem implicit lecția activă (dacă există)
  if (activeItem) {
    setOpenLessonId(activeItem.id);
  } else {
    setOpenLessonId(null);
  }
}, [initialLessonId, activeItem, flatTimeline]);

2.2. Render pentru toate barele + card expandabil

În JSX-ul principal al modulului, în loc să randezi toate cardurile mari deodată, folosește:

<div className="space-y-3 md:space-y-4">
  {flatTimeline.map((item, idx) => {
    const isOpen = item.id === openLessonId;

    const levelLabel = item.levelLabel ?? item.level ?? "";
    const centerLabel = item.centerLabel ?? item.center ?? "";
    const durationLabel = item.durationLabel ?? item.estimatedDurationLabel ?? "";

    return (
      <LessonAccordionRow
        key={item.id}
        index={idx + 1}
        title={item.title}
        levelLabel={levelLabel}
        centerLabel={centerLabel}
        durationLabel={durationLabel}
        status={item.status}
        lang={lang}
        isOpen={isOpen}
        onToggle={() => {
          if (item.status !== "active") return;
          setOpenLessonId((prev) => (prev === item.id ? null : item.id));
          onLessonSelect?.(item.id);
        }}
      >
        {/* aici intră cardul detaliat pentru lecția activă */}
        <ActiveLessonInner
          module={module}
          lessonTimelineItem={item}
          lang={lang}
          onCompleted={(meta) => handleLessonCompleted(item.id, meta)}
        />
      </LessonAccordionRow>
    );
  })}
</div>


ActiveLessonInner este un wrapper pe logica deja existentă pentru afișarea conținutului unei lecții (probabil bazată pe LessonView / LessonContent).

2.3. Wrapper pentru cardul lecției active

Creează un mic wrapper care reutilizează componenta existentă LessonView (sau cum se numește în repo) și simplifică meta-info (fără a dubla titlul/nivelul deja vizibile în bară).

Exemplu:

components/omniKuno/ActiveLessonInner.tsx

"use client";

import LessonView from "@/components/omniKuno/LessonView";
import { OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { KunoTimelineItem } from "@/components/omniKuno/useKunoTimeline";

type ActiveLessonInnerProps = {
  module: OmniKunoModuleConfig;
  lessonTimelineItem: KunoTimelineItem;
  lang: "ro" | "en";
  onCompleted: (meta?: {
    updatedPerformance?: any;
    score?: number;
    timeSpentSec?: number;
  }) => void;
};

export default function ActiveLessonInner({
  module,
  lessonTimelineItem,
  lang,
  onCompleted,
}: ActiveLessonInnerProps) {
  const lessonConfig = module.lessons.find((l) => l.id === lessonTimelineItem.id);
  if (!lessonConfig) return null;

  return (
    <LessonView
      lang={lang}
      lesson={lessonConfig}
      // importante: callback-ul de finalizare
      onComplete={onCompleted}
      // dacă LessonView are titlu/meta redundante, redu-le:
      // ex: prop showHeader={false}, dacă există; altfel, Codex poate extrage header-ul într-o variantă compactă.
    />
  );
}


Dacă LessonView nu suportă ascunderea header-ului, poți:

adăuga o prop compactHeader?: boolean sau hideMeta?: boolean,

sau extrage logica de header într-un subcomponent și să nu îl mai folosești aici.

3) Actualizează handleLessonCompleted

Tot în ModuleExperience, adaptează handleLessonCompleted astfel încât:

să marcheze lecția ca finalizată (logică existentă),

să închidă cardul curent,

să nu mai deschidă automat lecția următoare (userul va da click pe bară).

Exemplu:

const handleLessonCompleted = useCallback(
  (
    lessonId: string,
    meta?: { updatedPerformance?: any; score?: number; timeSpentSec?: number },
  ) => {
    setLocalCompleted((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));

    if (meta?.updatedPerformance) {
      setLocalPerformance(meta.updatedPerformance);
    }

    // cardul se închide; statusurile se vor recalcula, iar următoarea lecție devine "active"
    setOpenLessonId(null);

    if (onToast) {
      if (meta?.score != null) {
        onToast(
          lang === "ro"
            ? `Quiz finalizat cu ${meta.score}%. Continuă misiunile!`
            : `Quiz completed with ${meta.score}%. Keep the missions rolling!`,
        );
      } else {
        onToast(
          lang === "ro"
            ? "Lecție finalizată și XP actualizat."
            : "Lesson completed and XP updated.",
        );
      }
    }
  },
  [lang, onToast],
);


computeLessonsStatus se va ocupa de:

marcat lecția ca done,

promovat următoarea lecție la active.

Userul va vedea imediat:

3 lecții FINALIZATE,

1 lecție ACTIVĂ (dar bară simplă),

1 lecție LOCKED (fade, lacăt),
și va trebui să dea click pe bara activă pentru a deschide cardul exact la locul ei.

4) Overview (opțional, dar recomandat)

Poți păstra/implementa în continuare ModuleOverviewDialog cu:

buton mic „Vezi toate lecțiile” în header,

listă completă de lecții cu statusurile lor,

opțional: posibilitatea de a sări la o lecție (respectând restricțiile de locked).

Acest overview nu schimbă logica accordion-ului; e doar un „map”.

După ce faci pașii de mai sus:

barele orizontale rămân toate vizibile,

cardul lecției se deschide fix sub bara activă, ca un expand local,

după finalizare, cardul se închide, lecția devine finalizată, următoarea devine activă,

lecția următoare locked este gri + lacăt, până îi vine rândul.