"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { useTStrings } from "./useTStrings";

export default function SiteFooter() {
  const { lang } = useI18n();
  const { s } = useTStrings();
  const unsubscribeLabel = s("headerUnsubscribe", lang === "ro" ? "Dezabonare" : "Unsubscribe");
  const links = (
    lang === "ro"
      ? [
          { href: "/about", label: "Despre" },
          { href: "/contact", label: "Contact" },
          { href: "/privacy", label: "Politica de confidențialitate" },
          { href: "/terms", label: "Termeni și condiții" },
          { href: "/cookies", label: "Politica cookies" },
          { href: "/unsubscribe", label: unsubscribeLabel },
        ]
      : [
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
          { href: "/cookies", label: "Cookie Policy" },
          { href: "/unsubscribe", label: unsubscribeLabel },
        ]
  );
  return (
    <footer className="mt-12 border-t border-[#EDE6DE] bg-white/95 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-[#5C4F45]">
        <p className="opacity-80">© {new Date().getFullYear()} OmniMental</p>
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-transparent px-2.5 py-1 font-semibold uppercase tracking-[0.18em] text-[#A08F82] transition hover:text-[#E60012]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
