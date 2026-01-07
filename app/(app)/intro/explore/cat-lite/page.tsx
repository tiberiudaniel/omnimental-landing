"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ExploreCatLiteRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const preserveE2E = (searchParams?.get("e2e") ?? "").toLowerCase() === "1";
    const completionParams = new URLSearchParams({ source: "cat-lite" });
    if (preserveE2E) {
      completionParams.set("e2e", "1");
    }
    const completionTarget = `/intro/explore/complete?${completionParams.toString()}`;
    const params = new URLSearchParams({ source: "explore", returnTo: completionTarget });
    if (preserveE2E) {
      params.set("e2e", "1");
    }
    router.replace(`/onboarding/cat-lite-2?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-sm text-[var(--omni-muted)]">
      Pornim evaluarea…
    </main>
  );
}

export default function ExploreCatLiteRedirectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <ExploreCatLiteRedirectInner />
    </Suspense>
  );
}
