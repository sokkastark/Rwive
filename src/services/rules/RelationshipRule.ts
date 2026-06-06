import type { Rule } from './Rule';
import type { Project, Activity, Relationship, Observation } from '../../types/memory';

export class RelationshipRule implements Rule {
  name = 'RelationshipRule';

  evaluate(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    referenceDate: string
  ): Observation[] {
    const observations: Observation[] = [];
    const ref = new Date(referenceDate);
    const utcRef = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

    relationships.forEach((rel) => {
      const lastInt = new Date(rel.lastInteractionDate);
      const utcLastInt = Date.UTC(lastInt.getFullYear(), lastInt.getMonth(), lastInt.getDate());
      const days = Math.floor((utcRef - utcLastInt) / (1000 * 60 * 60 * 24));

      if (days > 7) {
        const category = rel.type.toLowerCase() === 'family' ? 'family' : 'relationship';

        observations.push({
          id: `obs_rel_warn_${rel.id}_${utcRef}`,
          type: 'relationship_overdue',
          category,
          status: 'active',
          severity: 'warning',
          title: `Stay Connected: ${rel.name}`,
          description: `It has been ${days} days since your last interaction with ${rel.name}.`,
          suggestedAction: `Reach out to ${rel.name} with a quick text or a phone call to catch up.`,
          relatedEntityId: rel.id,
          timestamp: referenceDate,
        });
      }
    });

    return observations;
  }
}
