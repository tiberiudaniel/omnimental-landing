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
    <div className="mx-auto max-w-xl rounded-[12px] border border-[#E4DAD1] bg-white px-6 py-6 text-sm text-[#4A3A30]">
      {lang === 'ro' ? 'Se deschide jurnalul…' : 'Opening the journal…'}
    </div>
  );
}
