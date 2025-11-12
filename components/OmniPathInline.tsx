"use client";

import { useRouter } from "next/navigation";
import type { ProgressFact } from "@/lib/progressFacts";
import { getUnlockState } from "@/lib/unlockState";

type PathBtnProps = {
  lang: "ro" | "en";
  title: string;
  unlocked: boolean;
  onClick: () => void;
  hint?: string;
  inlineHint?: boolean;
};

function PathBtn({ lang, title, unlocked, onClick, hint, inlineHint = false }: PathBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[8px] border px-2 py-1 sm:px-2.5 sm:py-1.5 text-left text-[11px] font-semibold ${
        unlocked
          ? "border-[#D8C6B6] bg-[#F6F2EE] text-[#2C2C2C] hover:border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition"
          : "border-dashed border-[#E4D8CE] bg-[#FFF9F3] text-[#A08F82] cursor-not-allowed"
      }`}
      aria-disabled={!unlocked}
      title={hint ? `${title} — ${hint}` : title}
    >
      <span>
        {title}
        {inlineHint && hint ? <span className="ml-1 text-[10px] font-normal text-[#7A6455]">({hint})</span> : null}
      </span>
      {!inlineHint && !unlocked && hint ? (
        <span className="mt-0.5 block text-[10px] font-normal text-[#A08F82]">{hint}</span>
      ) : null}
      <span
        className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${unlocked ? "bg-emerald-500" : "bg-[#C9B8A8]"}`}
        title={unlocked ? (lang === "ro" ? "Disponibil" : "Unlocked") : (lang === "ro" ? "Blocat" : "Locked")}
        aria-hidden
      />
    </button>
  );
}

export default function OmniPathInline({ lang, progress }: { lang: "ro" | "en"; progress?: ProgressFact | null }) {
  const router = useRouter();
  const unlock = getUnlockState(progress);

  const Label = {
    scope: lang === "ro" ? "Omni-Scop" : "Omni-Intent",
    kuno: lang === "ro" ? "Omni-Cuno" : "Omni-Knowledge",
    sensei: "Omni-Sensei",
    abil: lang === "ro" ? "Omni-Abil" : "Omni-Abilities",
    intel: "Omni-Intel",
  };

  const Hint = {
    kuno: lang === "ro" ? "După clarificare" : "After scope",
    sensei: lang === "ro" ? "După Scop + 1 test" : "After Scope + 1 test",
    abil: lang === "ro" ? "După 1 provocare" : "After 1 challenge",
    intel: lang === "ro" ? "După 2 evaluări" : "After 2 evaluations",
  };

  return (
    <div className="relative">
      {/* Connector arrows (desktop only) */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {/* approximate midpoints between 5 columns: 20%, 40%, 60%, 80% */}
        <span className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M2 7 H14" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" />
            <path d="M10 3 L14 7 L10 11" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M2 7 H14" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" />
            <path d="M10 3 L14 7 L10 11" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M2 7 H14" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" />
            <path d="M10 3 L14 7 L10 11" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M2 7 H14" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" />
            <path d="M10 3 L14 7 L10 11" stroke="#D8C6B6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-1.5 sm:grid-cols-5 sm:gap-2">
        <PathBtn lang={lang} title={Label.scope} unlocked={unlock.scopeUnlocked} onClick={() => router.push("/?step=intent&source=omni-path-inline")} />
        <PathBtn lang={lang} title={Label.kuno} unlocked={unlock.kunoUnlocked} hint={Hint.kuno} onClick={() => router.push("/antrenament?tab=oc")} />
        <PathBtn lang={lang} title={Label.sensei} unlocked={unlock.senseiUnlocked} hint={Hint.sensei} onClick={() => router.push("/antrenament?tab=ose")} />
        <PathBtn lang={lang} title={Label.abil} unlocked={unlock.abilUnlocked} hint={Hint.abil} inlineHint onClick={() => router.push("/antrenament?tab=oa")} />
        <PathBtn lang={lang} title={Label.intel} unlocked={unlock.intelUnlocked} hint={Hint.intel} onClick={() => router.push("/antrenament?tab=oi")} />
      </div>
    </div>
  );
}
