import type { Rule } from './Rule';
import type { Project, Activity, Relationship, Observation } from '../../types/memory';

export class MomentumRule implements Rule {
  name = 'MomentumRule';

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
      // Find activities in the last 7 days for this project
      const projActs = activities.filter((act) => {
        if (act.projectId !== proj.id) return false;
        const actDate = new Date(act.timestamp);
        const utcAct = Date.UTC(actDate.getFullYear(), actDate.getMonth(), actDate.getDate());
        const days = Math.floor((utcRef - utcAct) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      });

      const count = projActs.length;
      const category = validCategories.includes(proj.lifeAreaId) 
        ? (proj.lifeAreaId as any) 
        : 'project';

      if (count >= 3) {
        observations.push({
          id: `obs_momentum_proj_${proj.id}_${utcRef}`,
          type: 'project_momentum',
          category,
          status: 'active',
          severity: 'info',
          title: `${proj.name} is building momentum`,
          description: `${proj.name} has received activity ${count} times in the last 7 days.`,
          suggestedAction: `Keep up the momentum by scheduling your next block of time.`,
          relatedEntityId: proj.id,
          timestamp: referenceDate,
        });

        if (proj.lifeAreaId === 'learning') {
          observations.push({
            id: `obs_learning_streak_${proj.id}_${utcRef}`,
            type: 'learning_consistent',
            category: 'learning',
            status: 'active',
            severity: 'info',
            title: `Consistent learning: ${proj.name}`,
            description: `You logged ${count} study sessions for ${proj.name} this week.`,
            suggestedAction: `Write down a one-sentence summary of your key learnings to consolidate memory.`,
            relatedEntityId: proj.id,
            timestamp: referenceDate,
          });
        }
      }
    });

    return observations;
  }
}
