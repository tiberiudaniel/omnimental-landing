"use client";

import { useMemo, useState } from "react";
import CTAButton from "../../components/CTAButton";
import ClientI18nWrapper from "../../components/ClientI18nWrapper";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";

const resetProgramBenefits = [
  "Identify ce te consumă energetic.",
  "Ieși din bucla stresului și recâștigă focus.",
  "Regenerează-ți resursele fără stimulente.",
  "Reînvață să te simți în siguranță și în control.",
];

const levelProgression = [
  "Level 1 – Awareness: devii conștient de gânduri, emoții și tipare automate.",
  "Level 2 – Control: respirație, reframing și ancorare pentru reglaj instant.",
  "Level 3 – Strategy: gestionarea conflictelor și decizii lucide sub presiune.",
  "Level 4 – Mastery: automatisme de claritate și încredere în contexte complexe.",
];

const methods = [
  "CBT + ACT pentru rescrierea tiparelor mentale.",
  "NLP & hipnoză pentru acces la resurse inconștiente.",
  "Biofeedback în timp real (HRV, atenție, reacții fiziologice).",
  "Respirație, mișcare și relaxare ghidată pentru nervul vag.",
  "Simulări din viața reală: exersezi reacțiile sub presiune, nu doar teorie.",
];

const audience = [
  "Manageri, antreprenori, traderi, consultanți care livrează zilnic sub presiune.",
  "Profesioniști care simt că stresul conduce și vor să reia controlul.",
  "Cei care urmăresc claritate, focus și energie constantă în plan profesional și personal.",
  "Oameni care își cultivă „inner game”-ul și leadershipul autentic.",
];

const results = [
  "Controlezi emoțiile sub presiune și răspunzi cu calm.",
  "Intri în „zonă” când miza e mare și păstrezi focusul.",
  "Rezistență psihologică și fizică – rămâi în picioare când alții cedează.",
  "Decizii rapide și inspirate, bazate pe logică și intuiție.",
  "Energie constantă – navighezi între simpatic și parasimpatic ca un profesionist.",
  "Automatisme de performanță, nu dependență de voință.",
];

const transformation = [
  "Pornești obosit și atras în automatisme consumatoare.",
  "Parcurgi niveluri, misiuni și exerciții care resetează sistemul nervos.",
  "Câștigi încredere, control, claritate și reziliență reală.",
  "Rămâi parte dintr-o comunitate care trăiește la potențial maxim.",
];

const highlightCards = [
  {
    title: "Mental coaching pentru sistemul întreg",
    copy:
      "Am pornit OmniMental din credința că omul este un sistem. Când creierul, inima și intestinul sunt aliniate, deciziile devin simple și acțiunile coerente.",
  },
  {
    title: "Din haos către claritate",
    copy:
      "Trăim în presiune continuă, distrași și supraîncărcați. Programul te antrenează să recunoști declanșatorii și să revii rapid la calm și focus.",
  },
  {
    title: "Proces cu miză reală",
    copy:
      "Nu e teorie frumoasă. Lucrezi cu biofeedback, simulări și disciplină de echipă ca să-ți formezi automatisme de performanță.",
  },
];

function GroupInfoContent() {
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
    <div className="bg-[#FDFCF9] min-h-screen pb-20">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-4xl px-6 pt-12">
        <section className="rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-12 shadow-[0_12px_28px_rgba(0,0,0,0.05)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            Mental Coaching Online Group
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-[#1F1F1F] sm:text-4xl">
            Programul care aliniază mintea, emoțiile și performanța.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#2C2C2C]">
            Pentru profesioniștii care vor să treacă de la suprasolicitare la claritate și control.
            OmniMental Coaching condensează ani de experiență în medii cu miză mare într-un antrenament
            practic de 12 săptămâni.
          </p>
          <div className="mt-6">
            <CTAButton text="Aplică pentru program" />
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {highlightCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-6 py-6 text-[#2C2C2C] shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
            >
              <h2 className="text-lg font-semibold text-[#1F1F1F]">{card.title}</h2>
              <p className="mt-3 text-sm leading-relaxed">{card.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">Ce rezolvi concret</h2>
            <p className="mt-4 text-[#2C2C2C]">
              Sistemul nervos poate fi recalibrat. Lucrăm cu corpul, mintea și respirația ca să-ți recapeți
              siguranța, energia și capacitatea de a decide limpede.
            </p>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {resetProgramBenefits.map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
              Testimonial fondator
            </h3>
            <p className="mt-3 text-sm italic text-[#2C2C2C] leading-relaxed">
              „Performanța adevărată nu depinde doar de abilități tehnice, ci de felul în care îți menții
              claritatea mentală și echilibrul interior chiar și în furtuni. OmniMental este sistemul care
              te ajută să navighezi presiunea cu mintea senină.”
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Rezultate</div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">Ce obții după 12 săptămâni</h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {results.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <CTAButton text="Vreau aceste rezultate" />
          </div>
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Structură</div>
            <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
              Parcursul pe niveluri
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-[#2C2C2C]">
              {levelProgression.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="text-[#A08F82]">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Metode</div>
            <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
              Ce folosim și cum aplicăm
            </h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {methods.map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Pentru cine</div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
            Dacă te regăsești aici, programul e pentru tine
          </h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {audience.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[8px] border border-[#D8C6B6] bg-[#F6F2EE] px-8 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Transformare</div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
            Cum se schimbă ritmul tău interior
          </h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {transformation.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-[8px] border border-[#D8C6B6] bg-white px-8 py-10 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <p className="text-[#2C2C2C]">
            Dacă simți că ai ajuns la limită cu ceea ce știi acum și vrei să intri în liga celor care își
            stăpânesc mintea, emoțiile și performanța, acest program este pentru tine.
          </p>
          <p className="mt-3 font-semibold text-[#1F1F1F]">
            Înscrie-te și începe călătoria de la conștientizare la măiestrie.
          </p>
          <div className="mt-5">
            <CTAButton text="Înscrie-te acum" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GroupInfoPage() {
  return (
    <ClientI18nWrapper>
      <GroupInfoContent />
    </ClientI18nWrapper>
  );
}
