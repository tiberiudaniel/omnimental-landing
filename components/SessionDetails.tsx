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
    <div className="mt-10 rounded-[10px] border border-[#D8C6B6] bg-white/92 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-[1px]">
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
      <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right relative w-full max-w-5xl rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px] lg:mx-auto">
        <TypewriterText
          key="group-details-heading"
          text="Mental Coaching Online Group"
          speed={98}
          enableSound
        />

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {groupSummary.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-[10px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
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

  type HighlightCard = {
    title: string;
    description: string;
    inlineLink?: { href: string; label: string };
  };

  const highlightsValue = t("individualHighlights");
  const highlightCards: HighlightCard[] = Array.isArray(highlightsValue)
    ? highlightsValue.flatMap((item) => {
        if (!item || typeof item !== "object") {
          return [];
        }

        const maybeHighlight = item as Record<string, unknown>;
        const title = maybeHighlight.title;
        const description = maybeHighlight.description;
        const inlineLink = maybeHighlight.inlineLink;

        if (typeof title !== "string" || typeof description !== "string") {
          return [];
        }

        let parsedInlineLink: HighlightCard["inlineLink"];
        if (
          inlineLink &&
          typeof inlineLink === "object" &&
          typeof (inlineLink as Record<string, unknown>).href === "string" &&
          typeof (inlineLink as Record<string, unknown>).label === "string"
        ) {
          parsedInlineLink = {
            href: (inlineLink as Record<string, string>).href,
            label: (inlineLink as Record<string, string>).label,
          };
        }

        return [
          {
            title,
            description,
            inlineLink: parsedInlineLink,
          } as HighlightCard,
        ];
      })
    : [];

  const introValue = t(`${type}Intro`);
  const intro =
    typeof introValue === "string"
      ? introValue
      : Array.isArray(introValue)
      ? introValue.filter((part) => typeof part === "string").join(" ")
      : "";

  const sectionsValue = t(`${type}Sections`);
  const sectionList: string[] = Array.isArray(sectionsValue)
    ? sectionsValue.filter((item): item is string => typeof item === "string")
    : typeof sectionsValue === "string"
    ? sectionsValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const sectionsTitleValue = t("individualSectionsTitle");
  const sectionsTitle =
    typeof sectionsTitleValue === "string" ? sectionsTitleValue : "";

  const footerValue = t("individualFooter");
  const footerText = typeof footerValue === "string" ? footerValue : "";

  return (
    <div className="panel-canvas panel-canvas--left panel-canvas--brain-left w-full max-w-5xl rounded-[12px] border border-[#D8C6B6] bg-white/94 px-8 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[1.5px] lg:mx-auto">
      <TypewriterText
        key={`individual-intro-${intro}`}
        text={intro}
        speed={94}
        enableSound
      />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {highlightCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-[10px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
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

        {sectionList.length > 0 && (
          <motion.div
            key="individual-sections"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: highlightCards.length * 0.1 }}
            className="rounded-[10px] border border-[#D8C6B6] bg-[#F6F2EE]/95 px-6 py-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          >
            {sectionsTitle ? (
              <h3 className="text-xl font-semibold text-[#1F1F1F]">
                {sectionsTitle}
              </h3>
            ) : null}
            <ul className="mt-4 space-y-3">
              {sectionList.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base leading-relaxed text-[#2C2C2C]"
                >
                  <span className="mt-2 h-2 w-2 rounded-full bg-[#E60012]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {footerText ? (
        <p className="mt-8 text-sm leading-relaxed text-[#2C2C2C]/80">
          {footerText}
        </p>
      ) : null}

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
