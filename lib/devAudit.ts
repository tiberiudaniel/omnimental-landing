/**
 * Dev-only audit helpers. Import and run in the console in development.
 */
import { getIntentExpressions } from "@/lib/intentExpressions";
import { intentCategoryToIndicator } from "@/lib/indicators";

export function auditIntentExpressions(locale: "ro" | "en" = "ro") {
  const expr = getIntentExpressions(locale);
  const unknown: Array<{ id: string; label: string; category: string }> = [];
  for (const e of expr) {
    const ok = intentCategoryToIndicator[e.category] != null;
    if (!ok) unknown.push({ id: e.id, label: e.label, category: e.category });
  }
  console.group("Intent expressions audit");
  console.log("total:", expr.length);
  if (unknown.length) {
    console.warn("Unknown category mapping for:", unknown);
  } else {
    console.log("All expressions covered by mapping.");
  }
  console.groupEnd();
}
