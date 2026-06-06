import { test } from 'node:test';
import assert from 'node:assert';
import { ObservationRanker } from './ObservationRanker';
import { ReflectionPromptEngine } from './ReflectionPromptEngine';
import { BriefingEngine } from './BriefingEngine';
import type { Project, Activity, Relationship, Observation } from '../types/memory';

test('ObservationRanker prioritizes correctly', () => {
  const obsList: Observation[] = [
    {
      id: 'o_info',
      type: 'project_momentum',
      category: 'project',
      status: 'active',
      severity: 'info',
      title: 'Info',
      description: 'Info',
      suggestedAction: 'Action',
      relatedEntityId: 'p1',
      timestamp: '2026-06-06T00:00:00.000Z'
    },
    {
      id: 'o_crit',
      type: 'project_inactive',
      category: 'project',
      status: 'active',
      severity: 'critical',
      title: 'Crit',
      description: 'Crit',
      suggestedAction: 'Action',
      relatedEntityId: 'p2',
      timestamp: '2026-06-06T00:00:00.000Z'
    },
    {
      id: 'o_family',
      type: 'relationship_overdue',
      category: 'family',
      status: 'active',
      severity: 'warning',
      title: 'Family',
      description: 'Family',
      suggestedAction: 'Action',
      relatedEntityId: 'r1',
      timestamp: '2026-06-06T00:00:00.000Z'
    },
    {
      id: 'o_dismissed',
      type: 'project_inactive',
      category: 'project',
      status: 'dismissed', // Should be excluded from ranking output
      severity: 'critical',
      title: 'Dismissed',
      description: 'Dismissed',
      suggestedAction: 'Action',
      relatedEntityId: 'p3',
      timestamp: '2026-06-06T00:00:00.000Z'
    }
  ];

  const ranked = ObservationRanker.rank(obsList);

  // Checks
  assert.strictEqual(ranked.length, 3); // Dismissed is filtered out
  assert.strictEqual(ranked[0].id, 'o_family'); // Family is 40 (warning) + 80 (family) = 120 points
  assert.strictEqual(ranked[1].id, 'o_crit'); // Critical is 100 points
  assert.strictEqual(ranked[2].id, 'o_info'); // Info is 20 points
});

test('ReflectionPromptEngine context-aware rules', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const projects: Project[] = [
    { id: 'p1', name: 'Film Project', description: 'desc', lifeAreaId: 'learning', status: 'active', health: 'red', momentum: 'dormant', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' }
  ];
  
  // Case A: No activities today
  const promptA = ReflectionPromptEngine.getPrompt([], [], projects, []);
  assert.strictEqual(promptA, 'What would you like tomorrow to look like?');

  // Case B: Completed activities, but unresolved project inactivity warning exists
  const activities = [{ id: 'a1', projectId: 'p1', description: 'Did work', timestamp: refDate }];
  const observations: Observation[] = [
    { id: 'o1', type: 'project_inactive', category: 'learning', status: 'active', severity: 'critical', title: 'Title', description: 'Desc', suggestedAction: 'Action', relatedEntityId: 'p1', timestamp: refDate }
  ];
  const promptB = ReflectionPromptEngine.getPrompt(activities, observations, projects, []);
  assert.strictEqual(promptB, 'What is preventing progress on Film Project?');
});

test('BriefingEngine Morning Brief compiles correctly', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const projects: Project[] = [
    {
      id: 'p_dormant',
      name: 'Film Project',
      description: 'Dormant project',
      lifeAreaId: 'learning',
      status: 'active',
      health: 'red',
      momentum: 'dormant',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    }
  ];

  const brief = BriefingEngine.generateMorningBrief(projects, [], [], [], refDate);

  assert.strictEqual(brief.generatedAt, refDate);
  assert.ok(brief.focusRecommendation);
  assert.strictEqual(brief.focusRecommendation.title, 'Film Project');
  assert.strictEqual(brief.focusRecommendation.reason.includes('No activity recorded'), true);
});
