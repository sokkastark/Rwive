import type { Rule } from './Rule';
import type { Project, Activity, Relationship, Observation } from '../../types/memory';

export class ProjectInactivityRule implements Rule {
  name = 'ProjectInactivityRule';

  evaluate(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    referenceDate: string
  ): Observation[] {
    const observations: Observation[] = [];
    const ref = new Date(referenceDate);
    const utcRef = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

    const validCategories = ['project', 'relationship', 'health', 'learning', 'family', 'career'];

    projects.forEach((proj) => {
      if (proj.status !== 'active') return;

      const updated = new Date(proj.updatedAt);
      const utcUpdated = Date.UTC(updated.getFullYear(), updated.getMonth(), updated.getDate());
      const days = Math.floor((utcRef - utcUpdated) / (1000 * 60 * 60 * 24));

      const category = validCategories.includes(proj.lifeAreaId) 
        ? (proj.lifeAreaId as any) 
        : 'project';

      if (days >= 31) {
        observations.push({
          id: `obs_inactive_crit_${proj.id}_${utcRef}`,
          type: 'project_inactive',
          category,
          status: 'active',
          severity: 'critical',
          title: `${proj.name} has been inactive`,
          description: `No activity recorded for ${days} days.`,
          suggestedAction: `Decide if ${proj.name} should be paused or split into a smaller, 10-minute task.`,
          relatedEntityId: proj.id,
          timestamp: referenceDate,
        });
      } else if (days >= 8) {
        observations.push({
          id: `obs_inactive_warn_${proj.id}_${utcRef}`,
          type: 'project_inactive',
          category,
          status: 'active',
          severity: 'warning',
          title: `${proj.name} is drifting`,
          description: `No activity recorded for ${days} days.`,
          suggestedAction: `Spend 15 minutes reviewing the current state or planning the next milestone.`,
          relatedEntityId: proj.id,
          timestamp: referenceDate,
        });
      }
    });

    return observations;
  }
}
