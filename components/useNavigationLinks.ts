"use client";

import { useState } from "react";
import { useTStrings } from "./useTStrings";
import type { NavLink } from "./MenuOverlay";
import { hasFoundationCycleCompleted } from "@/lib/dailyCompletion";

type NavLinkConfig = {
  href: string;
  labelKey: string;
  descriptionKey?: string;
};

const NAV_LINK_CONFIG: NavLinkConfig[] = [
  { href: "/group", labelKey: "navProgram", descriptionKey: "navProgramDesc" },
  { href: "/individual", labelKey: "navSessions", descriptionKey: "navSessionsDesc" },
  { href: "/antrenament", labelKey: "navEvaluation", descriptionKey: "navEvaluationDesc" },
  { href: "/recommendation", labelKey: "navRecommendation", descriptionKey: "navRecommendationDesc" },
  { href: "/progress", labelKey: "navProgress", descriptionKey: "navProgressDesc" },
  { href: "/training/arenas", labelKey: "navArenas", descriptionKey: "navArenasDesc" },
  // Omni Sensei moved from header tabs into menu
  { href: "/antrenament?tab=ose", labelKey: "senseiTitle" },
  { href: "/about", labelKey: "navAbout", descriptionKey: "navAboutDesc" },
  { href: "mailto:hello@omnimental.ro", labelKey: "navContact", descriptionKey: "navContactDesc" },
];

export function useNavigationLinks(): NavLink[] {
  const { s } = useTStrings();
  const [foundationDone] = useState(() => hasFoundationCycleCompleted());

  return NAV_LINK_CONFIG.filter((link) => {
    if (link.href === "/training/arenas") {
      return foundationDone;
    }
    return true;
  }).map(({ href, labelKey, descriptionKey }) => ({
    href,
    label: s(labelKey, labelKey),
    description: descriptionKey ? s(descriptionKey, descriptionKey) : undefined,
  }));
}
