"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAxisLessonChoice, setExploreCompletion } from "@/lib/intro/exploreState";

function ExploreCompletionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get("source") ?? "unknown";
    const axis = searchParams.get("axis");
    setExploreCompletion(source);
    if (axis) {
      setAxisLessonChoice(axis);
    }
    const params = new URLSearchParams({ mode: "short", source: "explore" });
    if ((searchParams.get("e2e") ?? "").toLowerCase() === "1") {
      params.set("e2e", "1");
    }
    router.replace(`/today?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-center">
      <div className="max-w-md space-y-3 rounded-[24px] border border-[var(--omni-border-soft)] bg-white/80 px-6 py-6 text-[var(--omni-ink)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explore</p>
        <h1 className="text-2xl font-semibold">Închidem modul de explorare…</h1>
        <p className="text-sm text-[var(--omni-muted)]">Pregătim Today cu ce ai explorat.</p>
      </div>
    </main>
  );
}

export default function ExploreCompletionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-center text-sm text-[var(--omni-muted)]">
          Închidem explorarea…
        </main>
      }
    >
      <ExploreCompletionInner />
    </Suspense>
  );
}
