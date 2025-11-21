export type OmniKunoAreaKey = "calm" | "energy" | "relations" | "performance" | "sense";

export function getLessonXp(options?: { difficulty?: "standard" | "advanced" }): number {
  if (options?.difficulty === "advanced") return 8;
  return 5;
}

export function getQuizXp(score: number): number {
  if (score >= 80) return 15;
  if (score >= 50) return 8;
  return 3;
}

export function getInitialXpFromMiniTest(score: number): number {
  if (score <= 33) return 10;
  if (score <= 66) return 20;
  return 30;
}

export function applyKunoXp(areaKey: OmniKunoAreaKey, amount: number) {
  if (typeof window !== "undefined") {
    try {
      const key = `omnimental_kuno_xp_${areaKey}`;
      const current = Number(window.localStorage.getItem(key) ?? "0");
      window.localStorage.setItem(key, String(Math.max(0, current + amount)));
    } catch {
      // ignore storage errors
    }
  }
}
