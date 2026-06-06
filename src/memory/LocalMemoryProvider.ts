import { MemoryProvider } from './MemoryProvider';
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
} from '../types/memory';

const KEYS = {
  PROJECTS: 'rwive_projects',
  ACTIVITIES: 'rwive_activities',
  RELATIONSHIPS: 'rwive_relationships',
  TIMELINE: 'rwive_timeline',
  SNAPSHOTS: 'rwive_snapshots',
  OBSERVATIONS: 'rwive_observations',
  COMMITMENTS: 'rwive_commitments',
  HABITS: 'rwive_habits',
  HABIT_LOGS: 'rwive_habit_logs',
};

export class LocalMemoryProvider implements MemoryProvider {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient()) return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient()) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  async getProjects(): Promise<Project[]> {
    return this.getItem<Project[]>(KEYS.PROJECTS, []);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    this.setItem(KEYS.PROJECTS, projects);
  }

  async getActivities(projectId?: string): Promise<Activity[]> {
    const activities = this.getItem<Activity[]>(KEYS.ACTIVITIES, []);
    if (projectId) {
      return activities.filter((a) => a.projectId === projectId);
    }
    return activities;
  }

  async saveActivity(activity: Activity): Promise<void> {
    const activities = await this.getActivities();
    const index = activities.findIndex((a) => a.id === activity.id);
    if (index >= 0) {
      activities[index] = activity;
    } else {
      activities.push(activity);
    }
    this.setItem(KEYS.ACTIVITIES, activities);
  }

  async getRelationships(): Promise<Relationship[]> {
    const rels = this.getItem<Relationship[]>(KEYS.RELATIONSHIPS, []);
    // Backfill missing preferredContactFrequencyDays for legacy data
    return rels.map((r) => ({
      ...r,
      preferredContactFrequencyDays: r.preferredContactFrequencyDays ?? 7,
    }));
  }

  async saveRelationship(relationship: Relationship): Promise<void> {
    const relationships = await this.getRelationships();
    const index = relationships.findIndex((r) => r.id === relationship.id);
    if (index >= 0) {
      relationships[index] = relationship;
    } else {
      relationships.push(relationship);
    }
    this.setItem(KEYS.RELATIONSHIPS, relationships);
  }

  async getTimelineEvents(projectId?: string): Promise<TimelineEvent[]> {
    const events = this.getItem<TimelineEvent[]>(KEYS.TIMELINE, []);
    if (projectId) {
      return events.filter((e) => e.projectId === projectId);
    }
    return events;
  }

  async saveTimelineEvent(event: TimelineEvent): Promise<void> {
    const events = this.getItem<TimelineEvent[]>(KEYS.TIMELINE, []);
    const index = events.findIndex((e) => e.id === event.id);
    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }
    this.setItem(KEYS.TIMELINE, events);
  }

  async deleteTimelineEvent(id: string): Promise<void> {
    const events = this.getItem<TimelineEvent[]>(KEYS.TIMELINE, []);
    this.setItem(KEYS.TIMELINE, events.filter((e) => e.id !== id));
  }

  async getSnapshots(): Promise<MemorySnapshot[]> {
    return this.getItem<MemorySnapshot[]>(KEYS.SNAPSHOTS, []);
  }

  async saveSnapshot(snapshot: MemorySnapshot): Promise<void> {
    const snapshots = await this.getSnapshots();
    snapshots.push(snapshot);
    this.setItem(KEYS.SNAPSHOTS, snapshots);
  }

  async getObservations(): Promise<Observation[]> {
    return this.getItem<Observation[]>(KEYS.OBSERVATIONS, []);
  }

  async saveObservations(observations: Observation[]): Promise<void> {
    this.setItem(KEYS.OBSERVATIONS, observations);
  }

  async getCommitments(): Promise<Commitment[]> {
    return this.getItem<Commitment[]>(KEYS.COMMITMENTS, []);
  }

  async saveCommitment(commitment: Commitment): Promise<void> {
    const commitments = await this.getCommitments();
    const index = commitments.findIndex((c) => c.id === commitment.id);
    if (index >= 0) {
      commitments[index] = commitment;
    } else {
      commitments.push(commitment);
    }
    this.setItem(KEYS.COMMITMENTS, commitments);
  }

  async deleteCommitment(id: string): Promise<void> {
    const commitments = await this.getCommitments();
    this.setItem(
      KEYS.COMMITMENTS,
      commitments.filter((c) => c.id !== id)
    );
  }

  async getHabits(): Promise<Habit[]> {
    return this.getItem<Habit[]>(KEYS.HABITS, []);
  }

  async saveHabit(habit: Habit): Promise<void> {
    const habits = await this.getHabits();
    const index = habits.findIndex((h) => h.id === habit.id);
    if (index >= 0) {
      habits[index] = habit;
    } else {
      habits.push(habit);
    }
    this.setItem(KEYS.HABITS, habits);
  }

  async getHabitLogs(habitId?: string): Promise<HabitLog[]> {
    const logs = this.getItem<HabitLog[]>(KEYS.HABIT_LOGS, []);
    if (habitId) {
      return logs.filter((l) => l.habitId === habitId);
    }
    return logs;
  }

  async saveHabitLog(log: HabitLog): Promise<void> {
    const logs = await this.getHabitLogs();
    // Unique per habitId + date
    const index = logs.findIndex((l) => l.habitId === log.habitId && l.date === log.date);
    if (index >= 0) {
      logs[index] = log;
    } else {
      logs.push(log);
    }
    this.setItem(KEYS.HABIT_LOGS, logs);
  }
}
