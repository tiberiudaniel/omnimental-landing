"use client";

import Image from "next/image";
import { useI18n } from "./I18nProvider";

interface SiteHeaderProps {
  showMenu?: boolean;
  onMenuToggle?: () => void;
}

export default function SiteHeader({ showMenu = true, onMenuToggle }: SiteHeaderProps) {
  const { lang, setLang } = useI18n();

  return (
    <header className="flex items-center justify-between bg-white p-4 shadow">
      <div className="flex items-center gap-4">
        <Image src="/assets/logo.jpg" alt="OmniMental logo" width={80} height={32} priority />
        <span className="text-2xl font-semibold tracking-wide text-neutral-dark">OmniMental</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 p-1 text-xs font-semibold text-neutral-dark">
          {(["ro", "en"] as const).map((locale) => (
            <button
              key={locale}
              onClick={() => setLang(locale)}
              className={`rounded-full px-3 py-1.5 transition ${
                lang === locale ? "bg-white text-primary shadow-sm" : "text-primary/70 hover:text-primary"
              }`}
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
