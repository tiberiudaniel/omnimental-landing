"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

const tools = [
  {
    title: "Login",
    description: "Accesează consola de autentificare pentru a testa experiența publică.",
    href: "/login",
    accent: "border-sky-200 bg-sky-50",
  },
  {
    title: "Flow Studio",
    description: "Editează și monitorizează traseele app-ului în timp real.",
    href: "/admin/flow-studio",
    accent: "border-emerald-200 bg-emerald-50",
  },
  {
    title: "V4 Debug",
    description: "Instrumente pentru evaluarea experimentelor din versiunea 4.",
    href: "/admin/v4-debug",
    accent: "border-amber-200 bg-amber-50",
  },
  {
    title: "Workflow Manager",
    description: "Coordonează task-urile și dependențele echipei dintr-un singur loc.",
    href: "/admin/workflow",
    accent: "border-indigo-200 bg-indigo-50",
    cardTestId: "admin-card-workflow",
    buttonTestId: "admin-open-workflow",
  },
];

export default function AdminLandingPage() {
  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 py-8 text-[var(--omni-ink)]">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight">Control Center</h1>
          <p className="text-sm text-[var(--omni-muted)]">Alege un instrument pentru a continua.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group"
              data-testid={tool.cardTestId}
            >
              <div
                className={`h-full rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${tool.accent}`}
              >
                <div className="flex h-full flex-col gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{tool.title}</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{tool.description}</p>
                  </div>
                  <OmniCtaButton
                    size="sm"
                    className="mt-auto w-fit"
                    data-testid={tool.buttonTestId}
                  >
                    Deschide
                  </OmniCtaButton>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
