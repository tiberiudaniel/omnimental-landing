import type { OmniKunoLesson } from "@/config/omniKunoLessons";

export function getLessonObjective(lesson: OmniKunoLesson | undefined, lang: string): string {
  if (!lesson) return lang === "ro" ? "Explorează misiunea și notează ce observi." : "Explore the mission and jot down your insights.";

  if (lesson.type === "quiz") {
    return lang === "ro"
      ? "Aplică ce ai învățat în scenarii reale și măsoară claritatea răspunsurilor."
      : "Apply what you’ve learned in real scenarios and measure your clarity under pressure.";
  }

  return lesson.summary || (lang === "ro" ? "Aplică ideile în contextul tău." : "Apply the ideas in your context.");
}

export function getLessonDuration(lesson: OmniKunoLesson | undefined): number {
  if (!lesson) return 5;
  if (typeof lesson.durationMin === "number" && lesson.durationMin > 0) return lesson.durationMin;
  return lesson.type === "quiz" ? 7 : 5;
}
