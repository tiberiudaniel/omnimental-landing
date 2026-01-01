"use client";

import { useTStrings } from "./useTStrings";
import type { NavLink } from "./MenuOverlay";
import type { AccessTierFlags } from "@/lib/accessTier";
import { useUserAccessTier } from "@/components/useUserAccessTier";

type NavLinkConfig = {
  href: string;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey?: string;
  fallbackDescription?: string;
  minTier?: number;
  requiresFlag?: keyof AccessTierFlags;
};

const NAV_LINK_CONFIG: NavLinkConfig[] = [
  { href: "/today", labelKey: "navToday", fallbackLabel: "Today", minTier: 1 },
  { href: "/progress", labelKey: "navProgress", fallbackLabel: "Progress", requiresFlag: "canProgress", minTier: 2 },
  { href: "/arenas", labelKey: "navArenas", fallbackLabel: "Arenas", requiresFlag: "canArenas", minTier: 3 },
  { href: "/kuno", labelKey: "navLibrary", fallbackLabel: "Library", requiresFlag: "canLibrary", minTier: 4 },
  { href: "/wizard", labelKey: "navWizard", fallbackLabel: "Wizard", requiresFlag: "canWizard", minTier: 5 },
  { href: "/omni-abil", labelKey: "navModules", fallbackLabel: "Module Hubs", requiresFlag: "canHubs", minTier: 3 },
  { href: "/group", labelKey: "navProgram", fallbackLabel: "Programs" },
  { href: "/individual", labelKey: "navSessions", fallbackLabel: "1:1 Sessions" },
  { href: "/antrenament", labelKey: "navEvaluation", fallbackLabel: "Evaluation" },
  { href: "/recommendation", labelKey: "navRecommendation", fallbackLabel: "Recommendation" },
  { href: "/about", labelKey: "navAbout", fallbackLabel: "About" },
  { href: "mailto:hello@omnimental.ro", labelKey: "navContact", fallbackLabel: "Contact" },
];

const BLOCKED_PREFIXES = ["/demo", "/legacy"];

export function useNavigationLinks(): NavLink[] {
  const { s } = useTStrings();
  const { accessTier } = useUserAccessTier();

  if (!accessTier.flags.showMenu) {
    return [];
  }

  return NAV_LINK_CONFIG.filter((link) => {
    if (BLOCKED_PREFIXES.some((prefix) => link.href.startsWith(prefix))) {
      return false;
    }
    if (typeof link.minTier === "number" && accessTier.tier < link.minTier) {
      return false;
    }
    if (link.requiresFlag && !accessTier.flags[link.requiresFlag]) {
      return false;
    }
    return true;
  }).map(({ href, labelKey, fallbackLabel, descriptionKey, fallbackDescription }) => ({
    href,
    label: s(labelKey, fallbackLabel),
    description: descriptionKey ? s(descriptionKey, fallbackDescription ?? fallbackLabel) : undefined,
  }));
}
