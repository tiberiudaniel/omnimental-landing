"use client";

import type { ReactNode } from "react";
import { AccessGate } from "@/components/AccessGate";

export default function ArenasLayout({ children }: { children: ReactNode }) {
  return <AccessGate minTier={3} reason="arenas">{children}</AccessGate>;
}
