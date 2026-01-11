"use client";

import { Suspense } from "react";
import TodayOrchestrator from "@/components/today/TodayOrchestrator";

export default function TodayPage() {
  return (
    <div data-testid="today-root" data-page="today">
      <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
        <TodayOrchestrator />
      </Suspense>
    </div>
  );
}
