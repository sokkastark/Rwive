import type { Observation, Activity } from './memory.ts';

export interface MorningBrief {
  generatedAt: string; // ISO date string
  priorities: Observation[];
  momentum: Observation[];
  reminders: Observation[];
  focusRecommendation?: {
    title: string;
    reason: string;
    relatedEntityId?: string;
  };
}

export interface EveningReview {
  generatedAt: string; // ISO date string
  completed: Activity[];
  momentumChanges: Observation[];
  unresolvedItems: Observation[];
  reflectionPrompt?: string;
}
