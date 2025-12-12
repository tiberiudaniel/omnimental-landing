import { getUserArcState, getUserMetrics, upsertUserArcState, upsertUserMetrics } from "@/lib/arcStateStore";
import type { ArcProgress } from "@/types/arcState";
import type { UserMetrics } from "@/types/userMetrics";

function dateStringFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function updateStreak(metrics: UserMetrics | undefined, dateStr: string): UserMetrics {
  if (!metrics) {
    return {
      streakDays: 1,
      longestStreakDays: 1,
      lastCompletedDate: dateStr,
    };
  }

  const prevDateStr = metrics.lastCompletedDate;
  if (!prevDateStr) {
    return {
      streakDays: 1,
      longestStreakDays: Math.max(metrics.longestStreakDays ?? 0, 1),
      lastCompletedDate: dateStr,
    };
  }

  const prevDate = new Date(prevDateStr);
  const currDate = new Date(dateStr);
  const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);
  let streak = metrics.streakDays ?? 0;

  if (diffDays === 1) {
    streak += 1;
  } else if (diffDays <= 0) {
    streak = Math.max(streak, 1);
  } else {
    streak = 1;
  }

  return {
    streakDays: streak,
    longestStreakDays: Math.max(metrics.longestStreakDays ?? 0, streak),
    lastCompletedDate: dateStr,
  };
}

export async function applyDailyPracticeCompletion(
  userId: string,
  arcId: string,
  xpGained: number,
  completionDate: Date,
): Promise<void> {
  if (!userId || !arcId) return;
  const dateStr = dateStringFromDate(completionDate);
  let arcState = (await getUserArcState(userId)) ?? {};
  const progress = arcState.progress ?? {};
  const prev: ArcProgress = progress[arcId] ?? { xp: 0, daysCompleted: 0 };
  const daysCompleted = prev.lastDayCompleted === dateStr ? prev.daysCompleted : prev.daysCompleted + 1;
  const nextProgress: ArcProgress = {
    xp: prev.xp + xpGained,
    daysCompleted,
    lastDayCompleted: dateStr,
  };
  arcState = {
    ...arcState,
    progress: {
      ...progress,
      [arcId]: nextProgress,
    },
  };
  await upsertUserArcState(userId, arcState);

  const prevMetrics = await getUserMetrics(userId);
  const nextMetrics = updateStreak(prevMetrics, dateStr);
  await upsertUserMetrics(userId, nextMetrics);
}
