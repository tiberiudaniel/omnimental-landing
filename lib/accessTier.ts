import { getTotalDailySessionsCompleted } from "@/lib/gatingSelectors";
import type { ProgressFact } from "@/lib/progressFacts";

export type AccessTierFlags = {
  showMenu: boolean;
  showMinimalMenu: boolean;
  canProgress: boolean;
  canArenas: boolean;
  canLibrary: boolean;
  canWizard: boolean;
  canHubs: boolean;
};

export type AccessTierResult = {
  tier: number;
  flags: AccessTierFlags;
  navLinks: string[];
};

export type AccessTierInput = {
  progress?: ProgressFact | null;
};

const tierBoundaries = {
  minimalMenu: 1,
  coreMenu: 2,
  arenas: 3,
  library: 4,
  wizard: 5,
};

function hasFoundationMilestone(progress?: ProgressFact | null): boolean {
  const stats = progress?.stats as { foundationDone?: boolean } | undefined;
  return Boolean(stats?.foundationDone);
}

export function deriveAccessTier({ progress }: AccessTierInput): AccessTierResult {
  const sessionsCompleted = getTotalDailySessionsCompleted(progress);
  const foundationComplete = hasFoundationMilestone(progress);

  let tier = 0;
  if (sessionsCompleted >= 31) {
    tier = 5;
  } else if (sessionsCompleted >= 12) {
    tier = 4;
  } else if (foundationComplete) {
    tier = 3;
  } else if (sessionsCompleted >= 3) {
    tier = 2;
  } else if (sessionsCompleted >= 1) {
    tier = 1;
  }

  const flags: AccessTierFlags = {
    showMenu: tier >= tierBoundaries.minimalMenu,
    showMinimalMenu: tier >= tierBoundaries.minimalMenu,
    canProgress: tier >= tierBoundaries.coreMenu,
    canArenas: tier >= tierBoundaries.arenas,
    canLibrary: tier >= tierBoundaries.library,
    canWizard: tier >= tierBoundaries.wizard,
    canHubs: tier >= tierBoundaries.arenas,
  };

  const navLinks: string[] = [];
  if (tier >= tierBoundaries.minimalMenu) navLinks.push("today");
  if (tier >= tierBoundaries.coreMenu) navLinks.push("progress");
  if (tier >= tierBoundaries.arenas) navLinks.push("arenas");
  if (tier >= tierBoundaries.library) navLinks.push("library");
  if (tier >= tierBoundaries.wizard) navLinks.push("wizard");

  return { tier, flags, navLinks };
}
