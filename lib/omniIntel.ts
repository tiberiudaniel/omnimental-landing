export type DirectionMotivationInputs = {
  urgency: number; // 1-10
  determination: number; // 1-5
  hoursPerWeek: number; // 0-8
};

export type OmniBlock = {
  scope: {
    goalDescription?: string | null;
    mainPain?: string | null;
    idealDay?: string | null;
    wordCount?: number | null;
    tags?: string[];
    directionMotivationIndex: number; // 0-100
    motivationIndex?: number; // 0-100 (enhanced)
  };
  kuno: {
    completedTests?: number;
    totalTestsAvailable?: number;
    scores?: Record<string, number>;
    knowledgeIndex?: number; // 0-100 (latest)
    averagePercent?: number; // 0-100 (EWMA/mean)
    runsCount?: number;
    // Optional EDU activity: number of micro-lessons completed
    lessonsCompletedCount?: number;
    // Optional mastery per category (0-100), filled by Kuno practice/learn flows
    masteryByCategory?: Partial<
      Record<
        'clarity' | 'calm' | 'energy' | 'relationships' | 'performance' | 'health' | 'general',
        number
      >
    >;
    lessons?: Record<
      string,
      {
        completedIds?: string[];
        lastUpdated?: Date | { toDate: () => Date };
        performance?: {
          recentScores?: number[];
          recentTimeSpent?: number[];
          difficultyBias?: number;
        };
      }
    >;
    modules?: Record<
      string,
      {
        completedIds?: string[];
        lastUpdated?: Date | { toDate: () => Date };
        xp?: number;
        performance?: {
          recentScores?: number[];
          recentTimeSpent?: number[];
          difficultyBias?: number;
        };
      }
    >;
    recommendedModuleId?: string;
    recommendedArea?: string;
    exam?: {
      lastTakenAt?: number;
      score?: number;
      breakdown?: Record<string, number>;
    };
    global?: {
      totalXp?: number;
      completedLessons?: number;
      currentDifficulty?: 'easy' | 'medium' | 'hard';
    };
    gamification?: {
      xp?: number;
      badges?: string[];
      streakDays?: number;
      lastActiveDate?: string; // YYYY-MM-DD
    };
    readinessIndex?: number;
    signals?: Record<string, string>;
  };
  sensei: {
    unlocked: boolean;
    activeQuests: Array<Record<string, unknown>>;
    completedQuestsCount: number;
  };
  abil: {
    unlocked: boolean;
    exercisesCompletedCount: number;
    skillsIndex: number; // 0-100 (latest)
    practiceIndex?: number; // 0-100 (blended)
    runsCount?: number;
    dailyCompletedThisWeek?: number;
    weeklyCompletedThisMonth?: number;
    lastCompletedDate?: string;
    dailyWeekKey?: string;
    weeklyMonthKey?: string;
  };
  daily?: {
    streakDays?: number;
    lastCheckinDate?: string;
    today?: {
      energy?: number;
      stress?: number;
      clarity?: number;
      sleep?: number;
      confidence?: number;
      focus?: number;
    };
    history?: Record<
      string,
      {
        energy?: number;
        stress?: number;
        clarity?: number;
        sleep?: number;
        confidence?: number;
        focus?: number;
      }
    >;
  };
  intel: {
    unlocked: boolean;
    evaluationsCount: number;
    consistencyIndex: number; // 0-100
  };
  journal?: {
    today?: {
      status?: "completed" | "pending";
      updatedAt?: Date | { toDate: () => Date };
    };
  };
  initiation?: {
    firstAction?: {
      text?: string | null;
      theme?: string | null;
      savedAt?: Date | { toDate: () => Date };
    };
  };
  flow?: {
    flowIndex: number; // 0-100
    streakCurrent: number;
    streakBest: number;
  };
  omniIntelScore: number; // 0-100
  omniPoints: number;
  level?: number;
};

export function computeDirectionMotivationIndex(input: DirectionMotivationInputs): number {
  const urg = clamp(input.urgency, 1, 10) / 10; // 0.1 - 1.0
  const det = clamp(input.determination, 1, 5) / 5; // 0.2 - 1.0
  const hrs = clamp(input.hoursPerWeek, 0, 8) / 8; // 0 - 1.0
  const score = 0.5 * urg + 0.3 * det + 0.2 * hrs;
  return Math.round(score * 100);
}

export function computeOmniIntelScore(params: {
  knowledgeIndex: number; // 0-100
  skillsIndex: number; // 0-100
  directionMotivationIndex: number; // 0-100
  consistencyIndex: number; // 0-100
}): number {
  const k = clamp(params.knowledgeIndex, 0, 100);
  const s = clamp(params.skillsIndex, 0, 100);
  const d = clamp(params.directionMotivationIndex, 0, 100);
  const c = clamp(params.consistencyIndex, 0, 100);
  const score = 0.25 * k + 0.35 * s + 0.2 * d + 0.2 * c;
  return Math.round(score);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export { computeConsistencyIndexFromDates } from "./consistencyIndex";
