"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";

interface SiteHeaderProps {
  showMenu?: boolean;
  onMenuToggle?: () => void;
  onAuthRequest?: () => void;
}

export default function SiteHeader({
  showMenu = true,
  onMenuToggle,
  onAuthRequest,
}: SiteHeaderProps) {
  const { lang, setLang, t } = useI18n();
  const { user, signOutUser } = useAuth();
  const availableLocales = ["ro", "en"] as const;
  const progressLabelValue = t("headerProgressCta");
  const progressLabel =
    typeof progressLabelValue === "string" ? progressLabelValue : "Progres";
  const evaluationLabelValue = t("headerEvaluationCta");
  const evaluationLabel =
    typeof evaluationLabelValue === "string" ? evaluationLabelValue : "Evaluare";
  const signInLabelValue = t("headerSignIn");
  const signOutLabelValue = t("headerSignOut");
  const signInLabel =
    typeof signInLabelValue === "string" ? signInLabelValue : "Conectează-te";
  const signOutLabel =
    typeof signOutLabelValue === "string" ? signOutLabelValue : "Deconectează-te";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 shadow">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/assets/logo.jpg"
          alt="OmniMental logo"
          width={70}
          height={28}
          priority
          style={{ height: "auto" }}
        />
        <span className="text-xl font-semibold tracking-wide text-neutral-dark">OmniMental</span>
      </Link>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Link
          href="/evaluation"
          className="rounded-full border border-transparent px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4A3A30] transition hover:text-[#E60012]"
        >
          {evaluationLabel}
        </Link>
        <Link
          href="/progress"
          className="hidden rounded-full border border-[#2C2C2C] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white sm:inline-flex"
        >
          {progressLabel}
        </Link>
        {/* Auth status pill (dev helper) */}
        <span
          title={user?.email ?? user?.uid ?? "guest"}
          className={`hidden items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.2em] sm:inline-flex ${
            user ? "border-emerald-600/40 text-emerald-700" : "border-amber-600/40 text-amber-700"
          }`}
        >
          {user ? (lang === "ro" ? "Autentificat" : "Signed in") : (lang === "ro" ? "Oaspete" : "Guest")}
        </span>

        <button
          type="button"
          onClick={
            user
              ? () => {
                  void signOutUser().catch((error) => {
                    console.error("sign-out failed", error);
                  });
                }
              : () => {
                  if (onAuthRequest) {
                    onAuthRequest();
                  } else if (typeof window !== "undefined") {
                    window.location.href = "/progress";
                  }
                }
          }
          className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
            user
              ? "border border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
              : "border border-transparent bg-[#2C2C2C] text-white hover:opacity-80"
          }`}
        >
          {user ? signOutLabel : signInLabel}
        </button>
        <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 p-1 text-[10px] font-semibold text-neutral-dark">
          {availableLocales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setLang(locale)}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === locale ? "bg-white text-primary shadow-sm" : "text-primary/70"
              }`}
              aria-pressed={lang === locale}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
        {showMenu && (
          <button
            onClick={onMenuToggle}
            aria-label="Deschide meniul"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2C2C2C] text-[#2C2C2C] transition hover:bg-[#2C2C2C]/10 focus:outline-none focus:ring-1 focus:ring-[#2C2C2C]"
          >
            <span className="space-y-1">
              <span className="block h-[2px] w-5 bg-current"></span>
              <span className="block h-[2px] w-5 bg-current"></span>
              <span className="block h-[2px] w-5 bg-current"></span>
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
