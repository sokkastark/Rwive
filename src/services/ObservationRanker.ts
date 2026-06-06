import type { Observation } from '../types/memory';

export class ObservationRanker {
  // Filters out non-active observations and sorts the remaining by score descending
  static rank(observations: Observation[]): Observation[] {
    const active = observations.filter((obs) => obs.status === 'active');

    return active.sort((a, b) => {
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    });
  }

  private static calculateScore(obs: Observation): number {
    let score = 0;

    // Severity base weighting
    if (obs.severity === 'critical') {
      score += 100;
    } else if (obs.severity === 'warning') {
      score += 40;
    } else if (obs.severity === 'info') {
      score += 20;
    }

    // Category and Type specific weighting
    if (obs.category === 'family') {
      score += 80;
    } else if (obs.type === 'relationship_overdue') {
      score += 60;
    }

    return score;
  }
}
