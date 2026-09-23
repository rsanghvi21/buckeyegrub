/**
 * BuckeyeGrub Gamification & Streak Engine
 * Tracks consecutive daily meal logging, milestone achievements (3-day, 7-day, 14-day, 30-day),
 * and calculates milestone badge progression for Ohio State students.
 */

export interface StreakMilestone {
  id: string;
  days: number;
  title: string;
  badgeLabel: string;
  description: string;
  rewardTitle: string;
  iconName: 'Flame' | 'Award' | 'Trophy' | 'Crown';
}

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  {
    id: 'milestone-3',
    days: 3,
    title: 'Freshman Kickoff',
    badgeLabel: '3-Day Streak',
    description: 'Logged 3 consecutive days of campus dining fuel.',
    rewardTitle: 'Buckeye Rookie',
    iconName: 'Flame',
  },
  {
    id: 'milestone-7',
    days: 7,
    title: 'Varsity Starter',
    badgeLabel: '7-Day Streak',
    description: 'Maintained a 7-day nutrition streak across OSU dining halls.',
    rewardTitle: 'Varsity Letter',
    iconName: 'Award',
  },
  {
    id: 'milestone-14',
    days: 14,
    title: 'Gold Pants Champion',
    badgeLabel: '14-Day Streak',
    description: '2 full weeks of disciplined campus nutrition habits!',
    rewardTitle: 'Gold Pants Charm',
    iconName: 'Trophy',
  },
  {
    id: 'milestone-30',
    days: 30,
    title: 'Campus Legend',
    badgeLabel: '30-Day Streak',
    description: '30 consecutive days of elite student fueling and macro tracking.',
    rewardTitle: 'Block O Hall of Fame',
    iconName: 'Crown',
  },
] as const;

export interface MilestoneProgressItem extends StreakMilestone {
  isUnlocked: boolean;
  progressPercent: number; // 0 - 100
  daysRemaining: number;
}

/**
 * Evaluates all streak milestones against current streak days.
 */
export function evaluateMilestones(streakDays: number): MilestoneProgressItem[] {
  const safeDays = Math.max(0, streakDays);
  return STREAK_MILESTONES.map((milestone) => {
    const isUnlocked = safeDays >= milestone.days;
    const progressPercent = Math.min(100, Math.round((safeDays / milestone.days) * 100));
    const daysRemaining = Math.max(0, milestone.days - safeDays);

    return {
      ...milestone,
      isUnlocked,
      progressPercent,
      daysRemaining,
    };
  });
}

/**
 * Retrieves the next upcoming locked milestone, or null if all achieved.
 */
export function getNextMilestone(streakDays: number): MilestoneProgressItem | null {
  const milestones = evaluateMilestones(streakDays);
  return milestones.find((m) => !m.isUnlocked) ?? null;
}

export type StreakTransitionStatus =
  | 'consecutive_increment'
  | 'already_logged_today'
  | 'streak_restarted'
  | 'initial';

export interface StreakEvaluationResult {
  newStreakDays: number;
  status: StreakTransitionStatus;
  newMilestoneUnlocked: StreakMilestone | null;
  dateRecorded: string;
}

/**
 * Formats a Date object to local campus date string 'YYYY-MM-DD'.
 * Avoids UTC timezone conversion shifts for students in Columbus, OH.
 */
export function getCampusDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure date calculation helper that advances or resets streak based on calendar date.
 */
export function evaluateDailyStreak(
  lastActiveDate: string | undefined,
  currentStreakDays: number,
  referenceDateStr?: string
): StreakEvaluationResult {
  const todayStr = referenceDateStr || getCampusDateString();


  if (!lastActiveDate) {
    const newStreak = 1;
    const newMilestone = STREAK_MILESTONES.find((m) => m.days === newStreak) || null;
    return {
      newStreakDays: newStreak,
      status: 'initial',
      newMilestoneUnlocked: newMilestone,
      dateRecorded: todayStr,
    };
  }

  // Already logged today
  if (lastActiveDate === todayStr) {
    return {
      newStreakDays: Math.max(1, currentStreakDays),
      status: 'already_logged_today',
      newMilestoneUnlocked: null,
      dateRecorded: todayStr,
    };
  }

  // Calculate day difference
  const lastActive = new Date(lastActiveDate);
  const today = new Date(todayStr);
  const diffTime = today.getTime() - lastActive.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    const newStreak = currentStreakDays + 1;
    const newMilestone = STREAK_MILESTONES.find((m) => m.days === newStreak) || null;
    return {
      newStreakDays: newStreak,
      status: 'consecutive_increment',
      newMilestoneUnlocked: newMilestone,
      dateRecorded: todayStr,
    };
  } else if (diffDays > 1) {
    // Broken streak, restart at 1
    const newStreak = 1;
    return {
      newStreakDays: newStreak,
      status: 'streak_restarted',
      newMilestoneUnlocked: null,
      dateRecorded: todayStr,
    };
  }

  // Fallback
  return {
    newStreakDays: currentStreakDays,
    status: 'already_logged_today',
    newMilestoneUnlocked: null,
    dateRecorded: todayStr,
  };
}
