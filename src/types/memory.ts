export interface LifeArea {
  id: string; // e.g. 'family', 'health', 'career', 'learning', 'creative', 'finance', 'relationships'
  name: string;
  color: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lifeAreaId: string;
  status: 'active' | 'paused' | 'completed';
  health: 'green' | 'yellow' | 'red';
  momentum: 'high' | 'medium' | 'low' | 'dormant';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  aliases?: string[];
  keywords?: string[];
}

export interface Activity {
  id: string;
  projectId: string;
  description: string;
  timestamp: string; // ISO date string
}

export interface Relationship {
  id: string;
  name: string;
  type: string; // e.g., 'Family', 'Friend', 'Work'
  lastInteractionDate: string; // ISO date string
  notes?: string;
  preferredContactFrequencyDays: number; // default 7
}

export interface TimelineEvent {
  id: string;
  projectId?: string | null;
  type: 'created' | 'status_change' | 'milestone' | 'activity' | 'reflection';
  title: string;
  description: string;
  timestamp: string; // ISO date string
}

export interface MemorySnapshot {
  timestamp: string; // ISO date string
  activeProjectsCount: number;
  neglectedProjectsCount: number;
  lifeAreaStatuses: Record<string, 'active' | 'inactive' | 'moderate'>;
}

// --- Commitments ---

export type CommitmentStatus = 'pending' | 'completed' | 'skipped';
export type FollowUpStatus = 'pending' | 'asked' | 'resolved';

export interface Commitment {
  id: string;
  title: string;
  dueAt: string; // ISO date string
  snoozedUntil?: string; // ISO date string
  status: CommitmentStatus;
  followUpStatus: FollowUpStatus;
  outcomeNote?: string;
  projectId?: string;
  relationshipId?: string;
  ownerId: string;
}

// --- Habits ---

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  preferredTime: string; // HH:MM format
  streak: number;
  lastCompletedAt?: string; // YYYY-MM-DD
  lastRemindedAt?: string; // ISO date string
  ownerId: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  ownerId: string;
}

// --- Memory Operations ---

export interface MemoryOperation {
  operation:
    | 'LOG_ACTIVITY'
    | 'CREATE_PROJECT'
    | 'UPDATE_PROJECT'
    | 'LOG_RELATIONSHIP_INTERACTION'
    | 'CREATE_COMMITMENT'
    | 'COMPLETE_COMMITMENT'
    | 'SKIP_COMMITMENT'
    | 'SNOOZE_COMMITMENT'
    | 'CREATE_HABIT'
    | 'COMPLETE_HABIT';
  // Project / Activity
  project?: string;
  activity?: string;
  status?: 'active' | 'paused' | 'completed';
  date?: string;
  // Relationship
  person?: string;
  relationshipType?: string;
  notes?: string;
  // Commitment
  commitmentId?: string;
  commitmentTitle?: string;
  dueAt?: string; // ISO date string
  snoozedUntil?: string; // ISO date string
  outcomeNote?: string;
  projectId?: string;
  relationshipId?: string;
  // Habit
  habitId?: string;
  habitTitle?: string;
  habitFrequency?: HabitFrequency;
  preferredTime?: string;
}

export interface Observation {
  id: string;
  type: 'project_inactive' | 'project_momentum' | 'relationship_overdue' | 'relationship_active' | 'learning_consistent';
  category: 'project' | 'relationship' | 'health' | 'learning' | 'family' | 'career' | 'general';
  status: 'active' | 'dismissed' | 'resolved';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestedAction: string;
  relatedEntityId: string;
  timestamp: string; // ISO date string
}

// --- Memory Vault (Facts) ---
export interface PersonalMemory {
  id: string;
  content: string;
  category: string;
  createdAt: string;
}

// --- Companion Messages ---
export type MessageSender = 'user' | 'rwive' | 'system';
export type MessageType = 'chat' | 'activity' | 'commitment' | 'habit' | 'reflection' | 'relationship';

export interface CompanionMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text: string;
  timestamp: string;
}
