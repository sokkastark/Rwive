import { test } from 'node:test';
import assert from 'node:assert';
import { CompanionEngine } from './CompanionEngine';
import type { Project, Activity, Relationship, Observation } from '../types/memory';

test('CompanionEngine - Project Inactivity Rule', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const projects: Project[] = [
    {
      id: 'p_active',
      name: 'Aura 360',
      description: 'Active project',
      lifeAreaId: 'career',
      status: 'active',
      health: 'green',
      momentum: 'medium',
      createdAt: '2026-06-06T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    },
    {
      id: 'p_drifting',
      name: 'ZenRide',
      description: 'Drifting project',
      lifeAreaId: 'career',
      status: 'active',
      health: 'yellow',
      momentum: 'medium',
      createdAt: '2026-05-28T00:00:00.000Z',
      updatedAt: '2026-05-28T00:00:00.000Z', // 9 days inactive -> yellow warning
    },
    {
      id: 'p_dormant',
      name: 'Film Project',
      description: 'Dormant project',
      lifeAreaId: 'learning',
      status: 'active',
      health: 'red',
      momentum: 'dormant',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z', // 66 days inactive -> red critical
    },
  ];

  const obs = CompanionEngine.generateObservations(projects, [], [], refDate);

  // Checks
  const driftingObs = obs.find(o => o.relatedEntityId === 'p_drifting');
  assert.ok(driftingObs);
  assert.strictEqual(driftingObs.type, 'project_inactive');
  assert.strictEqual(driftingObs.severity, 'warning');
  assert.strictEqual(driftingObs.category, 'career');
  assert.strictEqual(driftingObs.suggestedAction.includes('Spend 15 minutes'), true);

  const dormantObs = obs.find(o => o.relatedEntityId === 'p_dormant');
  assert.ok(dormantObs);
  assert.strictEqual(dormantObs.type, 'project_inactive');
  assert.strictEqual(dormantObs.severity, 'critical');
  assert.strictEqual(dormantObs.category, 'learning');
  assert.strictEqual(dormantObs.suggestedAction.includes('Decide if'), true);

  const activeObs = obs.find(o => o.relatedEntityId === 'p_active');
  assert.strictEqual(activeObs, undefined);
});

test('CompanionEngine - Relationship Overdue Rule', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const relationships: Relationship[] = [
    {
      id: 'r_mom',
      name: 'Mother',
      type: 'Family',
      lastInteractionDate: '2026-05-28T12:00:00.000Z', // 9 days ago (> 7 days)
    },
    {
      id: 'r_wife',
      name: 'Wife',
      type: 'Family',
      lastInteractionDate: '2026-06-05T12:00:00.000Z', // 1 day ago
    }
  ];

  const obs = CompanionEngine.generateObservations([], [], relationships, refDate);

  const momObs = obs.find(o => o.relatedEntityId === 'r_mom');
  assert.ok(momObs);
  assert.strictEqual(momObs.type, 'relationship_overdue');
  assert.strictEqual(momObs.category, 'family');

  const wifeObs = obs.find(o => o.relatedEntityId === 'r_wife');
  assert.strictEqual(wifeObs, undefined);
});

test('CompanionEngine - Momentum Rule (Positive Observation)', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const projects: Project[] = [
    {
      id: 'p_streak',
      name: 'Anthropology Study',
      description: 'Study target',
      lifeAreaId: 'learning',
      status: 'active',
      health: 'green',
      momentum: 'high',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-06T00:00:00.000Z',
    }
  ];

  const activities: Activity[] = [
    { id: 'a1', projectId: 'p_streak', description: 'Read section 1', timestamp: '2026-06-05T12:00:00.000Z' },
    { id: 'a2', projectId: 'p_streak', description: 'Wrote summary', timestamp: '2026-06-04T12:00:00.000Z' },
    { id: 'a3', projectId: 'p_streak', description: 'Watched lecture', timestamp: '2026-06-02T12:00:00.000Z' },
  ];

  const obs = CompanionEngine.generateObservations(projects, activities, [], refDate);

  const momentumObs = obs.find(o => o.type === 'project_momentum');
  assert.ok(momentumObs);
  assert.strictEqual(momentumObs?.relatedEntityId, 'p_streak');
  assert.strictEqual(momentumObs?.severity, 'info');

  const consistentLearningObs = obs.find(o => o.type === 'learning_consistent');
  assert.ok(consistentLearningObs);
  assert.strictEqual(consistentLearningObs?.category, 'learning');
});

test('CompanionEngine - Observation Sync/Lifecycle', () => {
  const refDate = '2026-06-06T12:00:00.000Z';

  const currentObs: Observation[] = [
    {
      id: 'obs_1',
      type: 'project_inactive',
      category: 'project',
      status: 'active',
      severity: 'warning',
      title: 'Old Warning',
      description: 'Old inactive project warning',
      suggestedAction: 'Action',
      relatedEntityId: 'p1',
      timestamp: '2026-06-05T12:00:00.000Z'
    },
    {
      id: 'obs_2',
      type: 'project_inactive',
      category: 'project',
      status: 'dismissed',
      severity: 'warning',
      title: 'Dismissed Warning',
      description: 'Dismissed warning',
      suggestedAction: 'Action',
      relatedEntityId: 'p2',
      timestamp: '2026-06-05T12:00:00.000Z'
    }
  ];

  const newObs: Observation[] = [
    {
      id: 'obs_1',
      type: 'project_inactive',
      category: 'project',
      status: 'active',
      severity: 'warning',
      title: 'Old Warning',
      description: 'Old inactive project warning',
      suggestedAction: 'Action',
      relatedEntityId: 'p1',
      timestamp: refDate
    },
    {
      id: 'obs_2',
      type: 'project_inactive',
      category: 'project',
      status: 'active',
      severity: 'warning',
      title: 'Dismissed Warning',
      description: 'Dismissed warning',
      suggestedAction: 'Action',
      relatedEntityId: 'p2',
      timestamp: refDate
    },
    {
      id: 'obs_3',
      type: 'relationship_overdue',
      category: 'relationship',
      status: 'active',
      severity: 'warning',
      title: 'New Contact Warning',
      description: 'New warning description',
      suggestedAction: 'Action',
      relatedEntityId: 'r1',
      timestamp: refDate
    }
  ];

  const result = CompanionEngine.syncObservations(currentObs, newObs);

  const o1 = result.find(o => o.id === 'obs_1');
  assert.ok(o1);
  assert.strictEqual(o1.status, 'active');

  const o2 = result.find(o => o.id === 'obs_2');
  assert.ok(o2);
  assert.strictEqual(o2.status, 'dismissed');

  const o3 = result.find(o => o.id === 'obs_3');
  assert.ok(o3);
  assert.strictEqual(o3.status, 'active');

  const newObsNoObs1 = newObs.filter(o => o.id !== 'obs_1');
  const result2 = CompanionEngine.syncObservations(currentObs, newObsNoObs1);
  const o1Resolved = result2.find(o => o.id === 'obs_1');
  assert.ok(o1Resolved);
  assert.strictEqual(o1Resolved.status, 'resolved');
});
