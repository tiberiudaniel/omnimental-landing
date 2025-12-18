"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getUserProfileSnapshot, type UserProfileSnapshot } from "@/lib/profileEngine";
import { TEMPLES } from "@/config/temples";
import { getTempleProgress } from "@/lib/templeEngine";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";

export default function TempleOverviewPage() {
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [snapshot, setSnapshot] = useState<UserProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const loadSnapshot = async () => {
      if (!cancelled) setLoading(true);
      try {
        const data = await getUserProfileSnapshot(user.uid);
        if (!cancelled) setSnapshot(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const header = (
    <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => {}} />
  );

  return (
    <>
      <AppShell header={header}>
        <div className="mx-auto max-w-4xl px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <header className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Harta mentală</p>
            <h1 className="text-3xl font-semibold">Temple & Arcuri</h1>
            <p className="text-sm text-[var(--omni-ink)]/80">
              Aici vezi în ce Templu lucrezi acum și câte arcuri are fiecare domeniu.
            </p>
          </header>
          {loading ? (
            <p className="text-sm text-[var(--omni-ink-soft)]">Se încarcă progresul…</p>
          ) : (
            <ul className="space-y-4">
              {TEMPLES.map((temple) => {
                const progress = getTempleProgress(snapshot, temple);
                const hasActive = Boolean(progress.activeArcId);
                return (
                  <li key={temple.canonDomain} className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">{temple.canonDomain}</p>
                    <h2 className="text-lg font-semibold">{temple.label}</h2>
                    <p className="text-sm text-[var(--omni-ink)]/75">Arcuri disponibile: {progress.arcsTotal}</p>
                    {hasActive ? (
                      <p className="text-sm text-[var(--omni-ink)]/90">
                        Arc curent: {progress.activeArcLabel ?? progress.activeArcId} — Ziua {Math.min(
                          (progress.activeArcDayIndex ?? 0) + 1,
                          progress.arcLengthDays ?? Number.POSITIVE_INFINITY,
                        )}
                        {progress.arcLengthDays ? ` din ${progress.arcLengthDays}` : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--omni-ink-soft)]">Nu ai un arc activ în acest templu.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
