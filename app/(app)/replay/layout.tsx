"use client";

import type { ReactNode } from "react";
import { AccessGate } from "@/components/AccessGate";

export default function ReplayLayout({ children }: { children: ReactNode }) {
  return <AccessGate minTier={4} reason="library">{children}</AccessGate>;
}
