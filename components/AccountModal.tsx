"use client";

import { useState } from "react";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";
import { recordRecommendationProgressFact } from "@/lib/progressFacts";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountModal({ open, onClose }: AccountModalProps) {
  const { t, lang } = useI18n();
  const { sendMagicLink, sendingLink, linkSentTo } = useAuth();
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  // Resolve i18n strings early to avoid TDZ issues in handlers
  const eyebrow = t("accountModalEyebrow");
  const heading = t("accountModalHeading");
  const description = t("accountModalDescription");
  const emailLabel = t("accountModalEmail");
  const skipLabel = t("accountModalSkip");
  const submitLabel = t("accountModalSubmit");
  const savingLabel = t("accountModalSaving");
  const placeholderEmail = t("accountModalEmailPlaceholder");
  const errorMessageFallback = t("accountModalError");
  const rememberLabel = t("accountModalRememberLabel");
  const successTitle = t("accountModalSuccessTitle");
  const successBody = t("accountModalSuccessBody");

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await sendMagicLink(email, rememberMe);
      // Log magic link sent (funnel)
      try { await recordRecommendationProgressFact({ badgeLabel: 'magic_sent' }); } catch {}
      setStatus("sent");
      setLastEmail(email);
      setEmail("");
      setRememberMe(true);
    } catch (err) {
      const fallback =
        typeof errorMessageFallback === "string"
          ? (errorMessageFallback as string)
          : "Nu am reușit să trimitem linkul de autentificare.";
      setError(err instanceof Error ? err.message : fallback);
    }
  };

  const isWizard = (() => {
    try { return typeof window !== 'undefined' && window.location.pathname.startsWith('/wizard'); } catch { return false; }
  })();
  const overlayClass = isWizard ? 'bg-[#FDFCF9]/90' : 'bg-black/40';
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayClass} px-4 py-8`}>
      <div className="w-full max-w-md rounded-2xl border border-[#E4D8CE] bg-white p-8 shadow-2xl">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {typeof eyebrow === "string" ? eyebrow : "Cont nou"}
          </p>
          <h2 className="text-2xl font-semibold text-[#1F1F1F]">
            {typeof heading === "string" ? heading : "Salvează-ți progresul"}
          </h2>
          <p className="text-sm text-[#2C2C2C]/80">
            {typeof description === "string"
              ? description
              : "Introdu numele și emailul pentru a accesa istoricul evaluărilor și recomandări personalizate."}
          </p>
        </div>
        {status === "sent" ? (
          <div className="space-y-4 text-center">
            <div>
              <p className="text-sm font-semibold text-[#1F1F1F]">
                {typeof successTitle === "string" ? successTitle : "Verifică emailul"}
              </p>
              <p className="mt-2 text-sm text-[#2C2C2C]/80">
                {typeof successBody === "string"
                  ? successBody
                  : "Ai primit un link securizat. Deschide emailul și finalizează autentificarea."}
              </p>
              {linkSentTo ? (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#A08F82]">
                  {linkSentTo}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={sendingLink || !lastEmail}
                onClick={async () => {
                  try {
                    if (lastEmail) {
                      await sendMagicLink(lastEmail, true);
                    }
                  } catch {}
                }}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
              >
                {lang === "ro" ? "Trimite din nou" : "Resend"}
              </button>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D8C6B6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#2C2C2C] hover:text-[#E60012]"
              >
                {lang === "ro" ? "Schimbă email" : "Change email"}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {typeof skipLabel === "string" ? skipLabel : "Închide"}
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
                {typeof emailLabel === "string" ? emailLabel : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-[10px] border border-[#D8C6B6] px-4 py-3 text-sm text-[#1F1F1F] focus:border-[#E60012] focus:outline-none"
                placeholder={
                  typeof placeholderEmail === "string" ? placeholderEmail : "tu@exemplu.com"
                }
                required
              />
            </div>
            <div className="flex items-center gap-2 text-left">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#D8C6B6] text-[#2C2C2C] focus:ring-[#E60012]"
              />
              <label htmlFor="remember-me" className="text-xs text-[#2C2C2C]/80">
                {typeof rememberLabel === "string"
                  ? rememberLabel
                  : "Ține-mă conectat 10 zile"}
              </label>
            </div>
            {error && <p className="text-sm text-[#E60012]">{error}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#D8C6B6] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#2C2C2C] hover:text-[#E60012]"
              >
                {typeof skipLabel === "string" ? skipLabel : "Mai târziu"}
              </button>
              <button
                type="submit"
                disabled={sendingLink}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] bg-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[#E60012] hover:bg-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012] disabled:opacity-60"
              >
                {sendingLink
                  ? typeof savingLabel === "string"
                    ? savingLabel
                    : "Se trimite..."
                  : typeof submitLabel === "string"
                  ? submitLabel
                  : "Primește link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
