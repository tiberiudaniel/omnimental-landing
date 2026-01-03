"use client";

import { Suspense } from "react";
import ExploreHub from "@/components/intro/ExploreHub";

export default function IntroExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <ExploreHub />
    </Suspense>
  );
}
