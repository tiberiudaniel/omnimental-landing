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

export type ProgressTier = 0 | 1 | 2 | 3 | 4 | 5;
type MembershipSource =
  | string
  | null
  | undefined
  | {
      subscription?: { status?: string | null } | null;
      subscriptionStatus?: string | null;
      status?: string | null;
    };
export type MembershipTier = "free" | "premium";

export function deriveProgressTier(progress?: ProgressFact | null): ProgressTier {
  const sessionsCompleted = getTotalDailySessionsCompleted(progress);
  const foundationComplete = hasFoundationMilestone(progress);

  if (sessionsCompleted >= 31) {
    return 5;
  }
  if (sessionsCompleted >= 12) {
    return 4;
  }
  if (foundationComplete) {
    return 3;
  }
  if (sessionsCompleted >= 3) {
    return 2;
  }
  if (sessionsCompleted >= 1) {
    return 1;
  }
  return 0;
}

function resolveMembershipStatus(source: MembershipSource): string | null {
  if (!source) return null;
  if (typeof source === "string") return source;
  if (typeof source === "object") {
    if (typeof source.subscription?.status === "string") return source.subscription.status;
    if (typeof source.subscriptionStatus === "string") return source.subscriptionStatus;
    if (typeof source.status === "string") return source.status;
  }
  return null;
}

export function deriveMembershipTier(source?: MembershipSource): MembershipTier {
  const status = resolveMembershipStatus(source);
  return status?.toLowerCase() === "premium" ? "premium" : "free";
}

export function deriveAccessTier({ progress }: AccessTierInput): AccessTierResult {
  const tier = deriveProgressTier(progress);

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
