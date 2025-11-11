export type Lang = "ro" | "en";

export function getGlobalLoadLabel(urgency: number, lang: Lang): string {
  if (urgency >= 7) return lang === "ro" ? "Ridicat" : "High";
  if (urgency >= 4) return lang === "ro" ? "Moderat" : "Moderate";
  return lang === "ro" ? "Scăzut" : "Low";
}

export function getOmniLevel(score: number, lang: Lang): string | null {
  if (!Number.isFinite(score)) return null;
  const s = Math.round(score);
  if (s >= 75) return lang === "ro" ? "Sensei" : "Sensei";
  if (s >= 50) return lang === "ro" ? "Adept" : "Adept";
  if (s >= 25) return lang === "ro" ? "Pathfinder" : "Pathfinder";
  return lang === "ro" ? "Explorer" : "Explorer";
}

// Normalize MAAS (1–6) to a 0–10 visual scale
export function normalizeMaas(maasTotal: number): number {
  const normalized = Math.max(0, Math.min(10, (maasTotal / 6) * 10));
  return Math.round(normalized * 10) / 10;
}

export const metricDescriptions: Record<string, { ro: string; en: string }> = {
  "PSS – Stres perceput": {
    ro: "0–40, mai mare = mai mult stres",
    en: "0–40, higher = more perceived stress",
  },
  "GSE – Autoeficacitate": {
    ro: "10–40, mai mare = încredere mai mare",
    en: "10–40, higher = greater self‑efficacy",
  },
  "MAAS – Prezență": {
    ro: "1–6, mai mare = prezență conștientă",
    en: "1–6, higher = mindful awareness",
  },
  "PANAS +": {
    ro: "afect pozitiv total",
    en: "total positive affect",
  },
  "PANAS -": {
    ro: "afect negativ total",
    en: "total negative affect",
  },
  "SVS – Vitalitate": {
    ro: "1–7, mai mare = vitalitate",
    en: "1–7, higher = vitality",
  },
};

