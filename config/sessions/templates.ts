import type { SessionTemplateId } from "@/lib/taxonomy/types";

type SessionBlock =
  | { kind: "lesson"; lessonVariant: "short" | "deep" }
  | { kind: "vocab" }
  | { kind: "checkin" }
  | { kind: "arenaTaste" }
  | { kind: "commit" }
  | { kind: "core_lesson" }
  | { kind: "elective_practice" }
  | { kind: "recall" };

export type SessionTemplate = {
  templateId: SessionTemplateId;
  title: string;
  durationMinutes: number;
  blocks: SessionBlock[];
};

export const SESSION_TEMPLATES: Record<string, SessionTemplate> = {
  initiation_10min: {
    templateId: "initiation_10min" as SessionTemplateId,
    title: "Initiation — 10 min",
    durationMinutes: 10,
    blocks: [
      { kind: "checkin" },
      { kind: "lesson", lessonVariant: "short" },
      { kind: "commit" },
    ],
  },
  initiation_12min_deep: {
    templateId: "initiation_12min_deep" as SessionTemplateId,
    title: "Initiation — 12 min deep",
    durationMinutes: 12,
    blocks: [
      { kind: "checkin" },
      { kind: "lesson", lessonVariant: "deep" },
      { kind: "lesson", lessonVariant: "short" },
      { kind: "commit" },
    ],
  },
  initiation_with_arena_taste: {
    templateId: "initiation_with_arena_taste" as SessionTemplateId,
    title: "Initiation — Arena Taste",
    durationMinutes: 12,
    blocks: [
      { kind: "checkin" },
      { kind: "lesson", lessonVariant: "short" },
      { kind: "arenaTaste" },
      { kind: "commit" },
    ],
  },
  initiation_v2_12min: {
    templateId: "initiation_v2_12min" as SessionTemplateId,
    title: "Initiation V2 — 12 min",
    durationMinutes: 12,
    blocks: [{ kind: "core_lesson" }, { kind: "elective_practice" }, { kind: "recall" }],
  },
};
