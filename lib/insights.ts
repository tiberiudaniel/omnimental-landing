// /lib/insights.ts
// Static insights – lightweight, fast, no DB needed.
// Each insight is tagged by theme for dynamic rotation inside dashboard.

export type InsightTheme = "Calm" | "Clarity" | "Energy" | "Focus";

export interface InsightItem {
  theme: InsightTheme;
  text: string;
}

export const INSIGHTS: InsightItem[] = [
  {
    theme: "Calm",
    text: "Respirația diafragmatică reduce activarea amigdalei în 2–3 minute și stabilizează sistemul nervos.",
  },
  {
    theme: "Calm",
    text: "Tensiunea musculară din umeri și abdomen este primul semn că sistemul nervos intră în modul 'fight-or-flight'.",
  },
  {
    theme: "Clarity",
    text: "Atenția executivă scade după 90 de minute de lucru continuu; pauzele scurte cresc claritatea mentală.",
  },
  {
    theme: "Clarity",
    text: "Mintea devine mai clară când limitele personale sunt respectate; confuzia vine adesea din supraîncărcare relațională.",
  },
  {
    theme: "Energy",
    text: "Somnul profund stabilizează variabilitatea ritmului cardiac și susține energia pe tot parcursul zilei.",
  },
  {
    theme: "Energy",
    text: "Hidratarea adecvată îmbunătățește funcția cognitivă și reduce oboseala cu până la 20%.",
  },
  {
    theme: "Focus",
    text: "Un set de 3 minute de respirație 4-4-6 îmbunătățește funcția cortexului prefrontal și controlul atențional.",
  },
  {
    theme: "Focus",
    text: "Distragerile nu dispar; învățăm doar să le ignorăm prin antrenament repetat al atenției.",
  },
];

// Rotates daily based on day index
export function getDailyInsight(theme: InsightTheme): InsightItem {
  const items = INSIGHTS.filter((i) => i.theme === theme);
  if (items.length === 0) return { theme, text: "Nicio informație disponibilă încă." };

  const dayIndex = new Date().getDate();
  return items[dayIndex % items.length];
}

