"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OnboardingRedirect() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    let changed = false;
    if ((params.get("flow") || "").toLowerCase() !== "initiation") {
      params.set("flow", "initiation");
      changed = true;
    }
    if ((params.get("step") || "").toLowerCase() !== "welcome") {
      params.set("step", "welcome");
      changed = true;
    }
    if (!params.has("from")) {
      params.set("from", "legacy");
      changed = true;
    }
    if (!changed) return;
    router.replace(`/experience-onboarding?${params.toString()}`);
  }, [router, search]);

  return null;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingRedirect />
    </Suspense>
  );
}
