"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";
import Toast from "./Toast";
import { JournalTrigger } from "./journal/JournalTrigger";

interface SiteHeaderProps {
  showMenu?: boolean;
  onMenuToggle?: () => void;
  onAuthRequest?: () => void;
  compact?: boolean;
  wizardMode?: boolean; // hide nav and journal, keep only logo + lang
}

export default function SiteHeader({
  showMenu = true,
  onMenuToggle,
  onAuthRequest,
  compact = false,
  wizardMode = false,
}: SiteHeaderProps) {
  const { lang, setLang, t } = useI18n();
  const { user, signOutUser, linkSentTo, authNotice, clearAuthNotice } = useAuth();
  const { profile } = useProfile();
  const pathname = usePathname();
  const isLoggedIn = Boolean(user && !user.isAnonymous);
  const shortUser = (() => {
    let email = "";
    if (isLoggedIn) {
      // Prefer user.email, fall back to providerData email, then last sent link
      email = user?.email || "";
      if (!email && Array.isArray(user?.providerData)) {
        for (const p of user.providerData) {
          if (p?.email) {
            email = p.email;
            break;
          }
        }
      }
      if (!email && typeof linkSentTo === "string" && linkSentTo.length > 0) {
        email = linkSentTo;
      }
      if (!email && typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("omnimental_auth_email");
          if (raw) {
            const parsed = JSON.parse(raw) as { email?: string };
            if (parsed?.email) email = parsed.email;
          }
        } catch {}
      }
    }
    if (email) return email.slice(0, 5);
    return lang === "ro" ? "Oaspete" : "Guest";
  })();
  // locales handled explicitly as RO-EN in the top row
  const progressLabelValue = t("headerProgressCta");
  const progressLabel =
    typeof progressLabelValue === "string" ? progressLabelValue : "Progres";
  const evalLabelValue = t("navAntrenament");
  const evaluationLabel = typeof evalLabelValue === "string" ? evalLabelValue : (lang === "ro" ? "Antrenament" : "Training");
  const signInLabelValue = t("headerSignIn");
  const signOutLabelValue = t("headerSignOut");
  const signInLabel =
    typeof signInLabelValue === "string" ? signInLabelValue : "Conectează-te";
  const signOutLabel =
    typeof signOutLabelValue === "string" ? signOutLabelValue : "Deconectează-te";
  // unsubscribe link moved to footer; remove unused label

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // Decide if we should show the Onboarding entry in the header.
  // Rule of thumb: keep it visible for new/authenticated users and hide it after a generous grace window.
  const showOnboardingNav = (() => {
    // Always show for guests or in wizardMode (header has minimal chrome)
    if (!isLoggedIn || wizardMode) return true;
    // Allow forcing via query or localStorage when testing
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      if (search.includes('e2e=1') || search.includes('demo=1')) return true;
      const force = typeof window !== 'undefined' ? window.localStorage.getItem('omnimental_show_onboarding') : null;
      if (force === '1' || force === 'true') return true;
    } catch {}
    // Cycles rule: hide after N cycles (default 1). Use profile field or localStorage counter.
    let minCycles = 1;
    try {
      const envMin = Number(process.env.NEXT_PUBLIC_ONBOARDING_HIDE_MIN_CYCLES ?? '');
      if (Number.isFinite(envMin) && envMin > 0) minCycles = Math.floor(envMin);
      if (typeof window !== 'undefined') {
        const override = Number(window.localStorage.getItem('omnimental_onboarding_required_cycles') ?? '');
        if (Number.isFinite(override) && override > 0) minCycles = Math.floor(override);
      }
    } catch {}
    try {
      const cyclesProfile = (profile as { experienceOnboardingCycles?: number } | null)?.experienceOnboardingCycles ?? 0;
      const cyclesLocal = typeof window !== 'undefined' ? Number(window.localStorage.getItem('omnimental_exp_onb_cycles') ?? '0') : 0;
      const cycles = Number.isFinite(cyclesProfile) && cyclesProfile > 0 ? cyclesProfile : cyclesLocal;
      if (cycles >= minCycles) return false; // hide after reaching the threshold
    } catch {}
    // Compute account age (fallback to show if missing)
    const createdAt = (profile as { createdAt?: { toMillis?: () => number } } | null)?.createdAt;
    const createdMs = typeof createdAt?.toMillis === 'function' ? createdAt.toMillis() : null;
    if (!createdMs) return true;
    // Threshold (generous by default for current testing): env override (days or hours), else 30 days
    let thresholdMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    try {
      const daysEnv = Number(process.env.NEXT_PUBLIC_ONBOARDING_HIDE_DAYS ?? '');
      const hoursEnv = Number(process.env.NEXT_PUBLIC_ONBOARDING_HIDE_HOURS ?? '');
      if (Number.isFinite(daysEnv) && daysEnv > 0) {
        thresholdMs = daysEnv * 24 * 60 * 60 * 1000;
      } else if (Number.isFinite(hoursEnv) && hoursEnv > 0) {
        thresholdMs = hoursEnv * 60 * 60 * 1000;
      }
    } catch {}
    const age = Date.now() - createdMs;
    return age < thresholdMs;
  })();

  const headerPad = compact ? "p-1.5" : "p-2.5";
  const bottomMarginTop = compact ? "mt-1" : "mt-2";
  const titleSize = compact ? "text-lg" : "text-xl";

  return (
    <header className={`relative bg-white ${headerPad} shadow`}>
      {/* Top row: Auth | Guest | RO EN (slightly shifted left, tighter) */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#4A3A30]">
        <button
          type="button"
          onClick={
            isLoggedIn
              ? () => {
                  void signOutUser().catch((e) => console.error("sign-out failed", e));
                }
              : () => {
                  if (onAuthRequest) {
                    onAuthRequest();
                    return;
                  }
                  if (typeof window !== "undefined") {
                    window.location.href = "/progress";
                  }
                }
          }
          className="hover:text-[#E60012]"
          aria-pressed={isLoggedIn}
          title={isLoggedIn ? (typeof signOutLabel === "string" ? (signOutLabel as string) : "Sign out") : (typeof signInLabel === "string" ? (signInLabel as string) : "Sign in")}
        >
          {isLoggedIn ? (typeof signOutLabel === "string" ? signOutLabel : "Deconectează-te") : (typeof signInLabel === "string" ? signInLabel : "Conectează-te")}
        </button>
        <span title={user?.email ?? user?.uid ?? "guest"} className="hidden md:inline opacity-70">
          {shortUser}
        </span>
        <div className="ml-0 flex items-center gap-0.5 text-[11px] shrink-0">
          <button
            type="button"
            onClick={() => setLang("ro")}
            className={`${lang === "ro" ? "font-bold text-[#2C2C2C]" : "opacity-70"} hover:text-[#E60012] hover:underline transition-colors`}
            aria-pressed={lang === "ro"}
          >
            RO
          </button>
          <span className="px-0 text-[#4A3A30]/80">-</span>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`${lang === "en" ? "font-bold text-[#2C2C2C]" : "opacity-70"} hover:text-[#E60012] hover:underline transition-colors`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          {wizardMode ? (
            <span className="ml-2 hidden text-[10px] text-[#7A6455] sm:inline" title={lang === "ro" ? "Salvare automată" : "Auto‑save"}>
              {lang === "ro" ? "Salvare automată" : "Auto‑save"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom row layout: logo | centered nav | journal + menu on right */}
      <div className={`${bottomMarginTop} grid grid-cols-[auto_1fr_auto] items-center gap-3`}>
        {wizardMode ? (
          <Link href="/intro" className="flex items-center gap-3 shrink-0" aria-label="OmniMental">
            <Image src="/assets/logo.jpg" alt="OmniMental logo" width={compact ? 60 : 70} height={28} priority style={{ height: "auto" }} />
            <span className={`${titleSize} font-semibold tracking-wide text-neutral-dark`}>OmniMental</span>
          </Link>
        ) : (
          <Link href="/intro" className="flex items-center gap-3 shrink-0">
            <Image src="/assets/logo.jpg" alt="OmniMental logo" width={compact ? 60 : 70} height={28} priority style={{ height: "auto" }} />
            <span className={`${titleSize} font-semibold tracking-wide text-neutral-dark`}>OmniMental</span>
          </Link>
        )}
        {!wizardMode && (
          <nav className="flex items-center gap-x-4 md:gap-x-6 mt-0 md:mt-[2px] justify-center">
          <Link
            href="/antrenament"
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition ${
              isActive("/antrenament") ? "border border-[#2C2C2C] text-[#2C2C2C]" : "border border-transparent text-[#4A3A30] hover:text-[#E60012]"
            }`}
            aria-current={isActive("/antrenament") ? "page" : undefined}
          >
            {evaluationLabel}
          </Link>
          <Link
            href="/progress"
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition ${
              isActive("/progress") ? "border border-[#2C2C2C] text-[#2C2C2C]" : "border border-transparent text-[#4A3A30] hover:text-[#E60012]"
            }`}
            aria-current={isActive("/progress") ? "page" : undefined}
          >
            {typeof t("navProgres") === "string" ? (t("navProgres") as string) : progressLabel}
          </Link>
          <Link
            href="/recommendation"
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition ${
              isActive("/recommendation") ? "border border-[#2C2C2C] text-[#2C2C2C]" : "border border-transparent text-[#4A3A30] hover:text-[#E60012]"
            }`}
            aria-current={isActive("/recommendation") ? "page" : undefined}
          >
            {typeof t("navRecommendation") === "string" ? (t("navRecommendation") as string) : (lang === "ro" ? "Recomandări" : "Recommendations")}
          </Link>
          {showOnboardingNav ? (
            <Link
              href="/onboarding"
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition ${
                isActive("/onboarding") ? "border border-[#2C2C2C] text-[#2C2C2C]" : "border border-transparent text-[#4A3A30] hover:text-[#E60012]"
              }`}
              aria-current={isActive("/onboarding") ? "page" : undefined}
            >
              {typeof t("navOnboarding") === "string" ? (t("navOnboarding") as string) : (lang === "ro" ? "Onboarding" : "Onboarding")}
            </Link>
          ) : null}
          </nav>
        )}
        <div className="flex items-center justify-end gap-2">
          {!wizardMode && profile?.id && (
            <JournalTrigger
              userId={profile.id}
              context={{ sourcePage: "header" }}
              label={lang === "ro" ? "Jurnal" : "Journal"}
              onRequireAuth={() => {
                if (onAuthRequest) onAuthRequest();
                else if (typeof window !== "undefined") window.location.href = "/progress";
              }}
            />
          )}
          {showMenu && !wizardMode && (
            <button
              onClick={onMenuToggle}
              aria-label={lang === "ro" ? "Deschide meniul" : "Open menu"}
              className="mt-[-2px] flex h-10 w-10 items-center justify-center rounded-full border border-[#2C2C2C] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
            >
              <span className="space-y-1">
                <span className="block h-[2px] w-5 bg-current"></span>
                <span className="block h-[2px] w-5 bg-current"></span>
                <span className="block h-[2px] w-5 bg-current"></span>
              </span>
            </button>
          )}
        </div>
      </div>

      {authNotice ? (
        <div className="pointer-events-none absolute right-3 top-3 z-50 max-w-sm">
          <Toast message={authNotice.message} okLabel="OK" onClose={clearAuthNotice} />
        </div>
      ) : null}
    </header>
  );
}
