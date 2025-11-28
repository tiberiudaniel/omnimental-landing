"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

// Redirector step: opens the real Journal drawer on /progress at NOTE_LIBERE.
export default function InitiationStepJournal() {
  const router = useRouter();
  const { lang } = useI18n();
  useEffect(() => {
    const url = new URL(window.location.origin + "/progress");
    url.searchParams.set("from", "initiation");
    url.searchParams.set("step", "journal-open");
    url.searchParams.set("open", "journal");
    url.searchParams.set("tab", "NOTE_LIBERE");
    router.replace(url.pathname + url.search);
  }, [router]);
  return (
    <div
      className="mx-auto max-w-xl rounded-[12px] border px-6 py-6 text-sm"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
    >
      {lang === 'ro' ? 'Se deschide jurnalul…' : 'Opening the journal…'}
    </div>
  );
}
