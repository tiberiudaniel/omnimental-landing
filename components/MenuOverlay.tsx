"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
}

const defaultNavigationText = {
  heading: "Navigare",
  close: "Închide",
  cta: "Aplică acum",
};

export default function MenuOverlay({ open, onClose, links }: MenuOverlayProps) {
  const { t } = useI18n();
  const getLabel = (key: string, fallback: string): string => {
    const value = t(key);
    return typeof value === "string" ? value : fallback;
  };

  if (!open) return null;

  const navigationLabel = getLabel("navHeading", defaultNavigationText.heading);
  const closeLabel = getLabel("navClose", defaultNavigationText.close);
  const ctaLabel = getLabel("menuCtaLabel", defaultNavigationText.cta);

  const isWizard = (() => {
    try { return typeof window !== 'undefined' && window.location.pathname.startsWith('/wizard'); } catch { return false; }
  })();
  const overlayStyle = isWizard
    ? { backgroundColor: "rgba(242, 242, 240, 0.9)" }
    : { backgroundColor: "rgba(0,0,0,0.4)" };
  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm" style={overlayStyle} onClick={onClose}>
      <div
        className="absolute right-6 top-6 w-[320px] max-w-[90%] border px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: "var(--omni-surface-card)", borderColor: "var(--omni-border-soft)", color: "var(--omni-ink)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {navigationLabel}
          </div>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="text-sm font-semibold transition"
            style={{ color: "var(--omni-ink)" }}
          >
            {closeLabel}
          </button>
        </div>
        <ul className="mt-6 space-y-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className="block text-lg font-semibold transition"
                style={{ color: "var(--omni-ink)" }}
              >
                {link.label}
              </Link>
              {link.description && (
                <p className="mt-1 text-sm" style={{ color: "var(--omni-muted)" }}>{link.description}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-[var(--omni-bg-paper)] pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.href = "mailto:hello@omnimental.ro";
            }}
            className="inline-flex items-center gap-2 rounded-[8px] border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition"
            style={{
              backgroundColor: "var(--omni-brand-soft)",
              borderColor: "var(--omni-border-soft)",
              color: "var(--omni-ink)",
            }}
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
