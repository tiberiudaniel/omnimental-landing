import { WOW_DAY_SEQUENCE } from "@/config/dailyPaths/wow";
import { resolveTraitPrimaryForModule } from "@/config/wowLessonsV2";
import type { CatAxisId } from "@/lib/profileEngine";
import type { LessonId, LocaleCode, WorldId, ZoneId } from "@/lib/taxonomy/types";
import type { AdaptiveCluster } from "@/types/dailyPath";

const INITIATION_WORLD: WorldId = "INITIATION";
const SESSIONS_ZONE: ZoneId = "SESSIONS";
const DEFAULT_LOCALES: LocaleCode[] = ["ro", "en"];
const WOW_LESSON_MINUTES = 7;
const DAILY_PATH_MINUTES = 10;

type BaseLessonMeta = {
  lessonId: LessonId;
  cluster: AdaptiveCluster;
  axis?: CatAxisId | null;
  estimatedMinutes: number;
  world: WorldId;
  zone: ZoneId;
  localesAvailable: LocaleCode[];
};

type WowLessonMeta = BaseLessonMeta & {
  source: "wow";
  refs: {
    wowModuleKey: string;
  };
};

type DailyPathLessonMeta = BaseLessonMeta & {
  source: "dailyPath";
  refs: {
    dailyPathModuleKey: string;
  };
};

export type LessonMeta = WowLessonMeta | DailyPathLessonMeta;

type DailyPathLessonDefinition = {
  moduleKey: string;
  cluster: AdaptiveCluster;
  axis?: CatAxisId;
};

const DAILY_PATH_LESSON_DEFINITIONS: DailyPathLessonDefinition[] = [
  { moduleKey: "energy_recovery", cluster: "focus_energy_cluster", axis: "energy" },
  { moduleKey: "energy_congruence", cluster: "focus_energy_cluster", axis: "energy" },
  { moduleKey: "clarity_single_intent", cluster: "clarity_cluster", axis: "clarity" },
  { moduleKey: "clarity_one_important_thing", cluster: "clarity_cluster", axis: "clarity" },
  { moduleKey: "emotional_flex_pause", cluster: "emotional_flex_cluster", axis: "flexibility" },
  { moduleKey: "emotional_flex_naming", cluster: "emotional_flex_cluster", axis: "flexibility" },
];

const buildWowLessons = (): LessonMeta[] =>
  WOW_DAY_SEQUENCE.map(({ moduleKey, cluster }) => {
    const lessonId = moduleKey as LessonId;
    const axis = resolveTraitPrimaryForModule(moduleKey, null);
    return {
      lessonId,
      source: "wow",
      cluster,
      axis,
      estimatedMinutes: WOW_LESSON_MINUTES,
      world: INITIATION_WORLD,
      zone: SESSIONS_ZONE,
      localesAvailable: [...DEFAULT_LOCALES],
      refs: {
        wowModuleKey: moduleKey,
      },
    };
  });

const buildDailyPathLessons = (): LessonMeta[] =>
  DAILY_PATH_LESSON_DEFINITIONS.map(({ moduleKey, cluster, axis }) => {
    const lessonId = moduleKey as LessonId;
    return {
      lessonId,
      source: "dailyPath",
      cluster,
      axis,
      estimatedMinutes: DAILY_PATH_MINUTES,
      world: INITIATION_WORLD,
      zone: SESSIONS_ZONE,
      localesAvailable: [...DEFAULT_LOCALES],
      refs: {
        dailyPathModuleKey: moduleKey,
      },
    };
  });

const LESSON_ENTRIES: LessonMeta[] = [...buildWowLessons(), ...buildDailyPathLessons()];

const buildLessonRegistry = (): Record<LessonId, LessonMeta> => {
  return LESSON_ENTRIES.reduce<Record<LessonId, LessonMeta>>((acc, lesson) => {
    acc[lesson.lessonId] = lesson;
    return acc;
  }, {} as Record<LessonId, LessonMeta>);
};

export const INITIATION_LESSONS: Record<LessonId, LessonMeta> = buildLessonRegistry();
