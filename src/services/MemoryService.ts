import type {
  Project,
  Activity,
  Relationship,
  TimelineEvent,
  MemoryOperation,
  Commitment,
  Habit,
  HabitLog,
} from '../types/memory';

const OWNER_ID = 'stark';

export class MemoryService {
  // --- Health & Momentum Calculators ---

  static calculateHealth(lastActivityDate: string | null, referenceDate: string): 'green' | 'yellow' | 'red' {
    if (!lastActivityDate) return 'red';

    const d1 = new Date(lastActivityDate);
    const d2 = new Date(referenceDate);
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const days = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'green';
    if (days <= 7) return 'green';
    if (days <= 30) return 'yellow';
    return 'red';
  }

  static calculateMomentum(projectActivities: Activity[], referenceDate: string): 'high' | 'medium' | 'low' | 'dormant' {
    const ref = new Date(referenceDate);
    const utcRef = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

    let last7DaysCount = 0;
    let last30DaysCount = 0;

    projectActivities.forEach((act) => {
      const actDate = new Date(act.timestamp);
      const utcAct = Date.UTC(actDate.getFullYear(), actDate.getMonth(), actDate.getDate());
      const days = Math.floor((utcRef - utcAct) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        if (days <= 7) last7DaysCount++;
        if (days <= 30) last30DaysCount++;
      }
    });

    if (last7DaysCount >= 3) return 'high';
    if (last7DaysCount >= 1) return 'medium';
    if (last30DaysCount >= 1) return 'low';
    return 'dormant';
  }

  // --- Habit Streak Calculator ---

  static calculateStreak(logs: HabitLog[], referenceDate: string): number {
    const refDate = new Date(referenceDate);
    refDate.setHours(0, 0, 0, 0);

    const completedDates = new Set(
      logs.filter((l) => l.status === 'completed').map((l) => l.date)
    );

    let streak = 0;
    const cursor = new Date(refDate);

    while (true) {
      const dateStr = cursor.toISOString().split('T')[0];
      if (completedDates.has(dateStr)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // --- Core executeOperation ---

  static executeOperation(
    op: MemoryOperation,
    existingProjects: Project[],
    existingActivities: Activity[],
    existingRelationships: Relationship[],
    existingCommitments: Commitment[] = [],
    existingHabits: Habit[] = [],
    existingHabitLogs: HabitLog[] = [],
    referenceDate: string = new Date().toISOString()
  ): {
    projectsToSave: Project[];
    activitiesToSave: Activity[];
    relationshipsToSave: Relationship[];
    timelineEventsToSave: TimelineEvent[];
    commitmentsToSave: Commitment[];
    habitsToSave: Habit[];
    habitLogsToSave: HabitLog[];
  } {
    const result = {
      projectsToSave: [] as Project[],
      activitiesToSave: [] as Activity[],
      relationshipsToSave: [] as Relationship[],
      timelineEventsToSave: [] as TimelineEvent[],
      commitmentsToSave: [] as Commitment[],
      habitsToSave: [] as Habit[],
      habitLogsToSave: [] as HabitLog[],
    };

    const dateStr = op.date || referenceDate;

    // ---- Activity & Project Ops ----
    if (op.operation === 'LOG_ACTIVITY') {
      if (!op.project || !op.activity) {
        throw new Error('LOG_ACTIVITY requires "project" and "activity" fields.');
      }

      let project = existingProjects.find(
        (p) => p.id === op.project || p.name.toLowerCase() === op.project!.toLowerCase()
      );

      if (!project) {
        project = {
          id: crypto.randomUUID(),
          name: op.project,
          description: `Automatically created project for ${op.project}`,
          lifeAreaId: 'general',
          status: 'active',
          health: 'green',
          momentum: 'medium',
          createdAt: dateStr,
          updatedAt: dateStr,
        };
        result.projectsToSave.push(project);
        result.timelineEventsToSave.push({
          id: crypto.randomUUID(),
          projectId: project.id,
          type: 'created',
          title: 'Project Initialized',
          description: 'Project created via activity logging.',
          timestamp: dateStr,
        });
      }

      const newActivity: Activity = {
        id: crypto.randomUUID(),
        projectId: project.id,
        description: op.activity,
        timestamp: dateStr,
      };
      result.activitiesToSave.push(newActivity);

      const allProjActs = [
        ...existingActivities.filter((a) => a.projectId === project!.id),
        newActivity,
      ];

      const updatedProject: Project = {
        ...(result.projectsToSave.find((p) => p.id === project!.id) || project),
        health: this.calculateHealth(dateStr, referenceDate),
        momentum: this.calculateMomentum(allProjActs, referenceDate),
        updatedAt: dateStr,
      };

      const idx = result.projectsToSave.findIndex((p) => p.id === updatedProject.id);
      if (idx >= 0) {
        result.projectsToSave[idx] = updatedProject;
      } else {
        result.projectsToSave.push(updatedProject);
      }

      result.timelineEventsToSave.push({
          id: crypto.randomUUID(),
          projectId: updatedProject.id,
          type: 'activity',
          title: 'Activity Logged',
          description: op.activity,
          timestamp: dateStr,
        });
    }

    // ---- Create Project ----
    else if (op.operation === 'CREATE_PROJECT') {
      if (!op.project) throw new Error('CREATE_PROJECT requires "project" name.');

      const id = crypto.randomUUID();
      result.projectsToSave.push({
        id,
        name: op.project,
        description: op.notes || '',
        lifeAreaId: op.relationshipType || 'general',
        status: 'active',
        health: 'green',
        momentum: 'medium',
        createdAt: dateStr,
        updatedAt: dateStr,
      });

      result.timelineEventsToSave.push({
        id: crypto.randomUUID(),
        projectId: id,
        type: 'created',
        title: 'Project Created',
        description: op.notes || `Project ${op.project} created.`,
        timestamp: dateStr,
      });
    }

    // ---- Relationship Interaction ----
    else if (op.operation === 'LOG_RELATIONSHIP_INTERACTION') {
      if (!op.person) throw new Error('LOG_RELATIONSHIP_INTERACTION requires "person" field.');

      let rel = existingRelationships.find(
        (r) => r.name.toLowerCase() === op.person!.toLowerCase()
      );

      if (rel) {
        rel = { ...rel, lastInteractionDate: dateStr, notes: op.notes || rel.notes };
      } else {
        rel = {
          id: crypto.randomUUID(),
          name: op.person,
          type: op.relationshipType || 'Family',
          lastInteractionDate: dateStr,
          notes: op.notes,
          preferredContactFrequencyDays: 7,
        };
      }
      result.relationshipsToSave.push(rel);
    }

    // ---- Commitment Ops ----
    else if (op.operation === 'CREATE_COMMITMENT') {
      if (!op.commitmentTitle || !op.dueAt) {
        throw new Error('CREATE_COMMITMENT requires "commitmentTitle" and "dueAt".');
      }
      result.commitmentsToSave.push({
        id: crypto.randomUUID(),
        title: op.commitmentTitle,
        dueAt: op.dueAt,
        status: 'pending',
        followUpStatus: 'pending',
        projectId: op.projectId,
        relationshipId: op.relationshipId,
        ownerId: OWNER_ID,
      });
    }

    else if (op.operation === 'COMPLETE_COMMITMENT') {
      if (!op.commitmentId) throw new Error('COMPLETE_COMMITMENT requires "commitmentId".');
      const c = existingCommitments.find((c) => c.id === op.commitmentId);
      if (!c) throw new Error(`Commitment ${op.commitmentId} not found.`);
      result.commitmentsToSave.push({
        ...c,
        status: 'completed',
        followUpStatus: 'resolved',
        outcomeNote: op.outcomeNote,
      });
    }

    else if (op.operation === 'SKIP_COMMITMENT') {
      if (!op.commitmentId) throw new Error('SKIP_COMMITMENT requires "commitmentId".');
      const c = existingCommitments.find((c) => c.id === op.commitmentId);
      if (!c) throw new Error(`Commitment ${op.commitmentId} not found.`);
      result.commitmentsToSave.push({
        ...c,
        status: 'skipped',
        followUpStatus: 'resolved',
        outcomeNote: op.outcomeNote,
      });
    }

    else if (op.operation === 'SNOOZE_COMMITMENT') {
      if (!op.commitmentId || !op.snoozedUntil) {
        throw new Error('SNOOZE_COMMITMENT requires "commitmentId" and "snoozedUntil".');
      }
      const c = existingCommitments.find((c) => c.id === op.commitmentId);
      if (!c) throw new Error(`Commitment ${op.commitmentId} not found.`);
      result.commitmentsToSave.push({
        ...c,
        snoozedUntil: op.snoozedUntil,
        followUpStatus: 'pending',
      });
    }

    // ---- Habit Ops ----
    else if (op.operation === 'CREATE_HABIT') {
      if (!op.habitTitle) throw new Error('CREATE_HABIT requires "habitTitle".');
      result.habitsToSave.push({
        id: crypto.randomUUID(),
        title: op.habitTitle,
        frequency: op.habitFrequency || 'daily',
        preferredTime: op.preferredTime || '08:00',
        streak: 0,
        ownerId: OWNER_ID,
      });
    }

    else if (op.operation === 'COMPLETE_HABIT') {
      if (!op.habitId) throw new Error('COMPLETE_HABIT requires "habitId".');
      const habit = existingHabits.find((h) => h.id === op.habitId);
      if (!habit) throw new Error(`Habit ${op.habitId} not found.`);

      const today = new Date(referenceDate).toISOString().split('T')[0];
      const newLog: HabitLog = {
        id: crypto.randomUUID(),
        habitId: habit.id,
        date: today,
        status: 'completed',
        ownerId: OWNER_ID,
      };
      result.habitLogsToSave.push(newLog);

      const allLogs = [
        ...existingHabitLogs.filter((l) => l.habitId === habit.id),
        newLog,
      ];
      const newStreak = this.calculateStreak(allLogs, referenceDate);

      result.habitsToSave.push({
        ...habit,
        streak: newStreak,
        lastCompletedAt: today,
      });
    }

    return result;
  }
}
