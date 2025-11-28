"use client";

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function DemoLanding() {
  const demosOn = process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1";
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-[#1F1F1F]">Demo Links</h1>
        <p className="mb-6 text-sm text-[#4A3A30]">
          {demosOn
            ? "Demo switcher is enabled. Use the links below or the on-screen switcher."
            : "Demo switcher is currently off. You can still open demo routes below, but UI variants may be limited. To enable the switcher, set NEXT_PUBLIC_ENABLE_DEMOS=1."}
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link className="text-[#2C2C2C] underline" href="/progress?demo=1">
              /progress?demo=1
            </Link>
            <span className="ml-2 text-[#7A6455]">— Dashboard cu varianta demo1</span>
          </li>
          <li>
            <Link className="text-[#2C2C2C] underline" href="/recommendation?demo=1">
              /recommendation?demo=1
            </Link>
            <span className="ml-2 text-[#7A6455]">— Recomandare cu badge Demo</span>
          </li>
          <li>
            <Link className="text-[#2C2C2C] underline" href="/omniscop-lite">
              /omniscop-lite
            </Link>
            <span className="ml-2 text-[#7A6455]">— OmniScop Lite (preview public)</span>
          </li>
          <li>
            <Link className="text-[#2C2C2C] underline" href="/omnicuno/quick-start">
              /omnicuno/quick-start
            </Link>
            <span className="ml-2 text-[#7A6455]">— 2 micro‑teste OmniCuno</span>
          </li>
        </ul>
      </main>
    </div>
  );
}

