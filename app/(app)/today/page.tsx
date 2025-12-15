"use client";

import { Suspense } from "react";
import TodayOrchestrator from "@/components/today/TodayOrchestrator";

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <TodayOrchestrator />
    </Suspense>
  );
}
