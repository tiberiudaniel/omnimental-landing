export type OmniRecommendationType =
  | "onboarding"
  | "next-step"
  | "quest"
  | "mindset"
  | "alert";

export type OmniRecommendationStatus = "new" | "active" | "snoozed" | "done";

export interface OmniRecommendation {
  id: string;
  userId: string;

  title: string;
  shortLabel: string; // short text shown on the card stripe
  type: OmniRecommendationType;
  status: OmniRecommendationStatus;

  createdAt: string; // ISO string
  updatedAt?: string; // ISO string

  priority: 1 | 2 | 3; // 1 = high, 3 = low
  estimatedMinutes?: number;

  tags?: string[]; // e.g. ["somn", "energie", "mindset"]

  body: string; // full text in the detail panel

  ctaLabel?: string; // e.g. "Începe exercițiul"
  ctaHref?: string; // e.g. "/experience-onboarding?step=journal"

  // optional metadata about origin
  source?: "system" | "onboarding" | "coach" | "self";
  sourceRef?: string; // e.g. test/quest id
}

export function sortRecommendations(items: OmniRecommendation[]): OmniRecommendation[] {
  return [...items].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function getPrimaryRecommendation(items: OmniRecommendation[]): OmniRecommendation | undefined {
  if (!items.length) return undefined;
  const sorted = sortRecommendations(items);
  return sorted[0];
}

export function getRecommendationStatusLabel(status: OmniRecommendationStatus): string {
  switch (status) {
    case "new":
      return "Nouă";
    case "active":
      return "În lucru";
    case "snoozed":
      return "Amânată";
    case "done":
      return "Finalizată";
    default:
      return status;
  }
}

