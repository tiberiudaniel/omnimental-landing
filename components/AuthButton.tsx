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
      ? "rounded-full border border-[#2C2C2C] bg-[#2C2C2C] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:opacity-80"
      : "rounded-full border border-[#2C2C2C] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] hover:bg-[#2C2C2C]/10";

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
