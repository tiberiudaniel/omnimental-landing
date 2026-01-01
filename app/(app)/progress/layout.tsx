"use client";

import type { ReactNode } from "react";
import { AccessGate } from "@/components/AccessGate";

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return <AccessGate minTier={2} reason="progress">{children}</AccessGate>;
}
