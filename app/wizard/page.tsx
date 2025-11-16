"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

function computeResumeStep(progress: ReturnType<typeof useProgressFacts>["data"] | null) {
  // Defaults to the very start
  if (!progress) return "firstInput" as const;
  const hasIntent = Boolean(progress.intent && progress.intent.firstExpression);
  const hasCloud = Boolean(progress.intent && Array.isArray(progress.intent.categories) && progress.intent.categories.length > 0);
  const hasMotivation = Boolean(progress.motivation);
  const hasChoice = Boolean(progress.recommendation && (progress.recommendation.selectedPath || progress.recommendation.suggestedPath));

  if (!hasIntent) return "firstInput" as const;
  if (!hasCloud) return "intent" as const;
  if (!hasMotivation) return "intentSummary" as const;
  if (!hasChoice) return "cards" as const;
  return "details" as const;
}

function WizardAliasInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useProfile();
  const { data: progress } = useProgressFacts(profile?.id);

  useEffect(() => {
    // If user has a completed evaluation + recommendation context, send to OmniScop
    const completed = Boolean(progress?.intent && progress?.evaluation && (progress?.recommendation?.selectedPath || progress?.recommendation?.suggestedPath));
    if (completed) {
      router.replace("/omniscop");
      return;
    }

    const target = new URL(window.location.origin + "/");
    const stepParam = params?.get("step");
    const resume = params?.get("resume");
    const lang = params?.get("lang");
    const open = params?.get("open");
    const e2e = params?.get("e2e");
    const demo = params?.get("demo");
    if (lang) target.searchParams.set("lang", lang);
    if (open) target.searchParams.set("open", open);
    if (e2e === "1") target.searchParams.set("e2e", "1");
    if (demo) target.searchParams.set("demo", demo);
    if (resume === "1") {
      const resumeStep = computeResumeStep(progress);
      target.searchParams.set("step", resumeStep);
    } else if (stepParam) {
      target.searchParams.set("step", stepParam);
    }
    router.replace(target.pathname + target.search);
  }, [params, progress, router]);

  return null;
}

export default function WizardAliasPage() {
  return (
    <Suspense fallback={null}>
      <WizardAliasInner />
    </Suspense>
  );
}
