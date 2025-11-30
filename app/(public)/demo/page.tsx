"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { AppShell } from "@/components/AppShell";

export default function DemoLanding() {
  const demosOn = process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1";
  return (
    <AppShell header={<SiteHeader />}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--omni-ink)]">Demo Links</h1>
        <p className="mb-6 text-sm text-[var(--omni-ink-soft)]">
          {demosOn
            ? "Demo switcher is enabled. Use the links below or the on-screen switcher."
            : "Demo switcher is currently off. You can still open demo routes below, but UI variants may be limited. To enable the switcher, set NEXT_PUBLIC_ENABLE_DEMOS=1."}
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link className="text-[var(--omni-ink)] underline" href="/progress?demo=1">
              /progress?demo=1
            </Link>
            <span className="ml-2 text-[var(--omni-muted)]">— Dashboard cu varianta demo1</span>
          </li>
          <li>
            <Link className="text-[var(--omni-ink)] underline" href="/recommendation?demo=1">
              /recommendation?demo=1
            </Link>
            <span className="ml-2 text-[var(--omni-muted)]">— Recomandare cu badge Demo</span>
          </li>
          <li>
            <Link className="text-[var(--omni-ink)] underline" href="/omniscop-lite">
              /omniscop-lite
            </Link>
            <span className="ml-2 text-[var(--omni-muted)]">— OmniScop Lite (preview public)</span>
          </li>
          <li>
            <Link className="text-[var(--omni-ink)] underline" href="/omnicuno/quick-start">
              /omnicuno/quick-start
            </Link>
            <span className="ml-2 text-[var(--omni-muted)]">— 2 micro‑teste OmniCuno</span>
          </li>
        </ul>
      </div>
    </AppShell>
  );
}

