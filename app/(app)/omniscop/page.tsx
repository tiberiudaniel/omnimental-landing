"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

export default function OmniScopAliasPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { data: progress } = useProgressFacts(profile?.id);

  useEffect(() => {
    // If we don't have a completed evaluation yet, send to wizard resume
    if (!progress || !progress.intent || !progress.evaluation) {
      const url = new URL(window.location.origin + "/");
      url.searchParams.set("resume", "1");
      url.searchParams.set("step", "firstInput");
      router.replace(url.pathname + url.search);
      return;
    }
    // Otherwise alias to the existing Recommendation page
    router.replace("/recommendation");
  }, [progress, router]);

  return null;
}

