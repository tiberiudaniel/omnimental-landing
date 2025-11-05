"use client";

import Link from "next/link";
import CTAButton from "./CTAButton";

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

export default function MenuOverlay({ open, onClose, links }: MenuOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute right-6 top-6 w-[320px] max-w-[90%] border border-[#D8C6B6] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.35em] text-[#A08F82]">Navigare</div>
          <button
            onClick={onClose}
            aria-label="Închide meniul"
            className="text-sm font-semibold text-[#2C2C2C] transition hover:text-[#E60012]"
          >
            Închide
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
          <CTAButton text="Aplică acum" />
        </div>
      </div>
    </div>
  );
}
