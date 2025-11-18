export type BudgetLevel = "low" | "medium" | "high";

export function inferBudgetLevelFromValue(value: unknown): BudgetLevel {
  if (value === "low" || value === "medium" || value === "high") return value;
  const n = Number(value);
  if (Number.isFinite(n)) {
    if (n <= 3) return "low";
    if (n <= 7) return "medium";
    return "high";
  }
  return "medium";
}

type IntentLike = {
  budgetLevel?: unknown;
  resources?: { budget?: unknown };
  motivation?: { budgetLevel?: unknown };
} | null | undefined;

export function inferBudgetLevelFromIntent(intent: unknown): BudgetLevel {
  try {
    const i = intent as IntentLike;
    // Try common shapes
    if (i?.budgetLevel) return inferBudgetLevelFromValue(i.budgetLevel);
    if (i?.resources?.budget) return inferBudgetLevelFromValue(i.resources.budget);
    if (i?.motivation?.budgetLevel) return inferBudgetLevelFromValue(i.motivation.budgetLevel);
  } catch {}
  return "medium";
}

export function choosePrimaryProduct(params: { budget: BudgetLevel; urgency?: number }): "platform" | "group" | "individual" {
  const { budget, urgency } = params;
  if (budget === "low") return "platform";
  if (budget === "medium") return "group";
  // high budget
  if (urgency != null && Number(urgency) >= 7) return "individual";
  return "group";
}
