"use client";

import type { ReactNode } from "react";
import { AccessGate } from "@/components/AccessGate";

export default function WizardLayout({ children }: { children: ReactNode }) {
  return <AccessGate minTier={5} reason="wizard">{children}</AccessGate>;
}
