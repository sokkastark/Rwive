import type { Project, Activity, Relationship, TimelineEvent, MemoryOperation } from '../types/memory';

export class MemoryService {
  // Calculates project health based on the last activity date and reference date
  static calculateHealth(lastActivityDate: string | null, referenceDate: string): 'green' | 'yellow' | 'red' {
    if (!lastActivityDate) return 'red';
    
    const d1 = new Date(lastActivityDate);
    const d2 = new Date(referenceDate);
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const days = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'green'; // Future logs are green
    if (days <= 7) return 'green';
    if (days <= 30) return 'yellow';
    return 'red';
  }

  // Calculates project momentum based on activity frequency relative to a reference date
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

  // Processes a structured MemoryOperation and returns the list of entities to be saved
  static executeOperation(
    op: MemoryOperation,
    existingProjects: Project[],
    existingActivities: Activity[],
    existingRelationships: Relationship[],
    referenceDate: string = new Date().toISOString()
  ): {
    projectsToSave: Project[];
    activitiesToSave: Activity[];
    relationshipsToSave: Relationship[];
    timelineEventsToSave: TimelineEvent[];
  } {
    const projectsToSave: Project[] = [];
    const activitiesToSave: Activity[] = [];
    const relationshipsToSave: Relationship[] = [];
    const timelineEventsToSave: TimelineEvent[] = [];

    const dateStr = op.date || referenceDate;

    if (op.operation === 'LOG_ACTIVITY') {
      if (!op.project || !op.activity) {
        throw new Error('LOG_ACTIVITY operation requires "project" and "activity" fields.');
      }

      // Find project by ID first, then by name (case-insensitive)
      let project = existingProjects.find(
        (p) => p.id === op.project || p.name.toLowerCase() === op.project!.toLowerCase()
      );

      // If project doesn't exist, create it (auto-bootstrap project)
      if (!project) {
        project = {
          id: `project_${Math.random().toString(36).substring(2, 9)}`,
          name: op.project,
          description: `Automatically created project for ${op.project}`,
          lifeAreaId: 'general', // Default area
          status: 'active',
          health: 'green',
          momentum: 'medium',
          createdAt: dateStr,
          updatedAt: dateStr,
        };
        projectsToSave.push(project);
        
        // Add Created timeline event
        timelineEventsToSave.push({
          id: `timeline_${Math.random().toString(36).substring(2, 9)}`,
          projectId: project.id,
          type: 'created',
          title: 'Project Initialized',
          description: `Project created via activity logging.`,
          timestamp: dateStr,
        });
      }

      // Create new activity
      const newActivity: Activity = {
        id: `activity_${Math.random().toString(36).substring(2, 9)}`,
        projectId: project.id,
        description: op.activity,
        timestamp: dateStr,
      };
      activitiesToSave.push(newActivity);

      // Recalculate project health and momentum
      const allProjActs = [
        ...existingActivities.filter((a) => a.projectId === project!.id),
        newActivity,
      ];
      
      const updatedProject: Project = {
        ...(projectsToSave.find((p) => p.id === project!.id) || project),
        health: this.calculateHealth(dateStr, referenceDate),
        momentum: this.calculateMomentum(allProjActs, referenceDate),
        updatedAt: dateStr,
      };

      // Ensure updatedProject is in projectsToSave
      const idx = projectsToSave.findIndex((p) => p.id === updatedProject.id);
      if (idx >= 0) {
        projectsToSave[idx] = updatedProject;
      } else {
        projectsToSave.push(updatedProject);
      }

      // Add activity to timeline
      timelineEventsToSave.push({
        id: `timeline_${Math.random().toString(36).substring(2, 9)}`,
        projectId: updatedProject.id,
        type: 'activity',
        title: 'Activity Logged',
        description: op.activity,
        timestamp: dateStr,
      });
    } else if (op.operation === 'LOG_RELATIONSHIP_INTERACTION') {
      if (!op.person) {
        throw new Error('LOG_RELATIONSHIP_INTERACTION requires "person" field.');
      }

      let rel = existingRelationships.find(
        (r) => r.name.toLowerCase() === op.person!.toLowerCase()
      );

      if (rel) {
        rel = {
          ...rel,
          lastInteractionDate: dateStr,
          notes: op.notes || rel.notes,
        };
      } else {
        rel = {
          id: `rel_${Math.random().toString(36).substring(2, 9)}`,
          name: op.person,
          type: op.relationshipType || 'Family',
          lastInteractionDate: dateStr,
          notes: op.notes,
        };
      }
      relationshipsToSave.push(rel);
    } else if (op.operation === 'CREATE_PROJECT') {
      if (!op.project) {
        throw new Error('CREATE_PROJECT requires "project" name.');
      }

      const id = `project_${Math.random().toString(36).substring(2, 9)}`;
      const newProj: Project = {
        id,
        name: op.project,
        description: op.notes || '',
        lifeAreaId: op.relationshipType || 'general',
        status: 'active',
        health: 'green',
        momentum: 'medium',
        createdAt: dateStr,
        updatedAt: dateStr,
      };
      projectsToSave.push(newProj);

      timelineEventsToSave.push({
        id: `timeline_${Math.random().toString(36).substring(2, 9)}`,
        projectId: id,
        type: 'created',
        title: 'Project Created',
        description: op.notes || `Project ${op.project} created.`,
        timestamp: dateStr,
      });
    }

    return {
      projectsToSave,
      activitiesToSave,
      relationshipsToSave,
      timelineEventsToSave,
    };
  }
}
