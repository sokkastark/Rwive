import type { Project, Activity, Relationship, Observation } from '../types/memory';
import type { MorningBrief, EveningReview } from '../types/briefing';
import { CompanionEngine } from './CompanionEngine';
import { ObservationRanker } from './ObservationRanker';
import { ReflectionPromptEngine } from './ReflectionPromptEngine';

export class BriefingEngine {
  // Generates a structured Morning Briefing using the current memory state
  static generateMorningBrief(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    currentObservations: Observation[],
    referenceDate: string = new Date().toISOString()
  ): MorningBrief {
    // Generate new observations and sync them with previous states
    const rawObs = CompanionEngine.generateObservations(projects, activities, relationships, referenceDate);
    const syncedObs = CompanionEngine.syncObservations(currentObservations, rawObs);
    const ranked = ObservationRanker.rank(syncedObs);

    // Group ranked active observations
    const priorities = ranked.filter((obs) => obs.severity === 'critical' || obs.category === 'family');
    const momentum = ranked.filter((obs) => obs.type === 'project_momentum' || obs.type === 'learning_consistent');
    
    // Reminders are active alerts that aren't critical and aren't family category
    const reminders = ranked.filter(
      (obs) => obs.severity === 'warning' && obs.category !== 'family' && obs.type !== 'project_momentum'
    );

    // Select the focus recommendation (preferring inactive projects first)
    const inactiveProjObs = ranked.find((obs) => obs.type === 'project_inactive');
    let focusRecommendation: MorningBrief['focusRecommendation'] = undefined;

    if (inactiveProjObs) {
      const proj = projects.find((p) => p.id === inactiveProjObs.relatedEntityId);
      if (proj) {
        focusRecommendation = {
          title: proj.name,
          reason: inactiveProjObs.description,
          relatedEntityId: proj.id,
        };
      }
    }

    return {
      generatedAt: referenceDate,
      priorities,
      momentum,
      reminders,
      focusRecommendation,
    };
  }

  // Generates a structured Evening Review summarizing accomplishments, momentum changes, and reflection prompts
  static generateEveningReview(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[],
    currentObservations: Observation[],
    referenceDate: string = new Date().toISOString()
  ): EveningReview {
    // Generate observations and sync
    const rawObs = CompanionEngine.generateObservations(projects, activities, relationships, referenceDate);
    const syncedObs = CompanionEngine.syncObservations(currentObservations, rawObs);
    const ranked = ObservationRanker.rank(syncedObs);

    // Filter activities logged today (comparing YYYY-MM-DD strings)
    const refDateStr = referenceDate.split('T')[0];
    const completed = activities.filter((act) => act.timestamp.split('T')[0] === refDateStr);

    // Filter momentum changes and unresolved warnings/critical alerts
    const momentumChanges = ranked.filter((obs) => obs.type === 'project_momentum');
    const unresolvedItems = ranked.filter((obs) => obs.severity === 'critical' || obs.severity === 'warning');

    // Pick a context-aware reflection prompt
    const reflectionPrompt = ReflectionPromptEngine.getPrompt(completed, ranked, projects, relationships);

    return {
      generatedAt: referenceDate,
      completed,
      momentumChanges,
      unresolvedItems,
      reflectionPrompt,
    };
  }
}
