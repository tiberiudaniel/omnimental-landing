"use client";

import { useRouter } from "next/navigation";
import type { ProgressFact } from "@/lib/progressFacts";
import { getUnlockState } from "@/lib/unlockState";
import { useI18n } from "./I18nProvider";

type Props = {
  lang: "ro" | "en";
  progress?: ProgressFact | null;
};

export default function OmniPathRow({ lang: _langProp, progress }: Props) {
  const router = useRouter();
  const unlock = getUnlockState(progress);
  const { t, lang } = useI18n();
  void _langProp;

  const getString = (key: string, fallback: string) => {
    const v = t(key);
    return typeof v === "string" ? (v as string) : fallback;
  };

  const Label = {
    scope: getString("omniPath.scope", lang === "ro" ? "Omni-Scop" : "Omni-Intent"),
    kuno: getString("omniPath.kuno", lang === "ro" ? "Omni-Cuno" : "Omni-Knowledge"),
    sensei: getString("omniPath.sensei", "Omni-Sensei"),
    abil: getString("omniPath.abil", lang === "ro" ? "Omni-Abil" : "Omni-Abilities"),
    intel: getString("omniPath.intel", "Omni-Intel"),
  };

  const Hint = {
    scope: getString("omniPath.hint.scope", ""),
    kuno: getString("omniPath.hint.kuno", lang === "ro" ? "După clarificare" : "After scope"),
    sensei: getString(
      "omniPath.hint.sensei",
      lang === "ro" ? "După Scop + 1 test" : "After Scope + 1 test",
    ),
    abil: getString("omniPath.hint.abil", lang === "ro" ? "După 1 provocare" : "After 1 challenge"),
    intel: getString(
      "omniPath.hint.intel",
      lang === "ro" ? "După 2 evaluări" : "After 2 evaluations",
    ),
  };

  const Card = (
    {
      title,
      unlocked,
      onClick,
      hint,
    }: { title: string; unlocked: boolean; onClick: () => void; hint?: string }
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[10px] border px-3 py-2 text-left text-[12px] font-semibold ${
        unlocked
          ? "border-[#2C2C2C] bg-white text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white transition"
          : "border-dashed border-[#E4D8CE] bg-white/70 text-[#A08F82] cursor-not-allowed"
      }`}
      aria-disabled={!unlocked}
    >
      <span>{title}</span>
      {!unlocked && hint ? (
        <span className="mt-1 block text-[10px] font-normal text-[#A08F82]">{hint}</span>
      ) : null}
    </button>
  );

  return (
    <div className="mx-auto mb-2 max-w-5xl">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Card({
          title: Label.scope,
          unlocked: unlock.scopeUnlocked,
          onClick: () => router.push("/?step=intent&source=omni-path"),
        })}
        {Card({
          title: Label.kuno,
          unlocked: unlock.kunoUnlocked,
          hint: Hint.kuno,
          onClick: () => router.push("/antrenament?tab=oc"),
        })}
        {Card({
          title: Label.sensei,
          unlocked: unlock.senseiUnlocked,
          hint: Hint.sensei,
          onClick: () => router.push("/antrenament?tab=ose"),
        })}
        {Card({
          title: Label.abil,
          unlocked: unlock.abilUnlocked,
          hint: Hint.abil,
          onClick: () => router.push("/antrenament?tab=oa"),
        })}
        {Card({
          title: Label.intel,
          unlocked: unlock.intelUnlocked,
          hint: Hint.intel,
          onClick: () => router.push("/antrenament?tab=oi"),
        })}
      </div>
    </div>
  );
}
