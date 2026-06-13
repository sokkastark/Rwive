export interface ParsedCandidate {
  type: 'commitment' | 'habit' | 'activity' | 'reflection' | 'relationship_followup';
  title: string;
  confidence: 'High (Rule Match)' | 'Medium (Keyword Match)';
  // For commitments / reminders / relationship followups
  dueAt?: string; // ISO string
  dueText?: string;
  projectId?: string;
  projectName?: string;
  relationshipId?: string;
  relationshipName?: string;
  actionWord?: string; // e.g. "Call", "Meet", "Fix"
  // For habits
  frequency?: 'daily' | 'weekly';
  // For reflections
  emotion?: string;
  reflectionText?: string;
}

export function parseCheckInText(
  text: string,
  existingProjects: { id: string; name: string }[],
  existingRelationships: { id: string; name: string }[]
): ParsedCandidate | null {
  const trimmed = text.trim();
  if (trimmed.length < 5) return null;

  const lower = trimmed.toLowerCase();

  // 1. Check for Habit
  // Keywords: daily, every day, every morning, every evening, weekly, every sunday, etc.
  const habitKeywords = [
    'daily', 'every day', 'everyday', 'every morning', 'every evening', 'every night',
    'weekly', 'every sunday', 'every monday', 'every tuesday', 'every wednesday',
    'every thursday', 'every friday', 'every saturday'
  ];
  
  const matchedHabitKey = habitKeywords.find(key => lower.includes(key));
  if (matchedHabitKey) {
    let cleanTitle = trimmed.replace(new RegExp(matchedHabitKey, 'gi'), '').trim();
    // Clean common prefixes
    cleanTitle = cleanTitle.replace(/^(want to|start|track|do|drink|eat|practice|go to|have)\s+/i, '');
    cleanTitle = cleanTitle.replace(/^[,\.\s\-]+|[,\.\s\-]+$/g, '').trim();
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const isWeekly = matchedHabitKey.includes('weekly') || 
                     matchedHabitKey.includes('sunday') || 
                     matchedHabitKey.includes('monday') || 
                     matchedHabitKey.includes('tuesday') || 
                     matchedHabitKey.includes('wednesday') || 
                     matchedHabitKey.includes('thursday') || 
                     matchedHabitKey.includes('friday') || 
                     matchedHabitKey.includes('saturday');

    return {
      type: 'habit',
      title: cleanTitle || 'New Habit',
      confidence: 'High (Rule Match)',
      frequency: isWeekly ? 'weekly' : 'daily'
    };
  }

  // 2. Check for Relationship Follow-up
  // Check for terms like mom, sister, grandmother, father, etc. or active relationship names
  const relationshipTerms = [
    'mom', 'mother', 'dad', 'father', 'sister', 'brother', 
    'grandmother', 'grandma', 'grandfather', 'grandpa', 'uncle', 'aunt'
  ];
  
  const relActions = ['call', 'visit', 'talk to', 'meet', 'catch up with', 'text', 'message'];
  const hasRelAction = relActions.find(act => lower.includes(act));
  
  // Find if any existing relationship name is mentioned
  const matchedRel = existingRelationships.find(r => lower.includes(r.name.toLowerCase()));
  const hasRelTerm = relationshipTerms.find(term => new RegExp(`\\b${term}\\b`, 'i').test(lower));

  if (hasRelAction && (matchedRel || hasRelTerm)) {
    const targetName = matchedRel ? matchedRel.name : (hasRelTerm ? hasRelTerm.charAt(0).toUpperCase() + hasRelTerm.slice(1) : 'Contact');
    const action = hasRelAction.charAt(0).toUpperCase() + hasRelAction.slice(1);
    
    // Parse time
    let dueAt = new Date();
    let dueText = 'Today';
    
    if (lower.includes('this evening')) {
      dueAt.setHours(19, 0, 0, 0);
      dueText = 'This Evening';
    } else if (lower.includes('tomorrow')) {
      dueAt.setDate(dueAt.getDate() + 1);
      dueAt.setHours(12, 0, 0, 0);
      dueText = 'Tomorrow';
    } else if (lower.includes('sunday')) {
      // Find next Sunday
      const today = dueAt.getDay();
      const diff = (7 - today) % 7 || 7;
      dueAt.setDate(dueAt.getDate() + diff);
      dueAt.setHours(12, 0, 0, 0);
      dueText = 'This Sunday';
    } else if (lower.includes('next week')) {
      dueAt.setDate(dueAt.getDate() + 7);
      dueText = 'Next Week';
    } else {
      dueAt.setHours(18, 0, 0, 0); // default to 6 PM
    }

    return {
      type: 'relationship_followup',
      title: `${action} ${targetName}`,
      confidence: 'High (Rule Match)',
      dueAt: dueAt.toISOString(),
      dueText,
      relationshipId: matchedRel ? matchedRel.id : undefined,
      relationshipName: targetName,
      actionWord: action
    };
  }

  // 3. Check for Commitment / Reminder
  const commitmentKeywords = [
    'need to', 'todo', 'remind me to', 'schedule', 'must', 'have to', 'in 10 mins', 'in 10 minutes',
    'in 5 mins', 'in 5 minutes', 'in 30 mins', 'in 30 minutes', 'tomorrow', 'today', 'fix ', 'pay ', 'buy '
  ];
  
  const hasCommitmentKey = commitmentKeywords.some(key => lower.includes(key)) || /\bin \d+ (mins|minutes)\b/.test(lower);
  
  if (hasCommitmentKey) {
    let cleanTitle = trimmed;
    cleanTitle = cleanTitle.replace(/^(need to|todo|remind me to|schedule|must|have to)\s+/i, '');
    
    let dueAt = new Date();
    let dueText = 'Today';

    const minMatch = lower.match(/\bin (\d+) (mins|minutes)\b/);
    if (minMatch) {
      const mins = parseInt(minMatch[1], 10);
      dueAt.setMinutes(dueAt.getMinutes() + mins);
      dueText = `in ${mins} minutes`;
      cleanTitle = cleanTitle.replace(new RegExp(`\\bin ${mins} (mins|minutes)\\b`, 'gi'), '');
    } else if (lower.includes('tomorrow')) {
      dueAt.setDate(dueAt.getDate() + 1);
      dueAt.setHours(12, 0, 0, 0);
      dueText = 'Tomorrow';
      cleanTitle = cleanTitle.replace(/tomorrow/gi, '');
    } else if (lower.includes('today')) {
      dueAt.setHours(18, 0, 0, 0);
      dueText = 'Today';
      cleanTitle = cleanTitle.replace(/today/gi, '');
    } else {
      dueAt.setHours(18, 0, 0, 0);
    }

    cleanTitle = cleanTitle.replace(/^[,\.\s\-]+|[,\.\s\-]+$/g, '').trim();
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // Try to find a matching project to link
    const matchedProj = existingProjects.find(p => lower.includes(p.name.toLowerCase()));

    return {
      type: 'commitment',
      title: cleanTitle || 'New Commitment',
      confidence: 'High (Rule Match)',
      dueAt: dueAt.toISOString(),
      dueText,
      projectId: matchedProj ? matchedProj.id : undefined,
      projectName: matchedProj ? matchedProj.name : undefined
    };
  }

  // 4. Check for Reflection
  // Keywords: feeling, excited, happy, sad, worried, grateful, proud, anxious, angry, frustrated
  const reflectionKeywords = ['feeling', 'excited', 'happy', 'sad', 'worried', 'grateful', 'proud', 'anxious', 'angry', 'frustrated'];
  const matchedEmotion = reflectionKeywords.find(key => lower.includes(key));
  
  if (matchedEmotion) {
    let cleanText = trimmed;
    // Extract everything after feeling/emotion if applicable
    const idx = lower.indexOf(matchedEmotion);
    if (idx >= 0) {
      cleanText = trimmed.slice(idx + matchedEmotion.length).trim();
      // clean leading punctuation
      cleanText = cleanText.replace(/^[,\.\s\-]+|[,\.\s\-]+$/g, '').trim();
    }
    
    // Capitalize
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    const emotionStr = matchedEmotion.charAt(0).toUpperCase() + matchedEmotion.slice(1);

    return {
      type: 'reflection',
      title: `Reflection (${emotionStr})`,
      confidence: 'High (Rule Match)',
      emotion: emotionStr,
      reflectionText: cleanText || trimmed
    };
  }

  // 5. Check for Activity Log
  const activityKeywords = ['worked on', 'completed', 'designed', 'built', 'created', 'finished', 'fixed', 'updated'];
  const hasActivityKey = activityKeywords.some(key => lower.includes(key));
  
  if (hasActivityKey) {
    const matchedProj = existingProjects.find(p => lower.includes(p.name.toLowerCase()));
    
    let cleanTitle = trimmed;
    cleanTitle = cleanTitle.replace(/^(worked on|completed|designed|built|created|finished|fixed|updated)\s+/i, '');
    cleanTitle = cleanTitle.replace(/^[,\.\s\-]+|[,\.\s\-]+$/g, '').trim();
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    return {
      type: 'activity',
      title: cleanTitle || trimmed,
      confidence: 'Medium (Keyword Match)',
      projectId: matchedProj ? matchedProj.id : undefined,
      projectName: matchedProj ? matchedProj.name : undefined
    };
  }

  return null;
}
