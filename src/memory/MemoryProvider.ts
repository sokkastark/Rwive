import type {
  Project,
  Activity,
  Relationship,
  TimelineEvent,
  MemorySnapshot,
  Observation,
  Commitment,
  Habit,
  HabitLog,
  PersonalMemory,
} from '../types/memory';

export interface MemoryProvider {
  // Projects
  getProjects(): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;

  // Activities
  getActivities(projectId?: string): Promise<Activity[]>;
  saveActivity(activity: Activity): Promise<void>;

  // Relationships
  getRelationships(): Promise<Relationship[]>;
  saveRelationship(relationship: Relationship): Promise<void>;

  // Timeline
  getTimelineEvents(projectId?: string): Promise<TimelineEvent[]>;
  saveTimelineEvent(event: TimelineEvent): Promise<void>;
  deleteTimelineEvent(id: string): Promise<void>;

  // Snapshots
  getSnapshots(): Promise<MemorySnapshot[]>;
  saveSnapshot(snapshot: MemorySnapshot): Promise<void>;

  // Observations
  getObservations(): Promise<Observation[]>;
  saveObservations(observations: Observation[]): Promise<void>;

  // Commitments
  getCommitments(): Promise<Commitment[]>;
  saveCommitment(commitment: Commitment): Promise<void>;
  deleteCommitment(id: string): Promise<void>;

  // Habits
  getHabits(): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<void>;

  // Habit Logs
  getHabitLogs(habitId?: string): Promise<HabitLog[]>;
  saveHabitLog(log: HabitLog): Promise<void>;

  // Personal Memories (Vault)
  getPersonalMemories(): Promise<PersonalMemory[]>;
  savePersonalMemory(memory: PersonalMemory): Promise<void>;
  deletePersonalMemory(id: string): Promise<void>;
}
