import { test } from 'node:test';
import assert from 'node:assert';
import { MemoryService } from './MemoryService';
import type { Project, Activity, Relationship } from '../types/memory';

test('MemoryService.calculateHealth', () => {
  const refDate = '2026-06-06T12:00:00.000Z';

  // Green: 0-7 days
  assert.strictEqual(MemoryService.calculateHealth('2026-06-06T00:00:00.000Z', refDate), 'green');
  assert.strictEqual(MemoryService.calculateHealth('2026-05-31T00:00:00.000Z', refDate), 'green');

  // Yellow: 8-30 days
  assert.strictEqual(MemoryService.calculateHealth('2026-05-29T00:00:00.000Z', refDate), 'yellow');
  assert.strictEqual(MemoryService.calculateHealth('2026-05-08T00:00:00.000Z', refDate), 'yellow');

  // Red: 31+ days
  assert.strictEqual(MemoryService.calculateHealth('2026-05-06T00:00:00.000Z', refDate), 'red');
  assert.strictEqual(MemoryService.calculateHealth('2026-01-01T00:00:00.000Z', refDate), 'red');
  assert.strictEqual(MemoryService.calculateHealth(null, refDate), 'red');
});

test('MemoryService.calculateMomentum', () => {
  const refDate = '2026-06-06T12:00:00.000Z';

  const activityAt = (daysAgo: number): Activity => {
    const d = new Date(refDate);
    d.setDate(d.getDate() - daysAgo);
    return {
      id: `act_${Math.random()}`,
      projectId: 'proj_1',
      description: 'Activity',
      timestamp: d.toISOString(),
    };
  };

  // High: >= 3 activities in last 7 days
  const highActs = [activityAt(1), activityAt(3), activityAt(5)];
  assert.strictEqual(MemoryService.calculateMomentum(highActs, refDate), 'high');

  // Medium: 1-2 activities in last 7 days
  const mediumActs = [activityAt(2), activityAt(15)];
  assert.strictEqual(MemoryService.calculateMomentum(mediumActs, refDate), 'medium');

  // Low: 0 activities in last 7 days, but at least 1 in last 30 days
  const lowActs = [activityAt(10), activityAt(20)];
  assert.strictEqual(MemoryService.calculateMomentum(lowActs, refDate), 'low');

  // Dormant: 0 in last 30 days
  const dormantActs = [activityAt(40)];
  assert.strictEqual(MemoryService.calculateMomentum(dormantActs, refDate), 'dormant');
});

test('MemoryService.executeOperation LOG_ACTIVITY', () => {
  const refDate = '2026-06-06T12:00:00.000Z';
  const existingProjects: Project[] = [
    {
      id: 'proj_1',
      name: 'ZenRide',
      description: 'Ride app',
      lifeAreaId: 'career',
      status: 'active',
      health: 'yellow',
      momentum: 'low',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    },
  ];

  const op = {
    operation: 'LOG_ACTIVITY' as const,
    project: 'ZenRide',
    activity: 'Updated dashboard UI',
    date: refDate,
  };

  const result = MemoryService.executeOperation(op, existingProjects, [], [], refDate);

  // Checks
  assert.strictEqual(result.activitiesToSave.length, 1);
  assert.strictEqual(result.activitiesToSave[0].description, 'Updated dashboard UI');
  assert.strictEqual(result.activitiesToSave[0].projectId, 'proj_1');

  assert.strictEqual(result.projectsToSave.length, 1);
  assert.strictEqual(result.projectsToSave[0].id, 'proj_1');
  assert.strictEqual(result.projectsToSave[0].health, 'green'); // becomes green due to activity today
  assert.strictEqual(result.projectsToSave[0].momentum, 'medium'); // 1 activity in last 7 days

  assert.strictEqual(result.timelineEventsToSave.length, 1);
  assert.strictEqual(result.timelineEventsToSave[0].projectId, 'proj_1');
  assert.strictEqual(result.timelineEventsToSave[0].type, 'activity');
});
