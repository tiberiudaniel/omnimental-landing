"use client";

import { useState } from "react";
import CTAButton from "../../components/CTAButton";
import AccountModal from "../../components/AccountModal";
import { recordRecommendationProgressFact } from "../../lib/progressFacts";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { useI18n } from "../../components/I18nProvider";

const groupCopy = {
  ro: {
    hero: {
      badge: "Mental Coaching Online Group",
      title: "Programul care aliniază mintea, emoțiile și performanța.",
      body:
        "Pentru profesioniștii care vor să treacă de la suprasolicitare la claritate și control. OmniMental condensează ani de experiență în medii cu miză mare într-un antrenament practic de 12 săptămâni.",
      cta: "Aplică pentru program",
    },
    highlights: [
      {
        title: "Mental coaching pentru sistemul întreg",
        copy:
          "OmniMental pornește de la premisa că omul este un sistem. Când creierul, inima și intestinul sunt aliniate, deciziile devin simple și acțiunile coerente.",
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
    ],
    resetBenefits: [
      "Identifici ce te consumă energetic.",
      "Ieși din bucla stresului și recâștigă focus.",
      "Regenerează-ți resursele fără stimulente.",
      "Reînvață să te simți în siguranță și în control.",
    ],
    testimonial: {
      title: "Testimonial fondator",
      quote:
        "„Performanța adevărată nu depinde doar de abilități tehnice, ci de felul în care îți menții claritatea mentală și echilibrul interior chiar și în furtuni. OmniMental este sistemul care te ajută să navighezi presiunea cu mintea senină.”",
    },
    results: {
      title: "Ce obții după 12 săptămâni",
      cta: "Vreau aceste rezultate",
      list: [
        "Controlezi emoțiile sub presiune și răspunzi cu calm.",
        "Intri în „zonă” când miza e mare și păstrezi focusul.",
        "Rezistență psihologică și fizică – rămâi în picioare când alții cedează.",
        "Decizii rapide și inspirate, bazate pe logică și intuiție.",
        "Energie constantă – navighezi între simpatic și parasimpatic ca un profesionist.",
        "Automatisme de performanță, nu dependență de voință.",
      ],
    },
    levels: {
      title: "Parcursul pe niveluri",
      list: [
        "Level 1 – Awareness: devii conștient de gânduri, emoții și tipare automate.",
        "Level 2 – Control: respirație, reframing și ancorare pentru reglaj instant.",
        "Level 3 – Strategy: gestionarea conflictelor și decizii lucide sub presiune.",
        "Level 4 – Mastery: automatisme de claritate și încredere în contexte complexe.",
      ],
    },
    methods: {
      title: "Ce folosim și cum aplicăm",
      list: [
        "CBT + ACT pentru rescrierea tiparelor mentale.",
        "NLP & hipnoză pentru acces la resurse inconștiente.",
        "Biofeedback în timp real (HRV, atenție, reacții fiziologice).",
        "Respirație, mișcare și relaxare ghidată pentru nervul vag.",
        "Simulări din viața reală: exersezi reacțiile sub presiune, nu doar teorie.",
      ],
    },
    audience: {
      title: "Dacă te regăsești aici, programul e pentru tine",
      list: [
        "Manageri, antreprenori, traderi, consultanți care livrează zilnic sub presiune.",
        "Profesioniști care simt că stresul conduce și vor să reia controlul.",
        "Cei care urmăresc claritate, focus și energie constantă în plan profesional și personal.",
        "Oameni care își cultivă „inner game”-ul și leadershipul autentic.",
      ],
    },
    transformation: {
      title: "Cum se schimbă ritmul tău interior",
      list: [
        "Pornești obosit și atras în automatisme consumatoare.",
        "Parcurgi niveluri, misiuni și exerciții care resetează sistemul nervos.",
        "Câștigi încredere, control, claritate și reziliență reală.",
        "Rămâi parte dintr-o comunitate care trăiește la potențial maxim.",
      ],
    },
    closing: {
      text:
        "Dacă simți că ai ajuns la limită cu ceea ce știi acum și vrei să intri în liga celor care își stăpânesc mintea, emoțiile și performanța, acest program este pentru tine.",
      bold: "Înscrie-te și începe călătoria de la conștientizare la măiestrie.",
      cta: "Înscrie-te acum",
    },
  },
  en: {
    hero: {
      badge: "Mental Coaching Online Group",
      title: "The program that aligns your mind, emotions, and performance.",
      body:
        "Designed for professionals who want to move from overload to clarity and control. OmniMental distills years spent in high-stakes environments into a practical 12-week training experience.",
      cta: "Apply to the program",
    },
    highlights: [
      {
        title: "Whole-system mental coaching",
        copy:
          "OmniMental starts from the belief that we are a system. When brain, heart, and gut are aligned, actions become coherent and decisions stay simple.",
      },
      {
        title: "From chaos to clarity",
        copy:
          "We live under constant pressure and distraction. The group helps you recognize triggers quickly and return to calm focus when it matters.",
      },
      {
        title: "Real-stakes practice",
        copy:
          "This isn’t pretty theory. You work with biofeedback, simulations, and team discipline so performance habits replace panic.",
      },
    ],
    resetBenefits: [
      "Identify what drains your energy.",
      "Step out of the stress loop and regain focus.",
      "Recharge resources without stimulants.",
      "Relearn how to feel safe, grounded, and in control.",
    ],
    testimonial: {
      title: "Founder’s note",
      quote:
        "“True performance isn’t only about hard skills, but about keeping mental clarity and inner balance even during storms. OmniMental is the system that helps you ride pressure with a calm mind.”",
    },
    results: {
      title: "What you gain after 12 weeks",
      cta: "I want these results",
      list: [
        "Emotional control under pressure and calmer responses.",
        "Entering the performance “zone” on demand and keeping focus.",
        "Psychological and physical resilience—standing tall when others drop.",
        "Fast, inspired decisions backed by logic and intuition.",
        "Steady energy—switching between sympathetic and parasympathetic modes like a pro.",
        "Performance habits that replace willpower fatigue.",
      ],
    },
    levels: {
      title: "The level-by-level journey",
      list: [
        "Level 1 – Awareness: notice automatic thoughts, emotions, and patterns.",
        "Level 2 – Control: breathwork, reframing, and anchoring for instant regulation.",
        "Level 3 – Strategy: conflict management and lucid decisions under pressure.",
        "Level 4 – Mastery: clarity and confidence automatisms for complex contexts.",
      ],
    },
    methods: {
      title: "Methods we apply",
      list: [
        "CBT + ACT to rewrite mental patterns.",
        "NLP & hypnosis to access unconscious resources.",
        "Live biofeedback (HRV, attention, physiological reactions).",
        "Breath, movement, and guided relaxation for the vagus nerve.",
        "Real-life simulations: rehearse responses, not just theory.",
      ],
    },
    audience: {
      title: "If this sounds like you, the program fits",
      list: [
        "Managers, founders, traders, consultants delivering under pressure.",
        "Professionals who feel stress runs the show and want control back.",
        "People seeking clarity, focus, and steady energy at work and at home.",
        "Humans who cultivate their inner game and authentic leadership.",
      ],
    },
    transformation: {
      title: "How your inner rhythm shifts",
      list: [
        "You start drained, stuck in consuming loops.",
        "You progress through missions that reset the nervous system.",
        "You gain confidence, control, clarity, and real resilience.",
        "You remain part of a community that plays at its true potential.",
      ],
    },
    closing: {
      text:
        "If you feel you’ve hit the limit of what you know now and want to master mind, emotions, and performance, this program is built for you.",
      bold: "Apply and begin the journey from awareness to mastery.",
      cta: "Apply now",
    },
  },
} as const;

function GroupInfoContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useI18n();
  const copy = groupCopy[lang] ?? groupCopy.ro;
  const isRo = lang === "ro";
  const navLinks = useNavigationLinks();
  const [guestOpen, setGuestOpen] = useState(false);

  return (
    <div className="bg-[#FDFCF9] min-h-screen pb-20">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <div className="mx-auto max-w-4xl px-6 pt-12">
        <section className="panel-canvas panel-canvas--hero panel-canvas--brain-center rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-12 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {copy.hero.badge}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-[#1F1F1F] sm:text-4xl">
            {copy.hero.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#2C2C2C]">
            {copy.hero.body}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CTAButton text={copy.hero.cta} />
            <button
              type="button"
              onClick={() => { void recordRecommendationProgressFact({ badgeLabel: 'magic_open' }).catch(() => undefined); setGuestOpen(true); }}
              className="group inline-flex items-center gap-3 rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
            >
              {isRo ? 'Acces Invitat Special' : 'Enter as Special Guest'}
              <span className="translate-y-[1px] text-sm text-[#E60012] transition group-hover:translate-x-1 group-hover:text-[#B8000E]">→</span>
            </button>
            <AccountModal open={guestOpen} onClose={() => { void recordRecommendationProgressFact({ badgeLabel: 'magic_close' }).catch(() => undefined); setGuestOpen(false); }} />
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {copy.highlights.map((card) => (
            <div
              key={card.title}
              className="rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-6 text-[#2C2C2C] shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
            >
              <h2 className="text-lg font-semibold text-[#1F1F1F]">{card.title}</h2>
              <p className="mt-3 text-sm leading-relaxed">{card.copy}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div className="rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
            <h2 className="text-2xl font-semibold text-[#1F1F1F]">
              {isRo ? "Ce rezolvi concret" : "What you solve concretely"}
            </h2>
            <p className="mt-4 text-[#2C2C2C]">
              {isRo
                ? "Sistemul nervos poate fi recalibrat. Lucrăm cu corpul, mintea și respirația ca să-ți recapeți siguranța, energia și capacitatea de a decide limpede."
                : "Your nervous system can be recalibrated. We work with body, mind, and breath so you regain safety, energy, and clear decision-making."}
            </p>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {copy.resetBenefits.map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
              {copy.testimonial.title}
            </h3>
            <p className="mt-3 text-sm italic text-[#2C2C2C] leading-relaxed">
              {copy.testimonial.quote}
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {isRo ? "Rezultate" : "Results"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{copy.results.title}</h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {copy.results.list.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <CTAButton text={copy.results.cta} />
          </div>
        </section>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {isRo ? "Structură" : "Structure"}
          </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
              {copy.levels.title}
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-[#2C2C2C]">
              {copy.levels.list.map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="text-[#A08F82]">{index + 1 < 10 ? `0${index + 1}` : index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {isRo ? "Metode" : "Methods"}
          </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
              {copy.methods.title}
            </h2>
            <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
              {copy.methods.list.map((item) => (
                <li key={item} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {isRo ? "Pentru cine" : "Who it's for"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
            {copy.audience.title}
          </h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {copy.audience.list.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-[12px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-8 py-8 shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {isRo ? "Transformare" : "Transformation"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
            {copy.transformation.title}
          </h2>
          <ul className="mt-4 space-y-2 pl-5 text-sm text-[#2C2C2C]">
            {copy.transformation.list.map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-[1px]">
          <p className="text-[#2C2C2C]">
            {copy.closing.text}
          </p>
          <p className="mt-3 font-semibold text-[#1F1F1F]">
            {copy.closing.bold}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CTAButton text={copy.closing.cta} />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  try { localStorage.setItem('omnimental_guest_access', '1'); } catch {}
                  window.location.assign('/recommendation?demo=1');
                }
              }}
              className="group inline-flex items-center gap-3 rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
            >
              {isRo ? 'Acces Invitat Special' : 'Enter as Special Guest'}
              <span className="translate-y-[1px] text-sm text-[#E60012] transition group-hover:translate-x-1 group-hover:text-[#B8000E]">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GroupInfoPage() {
  return <GroupInfoContent />;
}
