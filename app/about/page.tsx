"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import ClientI18nWrapper from "../../components/ClientI18nWrapper";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";

const values = [
  {
    title: "Sistem, nu simptom",
    text: "Lucrez cu întregul sistem nervos – corp, minte, respirație – pentru ca rezultatele să rămână stabile și sub presiune.",
  },
  {
    title: "Practici testate în teren",
    text: "Extrag instrumente din neuroștiință, coaching somatic și biofeedback și le traduc în ritualuri zilnice.",
  },
  {
    title: "Leadership interior",
    text: "Clienții mei devin lideri ai propriei stări: claritate emoțională, energie sustenabilă, decizii lucide.",
  },
];

function AboutContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useMemo(
    () => [
      { label: "Program", href: "/group-info", description: "Detalii Mental Coaching Group" },
      { label: "Evaluare", href: "/evaluation", description: "Completează scala de progres" },
      { label: "Despre mine", href: "/about", description: "Cine sunt și cum lucrez" },
      { label: "Contact", href: "mailto:hello@omnimental.ro", description: "Scrie-mi direct" },
    ],
    []
  );

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-5xl px-6 pt-12">
        <header className="grid gap-8 border border-[#D8C6B6] bg-white px-8 py-12 shadow-[0_12px_28px_rgba(0,0,0,0.05)] md:grid-cols-[3fr_2fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Despre mine</div>
            <h1 className="mt-4 text-3xl font-semibold text-[#1F1F1F]">
              Sunt coach OmniMental și antrenez profesioniști pentru claritate sub presiune.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#2C2C2C]">
              Mă fascinează modul în care mintea, corpul și respirația pot fi acordate precum un
              instrument. În ultimii ani am lucrat cu lideri din tech, consultanță și antreprenoriat
              pentru a-i ajuta să-și recupereze energia, focusul și controlul emoțional.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#2C2C2C]">
              OmniMental s-a născut după experiența în echipe cu ritm alert, unde am observat că cei
              care reușesc pe termen lung sunt cei care își antrenează nervul vag, își modelează
              atenția și rămân conectați la sens.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE]">
            <Image
              src="https://static.wixstatic.com/media/139de8_ab63b1409ab845eba55ed224056ded17~mv2.jpg/v1/fill/w_1200,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Vegus-Nerve-dreamstime_xxl_215358845.jpg"
              alt="Vagus nerve diagram"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-6 py-6 text-[#2C2C2C] shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
            >
              <h2 className="text-lg font-semibold text-[#1F1F1F]">{value.title}</h2>
              <p className="mt-3 text-sm leading-relaxed">{value.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">Instrumente preferate</h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              <li className="list-disc">Antrenament HRV și biofeedback pentru reglaj autonom.</li>
              <li className="list-disc">Respirație box & coherent breathing pentru reset mental.</li>
              <li className="list-disc">Hipnoză conversațională pentru rescriere de scenarii interne.</li>
              <li className="list-disc">Jurnalizare ghidată și ancore somatice pentru focus zilnic.</li>
            </ul>
          </div>
          <div className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">Valorile cu care lucrez</h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              <li className="list-disc">Curajul de a privi interiorul chiar și când e inconfortabil.</li>
              <li className="list-disc">Disciplina de a exersa zilnic, nu doar când apar probleme.</li>
              <li className="list-disc">Generozitatea de a împărtăși progresul cu echipa și comunitatea.</li>
              <li className="list-disc">Etica: performanță fără sacrificarea sănătății sau a valorilor.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <ClientI18nWrapper>
      <AboutContent />
    </ClientI18nWrapper>
  );
}
