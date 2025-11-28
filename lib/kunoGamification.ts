export interface KunoGamificationState {
  xp: number;
  badges: string[];
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export function applyKunoGamification(
  current: Partial<KunoGamificationState> | undefined,
  event: 'onboarding_test' | 'practice' | 'lesson',
): KunoGamificationState {
  const base: KunoGamificationState = {
    xp: 0,
    badges: [],
    streakDays: 0,
    lastActiveDate: '',
    ...(current ?? {}),
  } as KunoGamificationState;
  const today = todayKey();
  // streak update
  if (base.lastActiveDate !== today) {
    // naive streak: if lastActiveDate is yesterday, ++ else reset to 1
    const last = base.lastActiveDate ? new Date(base.lastActiveDate) : null;
    let streak = base.streakDays || 0;
    if (last) {
      const diff = Math.floor((Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) - Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate())) / 86400000);
      streak = diff === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    base.streakDays = streak;
    base.lastActiveDate = today;
  }
  // XP by event
  const addXp = event === 'onboarding_test' ? 10 : event === 'practice' ? 8 : 5;
  base.xp += addXp;
  // badges
  const addBadge = (b: string) => {
    if (!base.badges.includes(b)) base.badges.push(b);
  };
  if (event === 'onboarding_test') addBadge('first_test');
  if (event === 'lesson') addBadge('first_lesson');
  if (base.streakDays >= 7) addBadge('streak_7');
  if (base.streakDays >= 30) addBadge('streak_30');
  return base;
}

