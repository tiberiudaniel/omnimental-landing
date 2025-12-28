"use client";

import type { ReactNode } from "react";
import { AccessGate } from "@/components/AccessGate";

export default function OmniAbilLayout({ children }: { children: ReactNode }) {
  return <AccessGate minTier={3} reason="modules">{children}</AccessGate>;
}
