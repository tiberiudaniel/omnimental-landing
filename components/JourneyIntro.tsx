"use client";

import MultiTypewriter from "./MultiTypewriter";
import { useTStrings } from "./useTStrings";
import { useI18n } from "./I18nProvider";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

interface JourneyIntroProps {
  onStart: () => void;
}

export default function JourneyIntro({ onStart }: JourneyIntroProps) {
  const { s } = useTStrings();
  const { lang } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  // New narrative intro (typewriter): 2–3 scurte fraze
  const introLines = (() => {
    const v = s('wizard.intro');
    if (Array.isArray(v)) return v as string[];
    return (lang === 'ro'
      ? [
          'Trăim într-o perioadă în care mintea e bombardată non-stop de știri, notificări și presiune.',
          'Ajungi să iei decizii pe fugă, cu un creier obosit și un corp care cere pauză.',
          'OmniMental este gândit ca un spațiu în care îți antrenezi mintea, nu doar o repari după ce cedează.',
        ]
      : [
          'We live in a time where the mind is bombarded non-stop by news, notifications and pressure.',
          'You end up deciding in a rush, with a tired brain and a body asking for a break.',
          'OmniMental is built as a space where you train your mind — not just fix it after it breaks. >>',
        ]);
  })();
  // optional title reserved for future use (removed to keep lint clean)
  const buttonLabel = s("journeyIntroButton", lang === 'ro' ? "Începe mini‑evaluarea" : "Start the mini‑assessment");
  // Single, succinct duration mention
  const microcopy = s("journeyIntroMicrocopy", lang === 'ro' ? "3–4 pași · ~2 minute" : "3–4 steps · ~2 minutes");

  return (
    <section id="intro" className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <MultiTypewriter
          key={introLines.join("|")}
          lines={introLines}
          speed={60}
          gapMs={500}
          wrapperClassName="typewriter-display mb-6 w-full max-w-[62ch] mx-auto bg-[#F6F2EE] px-6 py-5"
          headingClassName="text-base md:text-lg"
        />

        {/* Ce urmează */}
        <div className="mx-auto mt-2 max-w-xl text-left">
          <h2 className="mb-2 text-base font-semibold text-[#1F1F1F]">{s("journeyWhatsNext", lang === 'ro' ? "Ce urmează" : "What’s next") as string}</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-[#2C2C2C]">
            <li>{lang === 'ro' ? '• Alegi 5–7 expresii care te reprezintă acum.' : '• Pick 5–7 intents that fit you right now.'}</li>
            <li>{lang === 'ro' ? '• Răspunzi la câteva întrebări scurte despre ritm, resurse și obiective.' : '• Answer a few short questions about pace, resources, and goals.'}</li>
            <li>{lang === 'ro' ? '• Primești o recomandare clară cu pașii potriviti tie.' : '• Get a clear recommendation plus next 24h steps.'}</li>
            <li>{lang === 'ro' ? '• Faci primul pas într-un nou teritoriu: propriul tău Mental Performance Training System.' : '• Get a clear recommendation plus next 24h steps.'}</li>
          </ul>
        </div>

        {/* Garanții / Ce NU este */}
        <div className="mx-auto mt-3 max-w-xl text-left">
          <h3 className="mb-1 text-sm font-semibold text-[#1F1F1F]">{s("journeyWhatNot", lang === 'ro' ? "Ce NU este / Garanții" : "What it isn’t / Guarantees") as string}</h3>
          <p className="text-sm leading-relaxed text-[#2C2C2C]/80">
            {lang === 'ro'
              ? 'Nu e diagnostic medical și nu promite rezultate peste noapte. E o orientare practică, bazată pe stiinta, ca să începi cu claritate.'
              : 'It’s not a medical diagnosis, and it doesn’t promise overnight results. It’s a practical orientation, based on science, to start with clarity.'}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
            {microcopy}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#2C2C2C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto"
              style={{ background: "linear-gradient(135deg,#2C2C2C,#C24B17)" }}
            >
              {buttonLabel}
            </button>
            <button
              type="button"
              onClick={() => router.push(user && !user.isAnonymous ? "/progress" : "/auth")}
              className="inline-flex w-full items-center justify-center rounded-[12px] border border-[#2C2C2C] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto"
            >
              {lang === "ro" ? "Am cont" : "I have an account"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
