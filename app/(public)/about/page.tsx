"use client";

import { useState } from "react";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useI18n } from "@/components/I18nProvider";

const aboutCopy = {
  ro: {
    badge: "Despre mine",
    heading: "Sunt coach OmniMental și antrenez profesioniști pentru claritate sub presiune.",
    paragraphs: [
      "Mă fascinează modul în care mintea, corpul și respirația pot fi acordate precum un instrument. În ultimii ani am lucrat cu lideri din tech, consultanță și antreprenoriat pentru a-i ajuta să-și recupereze energia, focusul și controlul emoțional.",
      "OmniMental s-a născut după experiența în echipe cu ritm alert, unde am observat că cei care reușesc pe termen lung sunt cei care își antrenează nervul vag, își modelează atenția și rămân conectați la sens.",
    ],
    values: [
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
    ],
    toolsTitle: "Instrumente preferate",
    tools: [
      "Antrenament HRV și biofeedback pentru reglaj autonom.",
      "Respirație box & coherent breathing pentru reset mental.",
      "Hipnoză conversațională pentru rescriere de scenarii interne.",
      "Jurnalizare ghidată și ancore somatice pentru focus zilnic.",
    ],
    principlesTitle: "Valorile cu care lucrez",
    principles: [
      "Curajul de a privi interiorul chiar și când e inconfortabil.",
      "Disciplina de a exersa zilnic, nu doar când apar probleme.",
      "Generozitatea de a împărtăși progresul cu echipa și comunitatea.",
      "Etica: performanță fără sacrificarea sănătății sau a valorilor.",
    ],
    imageAlt: "Diagrame vagus nerve",
  },
  en: {
    badge: "About me",
    heading: "I coach OmniMental programs and help professionals stay clear under pressure.",
    paragraphs: [
      "I’m fascinated by how mind, body, and breath can be tuned like an instrument. Over the past years I’ve worked with tech leads, consultants, and founders to help them reclaim energy, focus, and emotional control.",
      "OmniMental grew out of fast-paced teams where the people who thrive long term are those who train the vagus nerve, reshape attention, and stay connected to meaning.",
    ],
    values: [
      {
        title: "System, not symptom",
        text: "I work with the entire nervous system—body, mind, breath—so results stay stable even when the pressure is high.",
      },
      {
        title: "Field-tested practices",
        text: "I extract tools from neuroscience, somatic coaching, and biofeedback, then turn them into practical daily rituals.",
      },
      {
        title: "Inner leadership",
        text: "Clients become leaders of their own state: emotional clarity, sustainable energy, lucid decisions.",
      },
    ],
    toolsTitle: "Favorite instruments",
    tools: [
      "HRV training and biofeedback for autonomic balance.",
      "Box breathing & coherent breathing for mental reset.",
      "Conversational hypnosis to rewrite inner scripts.",
      "Guided journaling and somatic anchors for daily focus.",
    ],
    principlesTitle: "Values I work with",
    principles: [
      "Courage to look inward even when it’s uncomfortable.",
      "Discipline to practice every day, not only when trouble hits.",
      "Generosity to share progress with the team and community.",
      "Ethics: performance without sacrificing health or values.",
    ],
    imageAlt: "Vagus nerve diagram",
  },
} as const;

function AboutContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useI18n();
  const copy = aboutCopy[lang] ?? aboutCopy.ro;
  const navLinks = useNavigationLinks();

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-24">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-5xl px-6 pt-12">
        <header className="panel-canvas panel-canvas--hero panel-canvas--brain-left grid gap-8 rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-12 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px] md:grid-cols-[3fr_2fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">{copy.badge}</div>
            <h1 className="mt-4 text-3xl font-semibold text-[#1F1F1F]">
              {copy.heading}
            </h1>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-relaxed text-[#2C2C2C]">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95">
            <Image
              src="https://static.wixstatic.com/media/139de8_ab63b1409ab845eba55ed224056ded17~mv2.jpg/v1/fill/w_1200,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Vegus-Nerve-dreamstime_xxl_215358845.jpg"
              alt={copy.imageAlt}
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {copy.values.map((value) => (
            <div
              key={value.title}
              className="rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-6 text-[#2C2C2C] shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
            >
              <h2 className="text-lg font-semibold text-[#1F1F1F]">{value.title}</h2>
              <p className="mt-3 text-sm leading-relaxed">{value.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">{copy.toolsTitle}</h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {copy.tools.map((tool) => (
                <li key={tool} className="list-disc">
                  {tool}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">{copy.principlesTitle}</h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {copy.principles.map((principle) => (
                <li key={principle} className="list-disc">
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return <AboutContent />;
}
