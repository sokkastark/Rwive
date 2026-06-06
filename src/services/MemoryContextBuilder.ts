import type { Project, Activity, Relationship } from '../types/memory';

export class MemoryContextBuilder {
  static build(
    projects: Project[],
    activities: Activity[],
    relationships: Relationship[]
  ): string {
    let context = 'User Profile & Current Life State:\n\n';

    // 1. Projects
    context += '--- PROJECTS ---\n';
    if (projects.length === 0) {
      context += 'No active projects currently logged.\n';
    } else {
      projects.forEach((proj) => {
        context += `- Project: ${proj.name}\n`;
        context += `  ID: ${proj.id}\n`;
        context += `  Status: ${proj.status}\n`;
        context += `  Health: ${proj.health}\n`;
        context += `  Momentum: ${proj.momentum}\n`;
        if (proj.description) {
          context += `  Description: ${proj.description}\n`;
        }
        
        // Find recent activities for this project
        const projActivities = activities
          .filter((act) => act.projectId === proj.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3); // top 3

        if (projActivities.length > 0) {
          context += `  Recent Activities:\n`;
          projActivities.forEach((act) => {
            const dateStr = act.timestamp.split('T')[0];
            context += `    * [${dateStr}] ${act.description}\n`;
          });
        }
        context += '\n';
      });
    }

    // 2. Relationships
    context += '\n--- KEY RELATIONSHIPS ---\n';
    if (relationships.length === 0) {
      context += 'No key relationships currently logged.\n';
    } else {
      relationships.forEach((rel) => {
        const dateStr = rel.lastInteractionDate.split('T')[0];
        context += `- Person: ${rel.name}\n`;
        context += `  Type: ${rel.type}\n`;
        context += `  Last Interaction: ${dateStr}\n`;
        if (rel.notes) {
          context += `  Notes: ${rel.notes}\n`;
        }
        context += '\n';
      });
    }

    // 3. Overall Activity Summary
    context += '\n--- RECENT HISTORY OVERVIEW ---\n';
    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // top 5 overall

    if (recentActivities.length === 0) {
      context += 'No recent activities recorded.\n';
    } else {
      recentActivities.forEach((act) => {
        const proj = projects.find((p) => p.id === act.projectId);
        const projName = proj ? proj.name : 'Unknown Project';
        const dateStr = act.timestamp.split('T')[0];
        context += `* [${dateStr}] [${projName}] ${act.description}\n`;
      });
    }

    return context;
  }
}
