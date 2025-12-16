"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { hasFoundationCycleCompleted } from "@/lib/dailyCompletion";

export default function ArenasLayout({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAllowed(hasFoundationCycleCompleted());
      setChecked(true);
    };
    sync();
    const handle = window.setTimeout(sync, 0);
    return () => window.clearTimeout(handle);
  }, []);

  if (!checked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-6 py-12 text-[var(--omni-ink)]">
        <div className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Checking access…</p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-6 py-12 text-[var(--omni-ink)]">
        <div className="max-w-md space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Locked</p>
          <h1 className="text-2xl font-semibold">Finalizează Foundation Cycle</h1>
          <p className="text-sm text-[var(--omni-ink)]/80">
            Arene devin disponibile după ce termini toate cele 15 zile din Foundation Cycle. Revino în Daily Path pentru a continua.
          </p>
          <p className="text-xs text-[var(--omni-muted)]">
            *Accesul este salvat local pe acest dispozitiv. Dacă ai finalizat Foundation Cycle și încă vezi acest mesaj, te rugăm să revii de pe dispozitivul pe care ai terminat antrenamentul sau să contactezi suportul.*
          </p>
          <Link
            href="/today"
            className="inline-flex w-full items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-5 py-3 text-sm font-semibold text-[var(--omni-ink)] hover:bg-[var(--omni-ink)]/5"
          >
            Înapoi la Daily Path
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
