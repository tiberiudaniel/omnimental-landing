"use client";

import { useEffect, useMemo, useState } from "react";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { OMNI_KUNO_ARC_INTROS } from "@/config/omniKunoLessonContent";

const ARC_ORDER: Array<keyof (typeof OMNI_KUNO_ARC_INTROS)["emotional_balance"]> = [
  "trezire",
  "primele_ciocniri",
  "profunzime",
  "maestrie",
];

type Props = {
  areaKey: OmniKunoModuleId;
  areaLabel: string;
};

export default function ModuleArcHero({ areaKey, areaLabel }: Props) {
  const storageKey = `omnikuno_arc_${areaKey}_hidden`;
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(storageKey) === "1";
  });
  const arcEntries = useMemo(() => OMNI_KUNO_ARC_INTROS[areaKey], [areaKey]);
  const hasArcContent = arcEntries && Object.values(arcEntries).some((entry) => entry?.title || entry?.body);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hidden) {
      window.localStorage.setItem(storageKey, "1");
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }, [hidden, storageKey]);

  if (!hasArcContent) return null;

  if (hidden) {
    return (
      <section className="mb-3 flex items-center justify-between rounded-2xl border border-[#E7DED3] bg-white/70 px-4 py-3 text-sm text-[#4D3F36] shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Arc · {areaLabel}</p>
          <p className="text-sm text-[#4D3F36]">Revizuiește intro-ul modulului oricând ai nevoie.</p>
        </div>
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="rounded-full border border-[#C07963] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white"
        >
          Afișează
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-[#E7DED3] bg-white/80 px-6 py-6 text-[#2C2C2C] shadow-sm">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Arc · {areaLabel}</p>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold text-[#2C2C2C]">Trezire → Primele Ciocniri → Profunzime → Maestrie</h2>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="rounded-full border border-transparent px-2 py-1 text-xs uppercase tracking-[0.3em] text-[#B08A78] transition hover:border-[#B08A78]"
          >
            Ascunde
          </button>
        </div>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-[#4D3F36]">
        {ARC_ORDER.map((key) => {
          const arc = arcEntries?.[key];
          if (!arc) return null;
          return (
            <div key={arc.id} className="space-y-1">
              <h3 className="text-base font-semibold text-[#2C2C2C]">{arc.title}</h3>
              <p>{arc.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
