import type { Project, Activity, Relationship, Observation } from '../types/memory';
import { ProjectInactivityRule } from './rules/ProjectInactivityRule';
import { RelationshipRule } from './rules/RelationshipRule';
import { MomentumRule } from './rules/MomentumRule';
import type { Rule } from './rules/Rule';

export class CompanionEngine {
  private static rules: Rule[] = [
    new ProjectInactivityRule(),
    new RelationshipRule(),
    new MomentumRule(),
  ];

  // Runs all registered rules and returns new observations
  static generateObservations(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    referenceDate: string = new Date().toISOString()
  ): Observation[] {
    const observations: Observation[] = [];

    this.rules.forEach((rule) => {
      try {
        const ruleObs = rule.evaluate(projects, activities, relationships, referenceDate);
        observations.push(...ruleObs);
      } catch (err) {
        console.error(`Error executing rule ${rule.name}:`, err);
      }
    });

    return observations;
  }

  // Merges the new observations with the current list to preserve lifecycle states (dismissed, resolved)
  static syncObservations(
    currentObservations: Observation[],
    newObservations: Observation[]
  ): Observation[] {
    const resultMap = new Map<string, Observation>();

    // 1. First, retain all dismissed observations to respect user choice
    currentObservations.forEach((obs) => {
      if (obs.status === 'dismissed') {
        resultMap.set(obs.id, obs);
      }
    });

    // 2. Process all newly generated observations
    newObservations.forEach((newObs) => {
      // If already dismissed, keep it dismissed (ignore the newly generated active state)
      if (resultMap.has(newObs.id)) {
        return;
      }

      // Check if it was already active
      const existingActive = currentObservations.find(
        (obs) => obs.id === newObs.id && obs.status === 'active'
      );

      if (existingActive) {
        resultMap.set(newObs.id, existingActive);
      } else {
        resultMap.set(newObs.id, { ...newObs, status: 'active' });
      }
    });

    // 3. Mark any previously active observations that are no longer generated as resolved
    currentObservations.forEach((oldObs) => {
      if (oldObs.status === 'active') {
        const isStillGenerated = newObservations.some((newObs) => newObs.id === oldObs.id);
        if (!isStillGenerated) {
          resultMap.set(oldObs.id, { ...oldObs, status: 'resolved' });
        }
      }
    });

    return Array.from(resultMap.values());
  }
}
