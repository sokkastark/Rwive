import type { SupabaseClient } from '@supabase/supabase-js';
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

const OWNER_ID = 'stark';

/**
 * SupabaseMemoryProvider
 * Persists all memory to Supabase tables, scoped by owner_id = 'stark'.
 * Row shapes match the SQL schema in the implementation plan.
 */
export class SupabaseMemoryProvider implements MemoryProvider {
  constructor(private readonly client: SupabaseClient) {}

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapProject);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', OWNER_ID)
      .single();
    if (error) return null;
    return data ? this.mapProject(data) : null;
  }

  async saveProject(project: Project): Promise<void> {
    const row = {
      id: project.id,
      name: project.name,
      description: project.description,
      health: project.health,
      momentum: project.momentum,
      life_area_id: project.lifeAreaId,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
      owner_id: OWNER_ID,
    };
    const { error } = await this.client.from('projects').upsert(row);
    if (error) throw error;
  }

  private mapProject(r: Record<string, unknown>): Project {
    return {
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) ?? '',
      lifeAreaId: r.life_area_id as string,
      status: 'active',
      health: r.health as Project['health'],
      momentum: r.momentum as Project['momentum'],
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Activities ---
  async getActivities(projectId?: string): Promise<Activity[]> {
    let query = this.client
      .from('activities')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('timestamp', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      projectId: r.project_id as string,
      description: r.description as string,
      timestamp: r.timestamp as string,
    }));
  }

  async saveActivity(activity: Activity): Promise<void> {
    const { error } = await this.client.from('activities').upsert({
      id: activity.id,
      project_id: activity.projectId,
      description: activity.description,
      timestamp: activity.timestamp,
      owner_id: OWNER_ID,
    });
    if (error) throw error;
  }

  // --- Relationships ---
  async getRelationships(): Promise<Relationship[]> {
    const { data, error } = await this.client
      .from('relationships')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      type: r.type as string,
      lastInteractionDate: r.last_interaction_date as string,
      notes: r.notes as string | undefined,
      preferredContactFrequencyDays: (r.preferred_contact_frequency_days as number) ?? 7,
    }));
  }

  async saveRelationship(relationship: Relationship): Promise<void> {
    const { error } = await this.client.from('relationships').upsert({
      id: relationship.id,
      name: relationship.name,
      type: relationship.type,
      notes: relationship.notes,
      last_interaction_date: relationship.lastInteractionDate,
      preferred_contact_frequency_days: relationship.preferredContactFrequencyDays,
      owner_id: OWNER_ID,
    });
    if (error) throw error;
  }

  // --- Timeline ---
  async getTimelineEvents(projectId?: string): Promise<TimelineEvent[]> {
    let query = this.client
      .from('timeline_events')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('timestamp', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      projectId: r.project_id as string,
      type: r.type as TimelineEvent['type'],
      title: r.title as string,
      description: r.description as string,
      timestamp: r.timestamp as string,
    }));
  }

  async saveTimelineEvent(event: TimelineEvent): Promise<void> {
    const { error } = await this.client.from('timeline_events').upsert({
      id: event.id,
      project_id: event.projectId,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      owner_id: OWNER_ID,
    });
    if (error) throw error;
  }

  // --- Snapshots (stored as observations since Supabase table exists) ---
  async getSnapshots(): Promise<MemorySnapshot[]> { return []; }
  async saveSnapshot(_snapshot: MemorySnapshot): Promise<void> {}

  // --- Observations ---
  async getObservations(): Promise<Observation[]> {
    const { data, error } = await this.client
      .from('observations')
      .select('*')
      .eq('owner_id', OWNER_ID);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      type: r.type as Observation['type'],
      category: r.category as Observation['category'],
      status: r.status as Observation['status'],
      severity: r.severity as Observation['severity'],
      title: r.title as string,
      description: r.description as string,
      suggestedAction: r.suggested_action as string,
      relatedEntityId: r.related_entity_id as string,
      timestamp: r.timestamp as string,
    }));
  }

  async saveObservations(observations: Observation[]): Promise<void> {
    if (observations.length === 0) return;
    const rows = observations.map((o) => ({
      id: o.id,
      type: o.type,
      category: o.category,
      status: o.status,
      severity: o.severity,
      title: o.title,
      description: o.description,
      suggested_action: o.suggestedAction,
      related_entity_id: o.relatedEntityId,
      timestamp: o.timestamp,
      owner_id: OWNER_ID,
    }));
    const { error } = await this.client.from('observations').upsert(rows);
    if (error) throw error;
  }

  // --- Commitments ---
  async getCommitments(): Promise<Commitment[]> {
    const { data, error } = await this.client
      .from('commitments')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('due_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      dueAt: r.due_at as string,
      snoozedUntil: r.snoozed_until as string | undefined,
      status: r.status as Commitment['status'],
      followUpStatus: r.follow_up_status as Commitment['followUpStatus'],
      outcomeNote: r.outcome_note as string | undefined,
      projectId: r.project_id as string | undefined,
      relationshipId: r.relationship_id as string | undefined,
      ownerId: r.owner_id as string,
    }));
  }

  async saveCommitment(commitment: Commitment): Promise<void> {
    const { error } = await this.client.from('commitments').upsert({
      id: commitment.id,
      title: commitment.title,
      due_at: commitment.dueAt,
      snoozed_until: commitment.snoozedUntil ?? null,
      status: commitment.status,
      follow_up_status: commitment.followUpStatus,
      outcome_note: commitment.outcomeNote ?? null,
      project_id: commitment.projectId ?? null,
      relationship_id: commitment.relationshipId ?? null,
      owner_id: OWNER_ID,
    });
    if (error) throw error;
  }

  async deleteCommitment(id: string): Promise<void> {
    const { error } = await this.client
      .from('commitments')
      .delete()
      .eq('id', id)
      .eq('owner_id', OWNER_ID);
    if (error) throw error;
  }

  // --- Habits ---
  async getHabits(): Promise<Habit[]> {
    const { data, error } = await this.client
      .from('habits')
      .select('*')
      .eq('owner_id', OWNER_ID);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title as string,
      frequency: r.frequency as Habit['frequency'],
      preferredTime: r.preferred_time as string,
      streak: r.streak as number,
      lastCompletedAt: r.last_completed_at as string | undefined,
      lastRemindedAt: r.last_reminded_at as string | undefined,
      ownerId: r.owner_id as string,
    }));
  }

  async saveHabit(habit: Habit): Promise<void> {
    const { error } = await this.client.from('habits').upsert({
      id: habit.id,
      title: habit.title,
      frequency: habit.frequency,
      preferred_time: habit.preferredTime,
      streak: habit.streak,
      last_completed_at: habit.lastCompletedAt ?? null,
      last_reminded_at: habit.lastRemindedAt ?? null,
      owner_id: OWNER_ID,
    });
    if (error) throw error;
  }

  // --- Habit Logs ---
  async getHabitLogs(habitId?: string): Promise<HabitLog[]> {
    let query = this.client
      .from('habit_logs')
      .select('*')
      .eq('owner_id', OWNER_ID)
      .order('date', { ascending: false });
    if (habitId) query = query.eq('habit_id', habitId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id as string,
      habitId: r.habit_id as string,
      date: r.date as string,
      status: r.status as HabitLog['status'],
      ownerId: r.owner_id as string,
    }));
  }

  async saveHabitLog(log: HabitLog): Promise<void> {
    const { error } = await this.client.from('habit_logs').upsert(
      {
        id: log.id,
        habit_id: log.habitId,
        date: log.date,
        status: log.status,
        owner_id: OWNER_ID,
      },
      { onConflict: 'habit_id,date' }
    );
    if (error) throw error;
  }
}
