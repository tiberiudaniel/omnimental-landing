"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ARENA_TASKS } from "@/config/arenas";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { getUserProfileSnapshot, type UserSubscription } from "@/lib/profileEngine";
import { FREE_LIMITS } from "@/lib/gatingRules";
import { getArenaRunsById } from "@/lib/usageStats";

export default function ArenasPage() {
  const { user } = useAuth();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const arenas = useMemo(() => Object.values(ARENA_TASKS), []);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [runCounts, setRunCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserProfileSnapshot(user.uid)
      .then((snapshot) => {
        if (!cancelled) {
          setSubscription(snapshot?.subscription ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setSubscription(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getArenaRunsById(user.uid)
      .then((counts) => {
        if (!cancelled) setRunCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setRunCounts({});
      });
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
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Arene</p>
            <h1 className="text-3xl font-semibold">Teste rapide sub presiune</h1>
            <p className="text-sm text-[var(--omni-ink)]/80">
              Fiecare arenă măsoară un indicator din Canon. Începem cu micro-Stroop pentru control executiv.
            </p>
          </header>
          <ul className="space-y-4">
            {arenas.map((arena) => {
              const count = runCounts[arena.id] ?? 0;
              const isPremium = subscription?.status === "premium";
              const limitReached = !isPremium && count >= FREE_LIMITS.arenaRunsPerArena;
              return (
                <li key={arena.id} className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">{arena.canonDomain}</p>
                      <h2 className="text-lg font-semibold">{arena.name}</h2>
                      <p className="text-sm text-[var(--omni-ink)]/75">Indicator: {arena.indicatorId}</p>
                      {!isPremium && limitReached ? (
                        <p className="text-xs text-[var(--omni-ink-soft)]">
                          Ai folosit runda gratuită pentru această Arenă. Rulările nelimitate sunt incluse în OmniMental Premium.
                        </p>
                      ) : null}
                    </div>
                    {limitReached ? (
                      <Link
                        href="/upgrade"
                        className="rounded-[10px] border border-[var(--omni-energy)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]"
                      >
                        Upgrade
                      </Link>
                    ) : (
                      <Link
                        href={`/arenas/${arena.id}/run`}
                        className="rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                      >
                        Începe
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
