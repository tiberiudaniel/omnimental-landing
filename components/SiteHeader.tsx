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
  const signInLabelValue = t("headerSignIn");
  const signOutLabelValue = t("headerSignOut");
  const signInLabel =
    typeof signInLabelValue === "string" ? signInLabelValue : "Conectează-te";
  const signOutLabel =
    typeof signOutLabelValue === "string" ? signOutLabelValue : "Deconectează-te";

  return (
    <header className="flex items-center justify-between bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <Image src="/assets/logo.jpg" alt="OmniMental logo" width={80} height={32} priority />
        <span className="text-2xl font-semibold tracking-wide text-neutral-dark">OmniMental</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/progress"
          className="hidden rounded-full border border-[#2C2C2C] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white sm:inline-flex"
        >
          {progressLabel}
        </Link>
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
          className="rounded-full border border-[#2C2C2C] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white"
        >
          {user ? signOutLabel : signInLabel}
        </button>
        <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 p-1 text-xs font-semibold text-neutral-dark">
          {availableLocales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setLang(locale)}
              className={`rounded-full px-3 py-1.5 transition ${
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
