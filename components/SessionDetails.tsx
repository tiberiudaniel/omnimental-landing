// components/SessionDetails.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../components/I18nProvider";
import TypewriterText from "./TypewriterText";
import CTAButton from "./CTAButton";

interface SessionDetailsProps {
  type: "individual" | "group";
}

export default function SessionDetails({ type }: SessionDetailsProps) {
  const { t } = useI18n();
  const ctaValue = t("signup");
  const reassuranceTitleValue = t("reassuranceTitle");
  const reassurancePointsValue = t("reassurancePoints");
  const reassuranceTitle =
    typeof reassuranceTitleValue === "string" ? reassuranceTitleValue : "";
  const reassurancePoints = Array.isArray(reassurancePointsValue)
    ? reassurancePointsValue
    : [];
  const metaLabelValue = t(
    type === "group" ? "sessionMetaGroup" : "sessionMetaIndividual"
  );
  const metaLabel = typeof metaLabelValue === "string" ? metaLabelValue : "";
  const cta = typeof ctaValue === "string" ? ctaValue : "";

  const groupSummary = useMemo(
    () => [
      {
        title: "Antrenament pentru minte și energie",
        description:
          "OmniMental Coaching aliniază creierul, inima și intestinul astfel încât deciziile să vină cu calm, energie și autocontrol. Programul online de 12 întâlniri condensează experiența din medii cu miză mare în exerciții ghidate, biofeedback și resetarea sistemului nervos. Este pentru profesioniști care vor să iasă din pilot automat și să transforme haosul zilnic în claritate și performanță.",
      },
      {
        title: "Structură și rezultate",
        description:
          "Parcurgi un funnel de performanță în patru niveluri — Awareness, Control, Strategy, Mastery — care transformă reacțiile automate în răspunsuri lucide. Lucrezi live cu tehnici CBT, ACT, NLP, hipnoză, respirație și simulări pentru a crea automatisme de performanță. Energia de grup și responsabilitatea comună te țin în ritm până când focusul, reziliența și deciziile inspirate devin noua normalitate.",
        inlineLink: {
          href: "/group-info",
          label: "All info",
        },
      },
    ],
    []
  );

  const reassuranceBlock = reassurancePoints.length ? (
    <div className="mt-10 border border-[#D8C6B6] bg-white p-6">
      <h4 className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-dark/60">
        {reassuranceTitle}
      </h4>
      <div className="mt-4 flex flex-wrap gap-3">
        {reassurancePoints.map((point) => (
          <span
            key={point}
            className="border border-[#D8C6B6] px-4 py-2 text-sm text-[#2C2C2C]"
          >
            {point}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  if (type === "group") {
    return (
      <div className="relative mt-8 w-full border border-[#D8C6B6] bg-white px-8 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.08)] md:w-4/5">
        <TypewriterText text="Mental Coaching Online Group" />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {groupSummary.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-[#D8C6B6] bg-[#F6F2EE] px-6 py-8"
            >
              <h3 className="text-xl font-semibold text-[#1F1F1F]">{card.title}</h3>
              <p className="mt-4 text-base leading-relaxed text-[#2C2C2C]">
                {card.description}
                {card.inlineLink && (
                  <Link
                    href={card.inlineLink.href}
                    className="ml-1 text-sm font-semibold text-[#E60012] underline underline-offset-8 hover:text-[#B8000E]"
                  >
                    {card.inlineLink.label}
                  </Link>
                )}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CTAButton text={cta} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-[#2C2C2C]">
            <span className="h-px w-16 bg-[#D8C6B6]" />
            {metaLabel}
          </div>
        </div>

        {reassuranceBlock}
      </div>
    );
  }

  const introValue = t(`${type}Intro`);
  const sectionsValue = t(`${type}Sections`);
  const intro = typeof introValue === "string" ? introValue : introValue.join(" ");
  const sectionList = Array.isArray(sectionsValue)
    ? sectionsValue
    : typeof sectionsValue === "string"
    ? sectionsValue.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="mt-8 w-full border border-[#D8C6B6] bg-white px-8 py-10 shadow-[0_12px_32px_rgba(0,0,0,0.08)] md:w-3/4">
      <TypewriterText text={intro} />
      <ul className="mt-4 list-disc space-y-2 pl-6">
        {sectionList.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CTAButton text={cta} />
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-[#2C2C2C]">
          <span className="h-px w-16 bg-[#D8C6B6]" />
          {metaLabel}
        </div>
      </div>
      {reassuranceBlock}
    </div>
  );
}
