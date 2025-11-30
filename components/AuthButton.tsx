"use client";

import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";

type Props = {
  onSignIn: () => void;
  variant?: "primary" | "ghost";
};

export default function AuthButton({ onSignIn, variant = "ghost" }: Props) {
  const { user, signOutUser } = useAuth();
  const isLoggedIn = Boolean(user && !user.isAnonymous);
  const { t, lang } = useI18n();
  const signInLabel = t("headerSignIn");
  const signOutLabel = t("headerSignOut");
  const label = isLoggedIn ? (typeof signOutLabel === "string" ? signOutLabel : lang === "ro" ? "Deconectează-te" : "Sign out") : (typeof signInLabel === "string" ? signInLabel : lang === "ro" ? "Conectează-te" : "Sign in");

  const classes =
    variant === "primary"
      ? "rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-ink)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:opacity-80"
      : "rounded-full border border-[var(--omni-border-soft)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] hover:bg-[color-mix(in_oklab,var(--omni-energy)_15%,transparent)]";

  return (
    <button
      type="button"
      onClick={() => {
        if (isLoggedIn) {
          void signOutUser();
        } else {
          onSignIn();
        }
      }}
      className={classes}
    >
      {label}
    </button>
  );
}
