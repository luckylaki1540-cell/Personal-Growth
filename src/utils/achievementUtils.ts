/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, ActivityLog, Badge, SkillProgress } from '../types';

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Growth Step',
    description: 'Complete your first suggested growth activity.',
    icon: 'CornerDownRight',
    requirementType: 'activities',
    requirementValue: 1,
  },
  {
    id: 'streak_3',
    name: 'Habit Spark',
    description: 'Achieve a 3-day growth activity streak.',
    icon: 'FlameKindling',
    requirementType: 'streak',
    requirementValue: 3,
  },
  {
    id: 'streak_7',
    name: 'Indomitable Will',
    description: 'Maintain a 7-day growth activity streak.',
    icon: 'Flame',
    requirementType: 'streak',
    requirementValue: 7,
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach user Level 3 through progressive practice.',
    icon: 'Sparkles',
    requirementType: 'level',
    requirementValue: 3,
  },
  {
    id: 'xp_500',
    name: 'Wisdom Champion',
    description: 'Earn a total of 500 Experience Points (XP).',
    icon: 'Trophy',
    requirementType: 'xp',
    requirementValue: 500,
  }
];

/**
 * Calculates XP required to advance from the current level.
 * Level 1 -> 100XP, Level 2 -> 200XP, Level 3 -> 300XP, etc.
 */
export function getRequiredXpForNextLevel(level: number): number {
  return level * 100;
}

/**
 * Updates user profile level and returns any leveled up status.
 */
export function calculateXpGain(profile: UserProfile, xpGained: number): {
  updatedProfile: UserProfile;
  leveledUp: boolean;
} {
  let xp = profile.xp + xpGained;
  let level = profile.level;
  let leveledUp = false;

  while (xp >= getRequiredXpForNextLevel(level)) {
    xp -= getRequiredXpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }

  return {
    updatedProfile: {
      ...profile,
      xp,
      level,
    },
    leveledUp,
  };
}

/**
 * Recalculates and updates streak based on completions.
 */
export function handleDailyStreakUpdate(profile: UserProfile, logs: ActivityLog[]): UserProfile {
  if (logs.length === 0) return profile;

  // Group logs by local date
  const uniqueDates = Array.from(
    new Set(
      logs.map((log) => {
        const d = new Date(log.timestamp);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )
  ).sort();

  const todayStr = getLocalDateString(new Date());
  const yesterdayStr = getLocalDateString(getYesterdayDate());

  let streak = profile.streak;
  const lastActiveDate = profile.lastActiveDate;

  // If last active date was today, streak remains same
  if (lastActiveDate === todayStr) {
    return profile;
  }

  if (lastActiveDate === yesterdayStr) {
    streak += 1;
  } else {
    // If it's been more than a day, streak is reset to 1
    streak = 1;
  }

  const maxStreak = Math.max(profile.maxStreak, streak);

  return {
    ...profile,
    streak,
    maxStreak,
    lastActiveDate: todayStr,
  };
}

function getLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getYesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Checks for newly unlocked badges based on user stats.
 */
export function updateUnlockedBadges(profile: UserProfile, logs: ActivityLog[], currentBadges: Badge[]): {
  newlyUnlocked: Badge[];
  allBadges: Badge[];
} {
  const newlyUnlocked: Badge[] = [];
  const todayISO = new Date().toISOString();

  const allBadges = currentBadges.map((badge) => {
    if (badge.unlockedAt) return badge; // Already unlocked

    let fitsCriteria = false;

    switch (badge.requirementType) {
      case 'streak':
        fitsCriteria = profile.streak >= badge.requirementValue;
        break;
      case 'activities':
        fitsCriteria = logs.length >= badge.requirementValue;
        break;
      case 'level':
        fitsCriteria = profile.level >= badge.requirementValue;
        break;
      case 'xp':
        const totalXp = logs.reduce((sum, log) => sum + log.xpEarned, 0);
        fitsCriteria = totalXp >= badge.requirementValue;
        break;
    }

    if (fitsCriteria) {
      const unlockedBadge = { ...badge, unlockedAt: todayISO };
      newlyUnlocked.push(unlockedBadge);
      return unlockedBadge;
    }

    return badge;
  });

  return {
    newlyUnlocked,
    allBadges,
  };
}

/**
 * Groups user logs to calculate skill progress metric for every interest.
 */
export function calculateSkillProgress(interests: string[], logs: ActivityLog[]): SkillProgress[] {
  return interests.map((interest) => {
    const interestLogs = logs.filter((l) => l.interest.toLowerCase() === interest.toLowerCase());
    const totalXp = interestLogs.reduce((sum, l) => sum + l.xpEarned, 0);
    
    // Calculate custom level for each skill
    let level = 1;
    let tempXp = totalXp;
    let targetXp = 100;
    
    while (tempXp >= targetXp) {
      tempXp -= targetXp;
      level += 1;
      targetXp = level * 100;
    }

    const lastLog = interestLogs.length > 0 ? interestLogs[interestLogs.length - 1] : undefined;

    return {
      name: interest,
      xp: tempXp,
      level,
      totalActivities: interestLogs.length,
      recentActivityDate: lastLog ? lastLog.timestamp : undefined,
    };
  });
}
