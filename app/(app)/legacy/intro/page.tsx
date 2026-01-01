"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import IntroAnimation from "@/components/IntroAnimation";

function IntroPageInner() {
  const router = useRouter();
  return (
    <>
      <IntroAnimation onComplete={() => router.push("/?step=intro")} />
      <style jsx global>{`
        .site-footer {
          display: none !important;
        }
      `}</style>
    </>
  );
}

export default function IntroPage() {
  return (
    <Suspense fallback={null}>
      <IntroPageInner />
    </Suspense>
  );
}

