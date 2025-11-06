"use client";

import { useI18n } from "./I18nProvider";
import type { NavLink } from "./MenuOverlay";

type NavLinkConfig = {
  href: string;
  labelKey: string;
  descriptionKey?: string;
};

const NAV_LINK_CONFIG: NavLinkConfig[] = [
  { href: "/group-info", labelKey: "navProgram", descriptionKey: "navProgramDesc" },
  { href: "/sessions/individual", labelKey: "navSessions", descriptionKey: "navSessionsDesc" },
  { href: "/evaluation", labelKey: "navEvaluation", descriptionKey: "navEvaluationDesc" },
  { href: "/about", labelKey: "navAbout", descriptionKey: "navAboutDesc" },
  { href: "mailto:hello@omnimental.ro", labelKey: "navContact", descriptionKey: "navContactDesc" },
];

const resolveString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

export function useNavigationLinks(): NavLink[] {
  const { t } = useI18n();

  return NAV_LINK_CONFIG.map(({ href, labelKey, descriptionKey }) => ({
    href,
    label: resolveString(t(labelKey), labelKey),
    description: descriptionKey ? resolveString(t(descriptionKey), descriptionKey) : undefined,
  }));
}
