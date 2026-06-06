import type { Observation, Activity, Project, Relationship } from '../types/memory';

export class ReflectionPromptEngine {
  // Selects a reflection prompt derived deterministically from the current state of activities and observations
  static getPrompt(
    todaysActivities: Activity[],
    rankedObservations: Observation[],
    projects: Project[],
    relationships: Relationship[]
  ): string {
    // 1. If no activities completed today
    if (todaysActivities.length === 0) {
      return 'What would you like tomorrow to look like?';
    }

    // 2. Unresolved inactivity warning
    const inactivityObs = rankedObservations.find(
      (obs) => obs.type === 'project_inactive'
    );
    if (inactivityObs) {
      const proj = projects.find((p) => p.id === inactivityObs.relatedEntityId);
      if (proj) {
        return `What is preventing progress on ${proj.name}?`;
      }
    }

    // 3. Overdue relationship warning
    const relObs = rankedObservations.find(
      (obs) => obs.type === 'relationship_overdue'
    );
    if (relObs) {
      const rel = relationships.find((r) => r.id === relObs.relatedEntityId);
      if (rel) {
        return `What has kept you from catching up with ${rel.name} recently?`;
      }
    }

    // 4. Highlight building momentum
    const momentumObs = rankedObservations.find(
      (obs) => obs.type === 'project_momentum'
    );
    if (momentumObs) {
      const proj = projects.find((p) => p.id === momentumObs.relatedEntityId);
      if (proj) {
        return `What contributed most to your progress on ${proj.name} today?`;
      }
    }

    // 5. General fallback prompts, selected deterministically based on date code
    const fallbacks = [
      'What was your biggest win today?',
      'What are you postponing right now?',
      'What deserves attention tomorrow?',
      'What are you grateful for today?',
    ];

    const todayStr = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash += todayStr.charCodeAt(i);
    }
    const index = hash % fallbacks.length;
    return fallbacks[index];
  }
}
