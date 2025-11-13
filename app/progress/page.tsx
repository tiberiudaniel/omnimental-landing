"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import { useI18n } from "../../components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "../../components/ProfileProvider";
import { useProgressFacts } from "../../components/useProgressFacts";
import NextBestStep from "../../components/NextBestStep";
import OmniPathInline from "../../components/OmniPathInline";
import ProgressDashboard from "../../components/dashboard/ProgressDashboard";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import DemoUserSwitcher from "../../components/DemoUserSwitcher";
import { getDemoProgressFacts } from "@/lib/demoData";

function ProgressContent() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const { data: progress } = useProgressFacts(profile?.id);
  const search = useSearchParams();
  const demoParam = search?.get("demo");
  const demoVariant = demoParam ? (Number(demoParam) === 2 ? 2 : Number(demoParam) === 3 ? 3 : 1) : null;
  const demoFacts = demoVariant ? getDemoProgressFacts(lang === "en" ? "en" : "ro", demoVariant as 1 | 2 | 3) : undefined;

  // Deep-link guard: journal opens only after selection
  useEffect(() => {
    if (!profile?.id) return;
    const open = search?.get("open");
    if (open === "journal") {
      const sel = profile.selection ?? "none";
      const allowed = sel === "individual" || sel === "group";
      if (!allowed) {
        const url = new URL(window.location.origin + "/choose");
        url.searchParams.set("from", "journal");
        window.location.replace(url.pathname + url.search);
      }
    }
  }, [profile?.id, profile?.selection, search]);

  if (!profile?.id) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <SiteHeader compact />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm text-[#4A3A30]">{getString(t, "progress.loginToView", lang === "ro" ? "Conectează-te pentru a vedea tabloul tău de bord." : "Sign in to view your dashboard.")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
      {demoParam ? (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="inline-flex items-center rounded-full bg-[#7A6455] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">{lang === "ro" ? "Demo" : "Demo"}</span>
            <span className="inline-flex items-center rounded-[8px] border border-[#E4D8CE] bg-[#FFF8F2] px-2.5 py-1 text-[#4A3A30]">
              {lang === "ro"
                ? "Mod demo: date sintetice — nu se salvează în cont."
                : "Demo mode: synthetic data — not saved to your account."}
            </span>
          </div>
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="mx-auto w-full">
          <NextBestStep
            progress={(demoFacts ?? progress) ?? undefined}
            lang={lang === "en" ? "en" : "ro"}
            className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.06)] md:py-4"
            onGoToKuno={() => {
              void recordEvaluationTabChange("oc");
              const qs = new URLSearchParams({ tab: "oc", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            onGoToSensei={() => {
              const qs = new URLSearchParams({ tab: "ose", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            onGoToAbil={() => {
              void recordEvaluationTabChange("oa");
              const qs = new URLSearchParams({ tab: "oa", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            onGoToIntel={() => {
              void recordEvaluationTabChange("oi");
              const qs = new URLSearchParams({ tab: "oi", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
          >
            <OmniPathInline lang={lang === "en" ? "en" : "ro"} progress={(demoFacts ?? progress) ?? undefined} />
          </NextBestStep>
        </section>
        <ProgressDashboard profileId={profile.id} demoFacts={demoFacts} />
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
