"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import { designTokens, type ModuleTone } from "@/config/designTokens";
import { adjustLightness, withAlpha } from "@/lib/colorUtils";

const buildModuleGradient = (base: string) => {
  const top = adjustLightness(base, 20);
  return `linear-gradient(180deg, ${top} 0%, ${base} 100%)`;
};

const TAB_ITEMS = [
  { key: "os", label: "Omni-Scop", description: "Scop & intenție", href: "/omni-scope" },
  { key: "oc", label: "Omni-Kuno", description: "Cunoaștere & concepte", href: "/omni-kuno" },
  { key: "oa", label: "Omni-Abil", description: "Abilități practice", href: "/omni-abil" },
  { key: "ose", label: "Omni-Flex", description: "Flexibilitate psihologică", href: "/omniflex" },
  { key: "oi", label: "Omni-Intel", description: "Stare integrativă", href: "/omniintel" },
] as const;

const MODULE_TONES: Record<(typeof TAB_ITEMS)[number]["key"], ModuleTone> = {
  os: designTokens.module.scop,
  oc: designTokens.module.kuno,
  oa: designTokens.module.abil,
  ose: designTokens.module.flex,
  oi: designTokens.module.intel,
};

function AntrenamentPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);

  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const activeKey = (() => {
    const raw = search?.get("tab");
    if (!raw) return null;
    return TAB_ITEMS.some((item) => item.key === raw) ? raw : null;
  })();

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
            className="mt-4 rounded-[28px] border px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8"
            style={{
              backgroundColor: "color-mix(in srgb, var(--omni-bg-paper) 94%, transparent)",
              borderColor: designTokens.ui.borderStrong,
            }}
            role="tablist"
            aria-label={normalizedLang === "ro" ? "Module antrenament" : "Training modules"}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
              {TAB_ITEMS.map((tab) => {
                const tone = MODULE_TONES[tab.key] ?? MODULE_TONES.oc;
                const isActive = activeKey === tab.key;
                const accentColor = tone.accent ?? designTokens.ui.text.primary;
                const baseColor = isActive ? tone.bgSoft : adjustLightness(tone.bg, -10);
                const cardGradient = buildModuleGradient(baseColor);
                const cardShadow = isActive ? "0 8px 22px rgba(0, 0, 0, 0.14)" : "0 6px 18px rgba(0, 0, 0, 0.08)";
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className="flex min-w-[180px] flex-col rounded-card border px-5 py-5 text-left shadow-card transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface hover:-translate-y-[2px] hover:brightness-[1.03] hover:shadow-ctaHover"
                    style={{
                      backgroundImage: cardGradient,
                      color: tone.textMain,
                      boxShadow: cardShadow,
                      borderColor: withAlpha(designTokens.ui.text.primary, 0.2),
                    }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.32em] whitespace-nowrap" style={{ color: accentColor }}>
                      {tab.label}
                    </span>
                    <span className="mt-1 text-sm leading-[1.35] text-textMain">{tab.description}</span>
                    {isActive ? (
                      <div
                        className="mt-4 h-0.5 w-full rounded-full"
                        style={{ backgroundColor: withAlpha(accentColor, 0.4) }}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

export default function AntrenamentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[360px] items-center justify-center text-sm text-textSecondary">
          Se încarcă pagina de antrenament…
        </div>
      }
    >
      <AntrenamentPageInner />
    </Suspense>
  );
}
