"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntroVocabExperience, type IntroVocabContinuePayload } from "@/components/intro/steps/IntroVocabStep";
import type { CatVocabTag } from "@/config/catVocabulary";
import type { CatAxisId } from "@/lib/profileEngine";
import { isMindPacingSignalTag } from "@/lib/mindPacingSignals";

function appendQueryParam(url: string, key: string, value: string | null): string {
  if (!value) return url;
  try {
    const [path, rawQuery] = url.split("?");
    const params = new URLSearchParams(rawQuery ?? "");
    params.set(key, value);
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  } catch {
    return url;
  }
}

function IntroVocabPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/intro/guided";
  const forcedTag = (searchParams.get("tag") as CatVocabTag | null) ?? null;
  const forcedAxis = (searchParams.get("axis") as CatAxisId | null) ?? null;
  const manualActiveSignal = (() => {
    const tag = searchParams.get("mindpacingTag");
    return isMindPacingSignalTag(tag) ? tag : null;
  })();
  const avoidDayKeys = searchParams.get("avoid")?.split(",").filter(Boolean) ?? undefined;
  const handleContinue = useCallback(
    ({ activeSignal }: IntroVocabContinuePayload) => {
      const target = appendQueryParam(returnTo, "mindpacingTag", activeSignal);
      router.replace(target);
    },
    [returnTo, router],
  );
  return (
    <IntroVocabExperience
      forcedTag={forcedTag}
      forcedAxis={forcedAxis}
      manualActiveSignal={manualActiveSignal}
      avoidDayKeys={avoidDayKeys}
      onContinue={handleContinue}
    />
  );
}

export default function IntroVocabPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-sm text-[var(--omni-muted)]">
          Pregătim vocab-ul…
        </main>
      }
    >
      <IntroVocabPageInner />
    </Suspense>
  );
}
