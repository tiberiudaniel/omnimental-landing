"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { useProfile } from "./ProfileProvider";
import Toast from "./Toast";
import { JournalTrigger } from "./journal/JournalTrigger";

const INIT_VISIT_KEY = "omnimental_init_visits";
const INIT_TIME_KEY = "omnimental_init_time_ms";
const INIT_SESSION_KEY = "omnimental_init_session";

type InitiationEngagement = { visits: number; timeMs: number };

interface SiteHeaderProps {
  showMenu?: boolean;
  onMenuToggle?: () => void;
  onAuthRequest?: () => void;
  wizardMode?: boolean; // hide nav and journal, keep only logo + lang
  onWizardExit?: () => void;
  onWizardReset?: () => void;
  canWizardReset?: boolean;
}

export default function SiteHeader({
  showMenu = true,
  onMenuToggle,
  onAuthRequest,
  wizardMode = false,
  onWizardExit,
  onWizardReset,
  canWizardReset = false,
}: SiteHeaderProps) {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
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
  const navButtonBaseClasses =
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition";
  const navButtonInactiveClasses =
    "border border-transparent text-[color-mix(in_srgb,var(--omni-ink-soft)_82%,var(--omni-ink)_18%)] hover:text-[var(--omni-energy)] hover:border-[color-mix(in_srgb,var(--omni-energy)_55%,var(--omni-border-soft)_45%)] hover:bg-[color-mix(in_srgb,var(--omni-energy)_8%,transparent)]";

  const headerPad = "px-3 py-2";
  const bottomMarginTop = "mt-1";
  const titleSize = "text-lg";
  const headerButtonBase =
    "rounded-full px-2 py-1 text-[var(--omni-ink-soft)] transition-colors border border-transparent hover:bg-[color-mix(in_srgb,var(--omni-energy-tint)_70%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-energy-tint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--omni-header-bg)]";
  const [actionsOpen, setActionsOpen] = useState(false);
  const [initiationEngagement, setInitiationEngagement] = useState<InitiationEngagement>({
    visits: 0,
    timeMs: 0,
  });
  const actionsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!actionsOpen) return;
      const node = actionsRef.current;
      if (node && !node.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [actionsOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let visits = Number(window.localStorage.getItem(INIT_VISIT_KEY) ?? "0");
    if (!Number.isFinite(visits) || visits < 0) visits = 0;
    if (!window.sessionStorage.getItem(INIT_SESSION_KEY)) {
      visits += 1;
      window.localStorage.setItem(INIT_VISIT_KEY, String(visits));
      window.sessionStorage.setItem(INIT_SESSION_KEY, "1");
    }

    let timeMs = Number(window.localStorage.getItem(INIT_TIME_KEY) ?? "0");
    if (!Number.isFinite(timeMs) || timeMs < 0) timeMs = 0;
    setInitiationEngagement({ visits, timeMs });

    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      timeMs += delta;
      window.localStorage.setItem(INIT_TIME_KEY, String(timeMs));
      setInitiationEngagement({ visits, timeMs });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const shouldDimInitiere = initiationEngagement.visits >= 5 || initiationEngagement.timeMs >= 60 * 60 * 1000;

  return (
    <header
      className={clsx("sticky top-0 z-40 border-b", headerPad)}
      style={{
        backgroundColor: "var(--omni-header-bg)",
        borderColor: "var(--omni-border-soft)",
        boxShadow: "0 8px 22px rgba(60, 40, 20, 0.06)",
      }}
    >
      <div className="relative z-10">
      {/* Top row: Auth | Guest | RO EN (slightly shifted left, tighter) */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--omni-ink-soft)]">
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
                  router.push('/progress');
                }
          }
          className={clsx(headerButtonBase, "text-[10px]")}
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
            className={clsx(
              headerButtonBase,
              "text-[10px]",
              lang === "ro" ? "font-semibold text-[var(--omni-ink)]" : "opacity-70",
            )}
            aria-pressed={lang === "ro"}
          >
            RO
          </button>
          <span className="px-0 text-[var(--omni-ink-soft)]/80">-</span>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={clsx(
              headerButtonBase,
              "text-[10px]",
              lang === "en" ? "font-semibold text-[var(--omni-ink)]" : "opacity-70",
            )}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          {wizardMode ? (
            <span className="ml-2 hidden text-[10px] text-[var(--omni-muted)] sm:inline" title={lang === "ro" ? "Salvare automată" : "Auto‑save"}>
              {lang === "ro" ? "Salvare automată" : "Auto‑save"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom row layout: logo | centered nav | journal + menu on right */}
      <div className={`${bottomMarginTop} grid grid-cols-[auto_1fr_auto] items-center gap-3`}>
        {wizardMode ? (
          <Link href="/intro" className="flex items-center gap-3 shrink-0" aria-label="OmniMental">
            <Image src="/assets/logo.jpg" alt="OmniMental logo" width={60} height={28} priority style={{ height: "auto", width: "auto" }} />
            <span className="flex flex-col leading-tight text-neutral-dark">
              <span className={`${titleSize} font-semibold tracking-wide`}>OmniMental</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Dezvoltă-ți inteligența adaptativă" : "Develop your adaptive intelligence"}
              </span>
            </span>
          </Link>
        ) : (
          <Link href="/intro" className="flex items-center gap-3 shrink-0">
            <Image src="/assets/logo.jpg" alt="OmniMental logo" width={60} height={28} priority style={{ height: "auto", width: "auto" }} />
            <span className="flex flex-col leading-tight text-neutral-dark">
              <span className={`${titleSize} font-semibold tracking-wide`}>OmniMental</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Dezvoltă-ți inteligența adaptativă" : "Develop your adaptive intelligence"}
              </span>
            </span>
          </Link>
        )}
        {!wizardMode && (
          <nav className="flex items-center gap-x-4 md:gap-x-6 mt-0 md:mt-[2px] justify-center">
          <Link
            href="/recommendation"
            className={clsx(
              navButtonBaseClasses,
              isActive("/recommendation") ? "omni-tab-active" : navButtonInactiveClasses,
            )}
            aria-current={isActive("/recommendation") ? "page" : undefined}
          >
            {lang === "ro" ? "Astăzi" : "Today"}
          </Link>
          <Link
            href="/antrenament"
            className={clsx(
              navButtonBaseClasses,
              isActive("/antrenament") ? "omni-tab-active" : navButtonInactiveClasses,
            )}
            aria-current={isActive("/antrenament") ? "page" : undefined}
          >
            {evaluationLabel}
          </Link>
          <Link
            href="/progress"
            className={clsx(
              navButtonBaseClasses,
              isActive("/progress") ? "omni-tab-active" : navButtonInactiveClasses,
            )}
            aria-current={isActive("/progress") ? "page" : undefined}
          >
            {typeof t("navProgres") === "string" ? (t("navProgres") as string) : progressLabel}
          </Link>
          {/* Sensei tab removed */}
          {showOnboardingNav ? (
            <Link
              href={{ pathname: "/experience-onboarding", query: { flow: "initiation", step: "welcome" } }}
              className={clsx(
                navButtonBaseClasses,
                shouldDimInitiere ? "opacity-5 hover:opacity-15" : null,
                isActive("/experience-onboarding") ? "omni-tab-active" : navButtonInactiveClasses,
              )}
              aria-current={isActive("/experience-onboarding") ? "page" : undefined}
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
                else router.push('/progress');
              }}
            />
          )}
          {showMenu && !wizardMode && (
            <button
              onClick={onMenuToggle}
              aria-label={lang === "ro" ? "Deschide meniul" : "Open menu"}
              className="mt-[-2px] flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-[color-mix(in_oklab,var(--omni-ink)_10%,transparent)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-border-soft)]"
              style={{ borderColor: "var(--omni-ink)", color: "var(--omni-ink)" }}
            >
              <span className="space-y-1">
                <span className="block h-[2px] w-5 bg-current"></span>
                <span className="block h-[2px] w-5 bg-current"></span>
                <span className="block h-[2px] w-5 bg-current"></span>
              </span>
            </button>
          )}
          {wizardMode && (
            <div className="flex items-center gap-1" ref={actionsRef}>
              {/* Desktop: Exit visible, Reset in menu */}
              {/* Exit hidden on desktop too; available in menu */}
              <button type="button" className="hidden" aria-hidden>
                {lang === 'ro' ? 'Ieși' : 'Exit'}
              </button>
              <button
                type="button"
                aria-label={lang === 'ro' ? 'Opțiuni wizard' : 'Wizard options'}
                onClick={() => setActionsOpen((v) => !v)}
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border md:h-9 md:w-9"
                style={{ borderColor: "var(--omni-border-soft)", color: "var(--omni-ink)", backgroundColor: "var(--omni-surface-card)" }}
              >
                ⋯
              </button>
              {actionsOpen ? (
                <div className="absolute right-2 top-full z-50 mt-2 min-w-[180px] rounded-[10px] border p-2 text-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                  style={{ borderColor: "var(--omni-border-soft)", backgroundColor: "var(--omni-surface-card)", color: "var(--omni-ink)" }}>
                  <button
                    type="button"
                    onClick={() => { setActionsOpen(false); if (onWizardExit) onWizardExit(); }}
                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-left"
                    style={{ backgroundColor: "var(--omni-bg-paper)" }}
                  >
                    {lang === 'ro' ? 'Ieși' : 'Exit'}
                    <span className="opacity-60">⌘E</span>
                  </button>
                  {canWizardReset ? (
                    <button
                      type="button"
                      onClick={() => { setActionsOpen(false); if (onWizardReset) onWizardReset(); }}
                    className="mt-1 flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-left"
                    style={{ backgroundColor: "var(--omni-bg-paper)" }}
                  >
                      {lang === 'ro' ? 'Ia de la capăt' : 'Start over'}
                      <span className="opacity-60">⌘R</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {authNotice ? (
        <div className="pointer-events-none absolute right-3 top-3 z-50 max-w-sm">
          <Toast message={authNotice.message} okLabel="OK" onClose={clearAuthNotice} />
        </div>
      ) : null}
      </div>
    </header>
  );
}
