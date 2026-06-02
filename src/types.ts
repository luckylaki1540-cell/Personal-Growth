/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  age: number;
  interests: string[];
  goals: string[];
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  lastActiveDate?: string;
}

export interface ActivitySuggestion {
  id: string;
  activity: string;
  interest: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpValue: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity: string;
  interest: string;
  duration: number; // in minutes
  timestamp: string; // ISO String
  notes?: string;
  feedback?: string;
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  requirementType: 'streak' | 'activities' | 'xp' | 'level';
  requirementValue: number;
  unlockedAt?: string;
}

export interface GrowthFeedback {
  id: string;
  user_id: string;
  timestamp: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}

export interface SkillProgress {
  name: string;
  xp: number;
  level: number;
  totalActivities: number;
  recentActivityDate?: string;
}
