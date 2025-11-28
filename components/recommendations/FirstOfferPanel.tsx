"use client";

import Link from "next/link";
import { recordCtaClicked } from "@/lib/progressFacts";

export default function FirstOfferPanel({ primaryProduct, lang }: { primaryProduct: "platform" | "group" | "individual"; lang: string }) {
  const isGroupPrimary = primaryProduct === "group";
  const isIndividualPrimary = primaryProduct === "individual";
  const isPlatformPrimary = primaryProduct === "platform";
  return (
    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
      {/* Pasul 1 – Platforma OmniMental */}
      <div className={`self-center flex flex-col justify-between rounded-[12px] border ${isPlatformPrimary ? 'border-[#C07963]' : 'border-[#E4D8CE]'} bg-white/95 px-5 py-5 transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_12px_34px_rgba(0,0,0,0.08)] hover:border-[#C07963]`}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#A08F82]">{lang === 'ro' ? 'Pasul 1 — Platforma OmniMental' : 'Step 1 — OmniMental Platform'}</p>
          <h3 className="mt-1 flex items-center justify-between gap-2 text-[18px] md:text-[20px] font-semibold text-[#2C2C2C]">
            {lang === 'ro' ? 'Începe antrenamentul în platformă' : 'Start training in the platform'}
            {isPlatformPrimary ? (
              <span className="rounded-full border border-[#E60012] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#E60012]">{lang === 'ro' ? 'Recomandat pentru tine' : 'Recommended for you'}</span>
            ) : null}
          </h3>
          <p className="mt-1 text-[14px] leading-[1.7] text-[#4A3A30]">
            {lang === 'ro'
              ? 'Primele 30 de zile la 1€, apoi 9€/lună. Acces la testări, recomandări personalizate și jurnal ghidat. Poți anula oricând.'
              : 'First 30 days for 1€, then 9€/month. Access to tests, personalized recommendations and guided journal. Cancel anytime.'}
          </p>
          <ul className="mt-2 space-y-1 text-[13px] text-[#7B6B60]">
            <li className="flex items-start gap-2"><span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#9A8578]" aria-hidden /><span>{lang === 'ro' ? 'onboarding ghidat pe temele tale' : 'guided onboarding on your themes'}</span></li>
            <li className="flex items-start gap-2"><span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#9A8578]" aria-hidden /><span>{lang === 'ro' ? 'mini‑sesiuni și recomandări zilnice' : 'mini‑sessions and daily recommendations'}</span></li>
            <li className="flex items-start gap-2"><span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#9A8578]" aria-hidden /><span>{lang === 'ro' ? 'istoric și progres centralizat' : 'centralized history and progress'}</span></li>
          </ul>
        </div>
        <div className="mt-3">
          <div className="flex justify-center">
            <Link
              href="/platform?plan=trial"
              onClick={() => { void recordCtaClicked('platform_trial'); }}
              className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto"
              data-testid="firstoffer-platform-trial-cta"
            >
              {lang === 'ro' ? 'Vreau să testez OmniMental (1€ prima lună)' : 'I want to try OmniMental (1€ first month)'}
            </Link>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#8C7C70]">{lang === 'ro' ? 'După perioada de test, abonamentul continuă la 9€/lună. Poți opri oricând.' : 'After the trial, it continues at 9€/month. Cancel anytime.'}</p>
        </div>
      </div>

      {/* Pasul 2 – Programe (Grup / Individual) */}
      <div className="space-y-5 md:space-y-6">
        {/* Grup */}
        <div className="flex min-h-[200px] flex-col justify-between rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-5 py-5 transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_12px_34px_rgba(0,0,0,0.08)] hover:border-[#C07963]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#A08F82]">{lang === 'ro' ? 'Pasul 2 — Grup OmniMental' : 'Step 2 — OmniMental Group'}</p>
            <h3 className="mt-1 flex items-center justify-between gap-2 text-[18px] md:text-[20px] font-semibold text-[#2C2C2C]">
              {lang === 'ro' ? 'Întâlniri de grup cu ritm clar și sprijin' : 'Group sessions with cadence and support'}
              {isGroupPrimary ? (
                <span className="rounded-full border border-[#E60012] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#E60012]">{lang === 'ro' ? 'Recomandat pentru tine' : 'Recommended for you'}</span>
              ) : null}
            </h3>
            <p className="mt-1 text-[14px] leading-[1.7] text-[#4A3A30]">{lang === 'ro' ? 'Întâlniri de grup structurate, cu ritm clar și sprijin. Ideal pentru accountability și dinamica unui trib.' : 'Structured group meetings with clear cadence and support. Ideal when you want accountability and group dynamics.'}</p>
          </div>
          <div className="mt-2 flex justify-center">
            <Link href="/group-info" onClick={() => { void recordCtaClicked('group_info'); }} className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto">{lang === 'ro' ? 'Vezi cum funcționează' : 'See how it works'}</Link>
          </div>
        </div>

        {/* Individual */}
        <div className="flex min-h-[200px] flex-col justify-between rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-5 py-5 transition-transform transition-shadow duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_12px_34px_rgba(0,0,0,0.08)] hover:border-[#C07963]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#A08F82]">{lang === 'ro' ? 'Pasul 2 — Sesiuni individuale' : 'Step 2 — Individual sessions'}</p>
            <h3 className="mt-1 flex items-center justify-between gap-2 text-[18px] md:text-[20px] font-semibold text-[#2C2C2C]">
              {lang === 'ro' ? 'Lucru 1‑la‑1, adaptat contextului tău' : '1‑on‑1 work, tailored to your context'}
              {isIndividualPrimary ? (
                <span className="rounded-full border border-[#E60012] px-2 py-[2px] text-[10px] uppercase tracking-[0.2em] text-[#E60012]">{lang === 'ro' ? 'Recomandat pentru tine' : 'Recommended for you'}</span>
              ) : null}
            </h3>
            <p className="mt-1 text-[14px] leading-[1.7] text-[#4A3A30]">{lang === 'ro' ? 'Lucru 1‑la‑1, adaptat la contextul tău, pentru intervenții precise.' : '1‑on‑1 work tailored to your context for precise interventions.'}</p>
          </div>
          <div className="mt-2 flex justify-center">
            <Link href="/individual" onClick={() => { void recordCtaClicked('contact_1to1'); }} className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] sm:w-auto">{lang === 'ro' ? 'Vezi opțiunile' : 'See options'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
