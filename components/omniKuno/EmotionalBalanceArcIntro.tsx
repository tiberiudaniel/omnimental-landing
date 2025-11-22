"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "omnikuno_arc_calm_hidden";

export default function EmotionalBalanceArcIntro() {
  const [hidden, setHidden] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hidden) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [hidden]);

  if (hidden) {
    return (
      <section className="mb-3 flex items-center justify-between rounded-2xl border border-[#E7DED3] bg-white/70 px-4 py-3 text-sm text-[#4D3F36] shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Arc · Echilibru emoțional</p>
          <p className="text-sm text-[#4D3F36]">Revizuiește firul narativ al modului oricând ai nevoie.</p>
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
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Arc · Echilibru Emoțional</p>
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
        <ArcBlock
          title="Trezirea"
          body="Începutul echilibrului nu este despre a schimba ceva, ci despre a vedea. Observi respirația, ritmul, tensiunea și gândurile fără să le grăbești. În acest spațiu mic dintre stimul și reacție apare trezirea: locul din care poți alege."
        />
        <ArcBlock
          title="Primele ciocniri"
          body="Pe măsură ce vezi mai clar, apar provocările: un ton ridicat, un mesaj sec, o critică. Ele nu sunt obstacole, ci invitații. Aici înveți respirația lentă, prezența în corp și pauza scurtă înainte de răspuns, nu ca să pari calm, ci ca să rămâi conectat la tine."
        />
        <ArcBlock
          title="Profunzime"
          body="Când mergi mai departe, rușinea, vinovăția sau dorința de retragere ies la suprafață. Nu sunt dușmani, ci straturi vechi care cer atenție. Înveți să stai cu ele fără să le împingi deoparte, să respiri cu ele și să lași liniștea să se așeze."
        />
        <ArcBlock
          title="Maestrie"
          body="Maestria nu este control total. Este ritmul în care poți rămâne prezent chiar și în momente tensionate. Vocea ta rămâne calmă, faci pași mici înainte chiar și în zile grele. Nu urmărești perfecțiunea, ci o liniște activă pe care o poți lua cu tine oriunde."
        />
      </div>
    </section>
  );
}

function ArcBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-[#2C2C2C]">{title}</h3>
      <p>{body}</p>
    </div>
  );
}
