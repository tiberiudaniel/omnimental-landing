"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";

const TAB_ITEMS = [
  { key: "os", label: "Omni-Scop", description: "Scop & intenție", href: "/omni-scope" },
  { key: "oc", label: "Omni-Kuno", description: "Cunoaștere & concepte", href: "/omni-kuno" },
  { key: "oa", label: "Omni-Abil", description: "Abilități practice", href: "/omni-abil" },
  { key: "ose", label: "Omni-Flex", description: "Flexibilitate psihologică", href: "/omniflex" },
  { key: "oi", label: "Omni-Intel", description: "Stare integrativă", href: "/omniintel" },
] as const;

export default function AntrenamentPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);

  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";

  return (
    <>
      <AppShell
        header={
          <SiteHeader
            onMenuToggle={() => setMenuOpen(true)}
            onAuthRequest={!profile?.id ? () => router.push("/auth") : undefined}
          />
        }
      >
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div
            className="mt-2 flex flex-wrap gap-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/90 px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.05)]"
            role="tablist"
            aria-label={normalizedLang === "ro" ? "Module antrenament" : "Training modules"}
          >
            {TAB_ITEMS.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className="flex flex-col rounded-[10px] border px-4 py-3 text-left transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-energy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--omni-surface-card)]"
                style={{
                  borderColor: "var(--omni-border-soft)",
                  backgroundColor: "var(--omni-surface-card)",
                  color: "var(--omni-ink-soft)",
                }}
              >
                <span className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.27em] text-[var(--omni-ink)]">
                  {tab.label}
                </span>
                <span className="text-xs">{tab.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

