export interface LifeArea {
  id: string; // e.g. 'family', 'health', 'career', 'learning', 'creative', 'finance', 'relationships'
  name: string;
  color: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lifeAreaId: string;
  status: 'active' | 'paused' | 'completed';
  health: 'green' | 'yellow' | 'red';
  momentum: 'high' | 'medium' | 'low' | 'dormant';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Activity {
  id: string;
  projectId: string;
  description: string;
  timestamp: string; // ISO date string
}

export interface Relationship {
  id: string;
  name: string;
  type: string; // e.g., 'Family', 'Friend', 'Work'
  lastInteractionDate: string; // ISO date string
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: 'created' | 'status_change' | 'milestone' | 'activity';
  title: string;
  description: string;
  timestamp: string; // ISO date string
}

export interface MemorySnapshot {
  timestamp: string; // ISO date string
  activeProjectsCount: number;
  neglectedProjectsCount: number;
  lifeAreaStatuses: Record<string, 'active' | 'inactive' | 'moderate'>;
}

export interface MemoryOperation {
  operation: 'LOG_ACTIVITY' | 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'LOG_RELATIONSHIP_INTERACTION';
  project?: string;
  activity?: string;
  status?: 'active' | 'paused' | 'completed';
  date?: string;
  person?: string;
  relationshipType?: string;
  notes?: string;
}

export interface Observation {
  id: string;
  type: 'project_inactive' | 'project_momentum' | 'relationship_overdue' | 'relationship_active' | 'learning_consistent';
  category: 'project' | 'relationship' | 'health' | 'learning' | 'family' | 'career' | 'general';
  status: 'active' | 'dismissed' | 'resolved';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  suggestedAction: string;
  relatedEntityId: string;
  timestamp: string; // ISO date string
}

