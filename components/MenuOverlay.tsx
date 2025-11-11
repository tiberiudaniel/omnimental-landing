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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-6 top-6 w-[320px] max-w-[90%] border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">
            {navigationLabel}
          </div>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="text-sm font-semibold text-[#2C2C2C] transition hover:text-[#E60012]"
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
                className="block text-lg font-semibold text-[#1F1F1F] transition hover:text-[#E60012]"
              >
                {link.label}
              </Link>
              {link.description && (
                <p className="mt-1 text-sm text-[#2C2C2C]/70">{link.description}</p>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-[#F6F2EE] pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              window.location.href = "mailto:hello@omnimental.ro";
            }}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
