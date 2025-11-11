export type LoadLevel = "low" | "moderate" | "high";

export function determineLoadLevel(urgency: number): LoadLevel {
  if (urgency >= 8) {
    return "high";
  }
  if (urgency <= 4) {
    return "low";
  }
  return "moderate";
}
