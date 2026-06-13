import { parseCheckInText } from './ruleParser';

describe('ruleParser', () => {
  const mockProjects = [
    { id: '1', name: 'ZenRide' },
    { id: '2', name: 'Portfolio' }
  ];

  const mockRelationships = [
    { id: '101', name: 'Jahnavi' },
    { id: '102', name: 'Alex' }
  ];

  test('detects habit candidate', () => {
    const res = parseCheckInText('drink ash gourd juice daily', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('habit');
    expect(res?.title).toBe('Drink ash gourd juice');
    expect(res?.frequency).toBe('daily');
  });

  test('detects commitment candidate with minutes', () => {
    const res = parseCheckInText('need to post on LinkedIn in 10 mins', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('commitment');
    expect(res?.title).toBe('Post on LinkedIn');
    expect(res?.dueText).toBe('in 10 minutes');
  });

  test('detects relationship follow-up with active contact name', () => {
    const res = parseCheckInText('call Jahnavi this evening', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('relationship_followup');
    expect(res?.relationshipName).toBe('Jahnavi');
    expect(res?.relationshipId).toBe('101');
    expect(res?.dueText).toBe('This Evening');
  });

  test('detects relationship follow-up with family relationship term', () => {
    const res = parseCheckInText('need to call mom tomorrow', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('relationship_followup');
    expect(res?.relationshipName).toBe('Mom');
    expect(res?.dueText).toBe('Tomorrow');
  });

  test('detects reflection with emotional keyword', () => {
    const res = parseCheckInText('feeling proud today. Rwive is finally live.', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('reflection');
    expect(res?.emotion).toBe('Proud');
    expect(res?.reflectionText).toBe('Rwive is finally live.');
  });

  test('detects activity log and links project', () => {
    const res = parseCheckInText('worked on ZenRide dashboard today', mockProjects, mockRelationships);
    expect(res).not.toBeNull();
    expect(res?.type).toBe('activity');
    expect(res?.projectName).toBe('ZenRide');
    expect(res?.projectId).toBe('1');
  });
});
