import type { Project, Activity, Relationship, Observation } from '../../types/memory.ts';

export interface Rule {
  name: string;
  evaluate(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    referenceDate: string
  ): Observation[];
}
