import type { Project, Activity, Relationship, TimelineEvent, MemorySnapshot, Observation } from '../types/memory';

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

  // Snapshots
  getSnapshots(): Promise<MemorySnapshot[]>;
  saveSnapshot(snapshot: MemorySnapshot): Promise<void>;

  // Observations
  getObservations(): Promise<Observation[]>;
  saveObservations(observations: Observation[]): Promise<void>;
}
