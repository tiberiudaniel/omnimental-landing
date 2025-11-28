export type LessonDifficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_STYLES: Record<LessonDifficulty, { badge: string; chip: string }> = {
  easy: {
    badge: "border border-[#BEE3BF] bg-[#F1FBF1] text-[#1F7A43]",
    chip: "border border-[#BEE3BF] text-[#1F7A43] bg-[#F1FBF1]",
  },
  medium: {
    badge: "border border-[#E4DAD1] bg-white text-[#7B6B60]",
    chip: "border border-[#E4DAD1] text-[#7B6B60] bg-white",
  },
  hard: {
    badge: "border border-[#F6B8A8] bg-[#FFF2EC] text-[#C24B17]",
    chip: "border border-[#F6B8A8] text-[#C24B17] bg-[#FFF2EC]",
  },
};

export function asDifficulty(value?: string | null): LessonDifficulty {
  if (value === "easy" || value === "hard" || value === "medium") return value;
  return "medium";
}
