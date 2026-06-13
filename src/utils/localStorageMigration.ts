/**
 * localStorageMigration.ts
 *
 * One-time migration utility.
 * When Supabase is configured but empty, reads any existing data from
 * browser localStorage and upserts it all to Supabase.
 *
 * After migration completes, a flag is written to localStorage so this
 * never runs twice.
 */

import type { MemoryProvider as IMemoryProvider } from '../memory/MemoryProvider';
import { LocalMemoryProvider } from '../memory/LocalMemoryProvider';

const MIGRATION_FLAG = 'rwive_migrated_to_supabase';

export async function migrateLocalToSupabaseIfNeeded(
  remoteProvider: IMemoryProvider
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Already migrated before — skip
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return;

  const local = new LocalMemoryProvider();

  // Check if remote is empty (no projects) — only migrate if it's a fresh DB
  const remoteProjects = await remoteProvider.getProjects().catch(() => []);
  if (remoteProjects.length > 0) {
    // Remote already has data — mark as done and skip
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }

  // Load all local data
  const [projects, activities, relationships, timelineEvents, observations, commitments, habits, habitLogs, memories] =
    await Promise.all([
      local.getProjects(),
      local.getActivities(),
      local.getRelationships(),
      local.getTimelineEvents(),
      local.getObservations(),
      local.getCommitments(),
      local.getHabits(),
      local.getHabitLogs(),
      local.getPersonalMemories(),
    ]);

  const hasData =
    projects.length > 0 ||
    activities.length > 0 ||
    relationships.length > 0 ||
    commitments.length > 0 ||
    habits.length > 0 ||
    memories.length > 0;

  if (!hasData) {
    // Nothing to migrate — mark done
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return;
  }

  console.log('[Rwive] Migrating local data to Supabase...', {
    projects: projects.length,
    activities: activities.length,
    relationships: relationships.length,
    commitments: commitments.length,
    habits: habits.length,
    memories: memories.length,
  });

  // Upsert everything to remote — use allSettled so one failure doesn't abort the rest
  await Promise.allSettled([
    ...projects.map((p) => remoteProvider.saveProject(p)),
    ...activities.map((a) => remoteProvider.saveActivity(a)),
    ...relationships.map((r) => remoteProvider.saveRelationship(r)),
    ...timelineEvents.map((e) => remoteProvider.saveTimelineEvent(e)),
    ...(observations.length > 0 ? [remoteProvider.saveObservations(observations)] : []),
    ...commitments.map((c) => remoteProvider.saveCommitment(c)),
    ...habits.map((h) => remoteProvider.saveHabit(h)),
    ...habitLogs.map((l) => remoteProvider.saveHabitLog(l)),
    ...memories.map((m) => remoteProvider.savePersonalMemory(m)),
  ]);

  localStorage.setItem(MIGRATION_FLAG, 'true');
  console.log('[Rwive] Migration to Supabase complete ✓');
}
