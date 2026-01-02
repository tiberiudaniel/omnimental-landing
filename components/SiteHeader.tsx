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
  const isAnonymousUser = Boolean(user && user.isAnonymous);
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
  const userStatusLabel = !user
    ? lang === "ro"
      ? "Neautentificat"
      : "Not signed in"
    : isAnonymousUser
      ? lang === "ro"
        ? "Sesiune guest"
        : "Guest session"
      : shortUser;
  // locales handled explicitly as RO-EN in the top row
  const progressLabelValue = t("headerProgressCta");
  const progressLabel =
    typeof progressLabelValue === "string" ? progressLabelValue : "Progres";
  const evalLabelValue = t("navAntrenament");
  const evaluationLabel = typeof evalLabelValue === "string" ? evalLabelValue : (lang === "ro" ? "Antrenament" : "Training");
  const signInLabelValue = t("headerSignIn");
  const signOutLabelValue = t("headerSignOut");
  const signOutLabel =
    typeof signOutLabelValue === "string" ? signOutLabelValue : "Deconectează-te";
  const guestCtaLabel = lang === "ro" ? "Upgrade / Autentificare" : "Upgrade / Sign in";
  const authButtonLabel = isLoggedIn
    ? signOutLabel
    : isAnonymousUser
      ? guestCtaLabel
      : typeof signInLabelValue === "string"
        ? (signInLabelValue as string)
        : "Conectează-te";
  // unsubscribe link moved to footer; remove unused label

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navButtonBaseClasses =
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition";
  const navButtonInactiveClasses =
    "border border-transparent text-[color-mix(in_srgb,var(--omni-ink-soft)_82%,var(--omni-ink)_18%)] hover:text-[var(--omni-energy)] hover:border-[color-mix(in_srgb,var(--omni-energy)_55%,var(--omni-border-soft)_45%)] hover:bg-[color-mix(in_srgb,var(--omni-energy)_8%,transparent)]";

const headerPad = "px-3 py-2 md:py-4";
  const bottomMarginTop = "mt-1";
  const titleSize = "text-lg";
  const headerButtonBase =
    "rounded-full px-2 py-1 text-[var(--omni-ink-soft)] transition-colors border border-transparent hover:bg-[color-mix(in_srgb,var(--omni-energy-tint)_70%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--omni-energy-tint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--omni-header-bg)]";
  const [actionsOpen, setActionsOpen] = useState(false);
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

  const handlePrimaryAuthAction = () => {
    if (isLoggedIn) {
      void signOutUser().catch((e) => console.error("sign-out failed", e));
      return;
    }
    if (onAuthRequest) {
      onAuthRequest();
    } else {
      router.push("/auth?returnTo=%2Frecommendation");
    }
  };

  const handleUserChipClick = () => {
    if (isLoggedIn) {
      router.push("/progress");
      return;
    }
    if (onAuthRequest) {
      onAuthRequest();
    } else {
      router.push("/auth?returnTo=%2Frecommendation");
    }
  };

  const MobileLangToggle = () => (
    <div className="flex items-center gap-1 text-[11px] text-[var(--omni-ink)]/90">
      <button
        type="button"
        onClick={() => setLang("ro")}
        className={clsx(
          "rounded-full border px-2 py-1 text-[10px] font-semibold transition",
          lang === "ro"
            ? "border-[var(--omni-ink)] text-[var(--omni-ink)] bg-[var(--omni-ink)]/10"
            : "border-[var(--omni-border-soft)] text-[var(--omni-ink-soft)]",
        )}
        aria-pressed={lang === "ro"}
      >
        RO
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={clsx(
          "rounded-full border px-2 py-1 text-[10px] font-semibold transition",
          lang === "en"
            ? "border-[var(--omni-ink)] text-[var(--omni-ink)] bg-[var(--omni-ink)]/10"
            : "border-[var(--omni-border-soft)] text-[var(--omni-ink-soft)]",
        )}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );

  const MobileUserChip = () => (
    <button
      type="button"
      onClick={handleUserChipClick}
      className="flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] bg-white px-3 py-1 text-xs font-semibold text-[var(--omni-ink)] transition hover:border-[var(--omni-ink)]"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--omni-ink)]/10 text-sm font-bold text-[var(--omni-ink)]">
        {(shortUser?.[0] ?? "G").toUpperCase()}
      </span>
      <span className="text-[11px] text-[var(--omni-ink)]">{userStatusLabel}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-[var(--omni-ink-soft)]">
        <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    </button>
  );

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
      <div className="flex items-center justify-between gap-3 pb-3 sm:hidden">
        <MobileLangToggle />
        <div className="flex items-center gap-2">
          <MobileUserChip />
          {showMenu && !wizardMode ? (
            <button
              onClick={onMenuToggle}
              aria-label={lang === "ro" ? "Deschide meniul" : "Open menu"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white"
            >
              <span className="space-y-1">
                <span className="block h-[2px] w-4 bg-current" />
                <span className="block h-[2px] w-4 bg-current" />
                <span className="block h-[2px] w-4 bg-current" />
              </span>
            </button>
          ) : null}
        </div>
      </div>
      {/* Top row: Auth | Guest | RO EN (desktop only) */}
      <div className="hidden items-center justify-end gap-1.5 text-[10px] text-[var(--omni-ink-soft)] md:flex">
        <button
          type="button"
          onClick={handlePrimaryAuthAction}
          className={clsx(headerButtonBase, "text-[10px]")}
          aria-pressed={isLoggedIn}
          title={authButtonLabel}
        >
          {authButtonLabel}
        </button>
        <span title={user?.email ?? user?.uid ?? "guest"} className="hidden md:inline opacity-70">
          {userStatusLabel}
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
      <div
        className={`${bottomMarginTop} grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,auto)_1fr_minmax(0,auto)] sm:items-center sm:gap-3`}
        style={{ columnGap: "0.6rem" }}
      >
        {wizardMode ? (
          <Link href="/intro" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="OmniMental">
            <Image
              src="/assets/logo.jpg"
              alt="OmniMental logo"
              width={60}
              height={28}
              priority
              className="h-8 w-auto md:h-10"
            />
            <span className="flex flex-col gap-[1px] leading-tight text-neutral-dark">
              <span className={`${titleSize} font-semibold tracking-wide whitespace-nowrap`}>OmniMental</span>
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--omni-muted)] leading-tight">
                {lang === "ro" ? "Dezvoltă-ți inteligența adaptativă" : "Develop your adaptive intelligence"}
              </span>
            </span>
          </Link>
        ) : (
          <Link href="/intro" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Image
              src="/assets/logo.jpg"
              alt="OmniMental logo"
              width={60}
              height={28}
              priority
              className="h-8 w-auto md:h-10"
            />
            <span className="flex flex-col gap-[1px] leading-tight text-neutral-dark">
              <span className={`${titleSize} font-semibold tracking-wide whitespace-nowrap`}>OmniMental</span>
              <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--omni-muted)] leading-tight">
                {lang === "ro" ? "Dezvoltă-ți inteligența adaptativă" : "Develop your adaptive intelligence"}
              </span>
            </span>
          </Link>
        )}
        {!wizardMode && (
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm md:gap-x-6 md:text-base">
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
          </nav>
        )}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
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
              className="mt-[-2px] hidden h-9 w-9 items-center justify-center rounded-full border transition hover:bg-[color-mix(in_oklab,var(--omni-ink)_10%,transparent)] focus:outline-none focus:ring-1 focus:ring-[var(--omni-border-soft)] sm:flex md:h-10 md:w-10"
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
