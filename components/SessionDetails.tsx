// components/SessionDetails.tsx
"use client";

import { useI18n } from "../components/I18nProvider";
import TypewriterText from "./TypewriterText";
import CTAButton from "./CTAButton"; // make sure CTAButton exists and is client component

interface SessionDetailsProps {
  type: "individual" | "group";
}

export default function SessionDetails({ type }: SessionDetailsProps) {
  const { t } = useI18n();

  const intro = t(`${type}Intro`);
  const sections = t(`${type}Sections`);
  const cta = t("signup");

  let sectionList: string[] = [];

  try {
    // support both array in JSON or comma-separated string
    const parsed = JSON.parse(sections);
    if (Array.isArray(parsed)) sectionList = parsed;
  } catch {
    sectionList = sections.split(",").map((s) => s.trim());
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mt-8 w-full md:w-3/4">
      <TypewriterText text={intro} />
      <ul className="list-disc pl-6 mt-4 space-y-2">
        {sectionList.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <CTAButton text={cta} />
    </div>
  );
}
