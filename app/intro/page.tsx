"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import IntroAnimation from "@/components/IntroAnimation";

function IntroPageInner() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact />
      <IntroAnimation onComplete={() => router.push('/?step=intro')} />
    </div>
  );
}

export default function IntroPage() {
  return (
    <Suspense fallback={null}>
      <IntroPageInner />
    </Suspense>
  );
}

