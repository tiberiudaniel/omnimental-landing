"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExploreCatLiteRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const target = `/onboarding/cat-lite-2?source=explore&returnTo=${encodeURIComponent("/intro/explore/complete?source=cat-lite")}`;
    router.replace(target);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-sm text-[var(--omni-muted)]">
      Pornim evaluarea…
    </main>
  );
}
