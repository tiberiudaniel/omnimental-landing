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
    <footer className="site-footer mt-12 border-t border-[#EDE6DE] bg-white/90 py-5">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-3 text-center text-[12px] text-[#5C4F45] sm:flex-row sm:justify-between sm:text-left">
          <p className="opacity-70">© {new Date().getFullYear()} OmniMental</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[#7A6455] sm:justify-end">
            {links.map((l, idx) => (
              <span key={l.href} className="inline-flex items-center">
                <Link
                  href={l.href}
                  className="rounded-[6px] px-1.5 py-0.5 text-[12px] leading-6 text-[#7A6455]/85 underline-offset-4 transition hover:text-[#2C2C2C] hover:underline"
                >
                  {l.label}
                </Link>
                {idx < links.length - 1 ? (
                  <span className="hidden text-[#A08F82]/60 sm:inline">·</span>
                ) : null}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
