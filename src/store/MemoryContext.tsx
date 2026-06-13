'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  Project,
  Activity,
  Relationship,
  Observation,
  TimelineEvent,
  Commitment,
  Habit,
  HabitLog,
  PersonalMemory,
  CompanionMessage,
  MessageSender,
  MessageType,
} from '../types/memory';
import type { MorningBrief, EveningReview } from '../types/briefing';
import { LocalMemoryProvider } from '../memory/LocalMemoryProvider';
import { MemoryService } from '../services/MemoryService';
import { CompanionEngine } from '../services/CompanionEngine';
import { BriefingEngine } from '../services/BriefingEngine';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import type { MemoryProvider as IMemoryProvider } from '../memory/MemoryProvider';
import { migrateLocalToSupabaseIfNeeded } from '../utils/localStorageMigration';

// ------------------------------------------------------------------
// Context shape
// ------------------------------------------------------------------
interface MemoryContextType {
  projects: Project[];
  activities: Activity[];
  relationships: Relationship[];
  observations: Observation[];
  timelineEvents: TimelineEvent[];
  commitments: Commitment[];
  habits: Habit[];
  habitLogs: HabitLog[];
  morningBrief: MorningBrief | null;
  eveningReview: EveningReview | null;
  isLoading: boolean;
  // Actions
  addProject: (name: string, description: string, lifeAreaId: string, aliases?: string[], keywords?: string[]) => Promise<void>;
  updateProject: (proj: Project) => Promise<void>;
  logActivity: (projectName: string, description: string) => Promise<void>;
  logRelationship: (name: string, type: string, notes?: string) => Promise<void>;
  dismissObservation: (id: string) => Promise<void>;
  addCommitment: (title: string, dueAt: string, projectId?: string, relationshipId?: string) => Promise<void>;
  completeCommitment: (id: string, outcomeNote?: string) => Promise<void>;
  skipCommitment: (id: string, outcomeNote?: string) => Promise<void>;
  snoozeCommitment: (id: string, snoozedUntil: string) => Promise<void>;
  markCommitmentAsked: (id: string) => Promise<void>;
  addHabit: (title: string, frequency: 'daily' | 'weekly', preferredTime: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  markHabitReminded: (habitId: string) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  updateTimelineEvent: (id: string, description: string) => Promise<void>;
  addReflection: (description: string, title?: string) => Promise<void>;
  addCustomObservation: (title: string, description: string, category?: Observation['category']) => Promise<void>;
  memories: PersonalMemory[];
  addPersonalMemory: (content: string, category?: string) => Promise<void>;
  deletePersonalMemory: (id: string) => Promise<void>;
  messages: CompanionMessage[];
  addCompanionMessage: (sender: MessageSender, type: MessageType, text: string) => Promise<void>;
  clearCompanionMessages: () => void;
  restoreBackup: (backupData: any) => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------
export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [eveningReview, setEveningReview] = useState<EveningReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memories, setMemories] = useState<PersonalMemory[]>([]);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);

  // Auto-detect Supabase vs Local — resolved at runtime so SSR is safe
  const provider = useMemo<IMemoryProvider>(() => {
    if (isSupabaseConfigured()) {
      // Dynamic import to avoid bundling Supabase client unless needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabase } = require('../lib/supabaseClient');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SupabaseMemoryProvider } = require('../memory/SupabaseMemoryProvider');
      return new SupabaseMemoryProvider(supabase);
    }
    return new LocalMemoryProvider();
  }, []);

  // ----------------------------------------------------------------
  // Initial load
  // ----------------------------------------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        // If using Supabase, migrate any existing localStorage data first (one-time)
        if (isSupabaseConfigured()) {
          await migrateLocalToSupabaseIfNeeded(provider);
        }

        const [projs, acts, rels, obs, times, comms, hbts, hlogs, mems] = await Promise.all([
          provider.getProjects().catch((err: any) => { console.error("Error loading projects:", err?.message || err); return []; }),
          provider.getActivities().catch((err: any) => { console.error("Error loading activities:", err?.message || err); return []; }),
          provider.getRelationships().catch((err: any) => { console.error("Error loading relationships:", err?.message || err); return []; }),
          provider.getObservations().catch((err: any) => { console.error("Error loading observations:", err?.message || err); return []; }),
          provider.getTimelineEvents().catch((err: any) => { console.error("Error loading timeline events:", err?.message || err); return []; }),
          provider.getCommitments().catch((err: any) => { console.error("Error loading commitments:", err?.message || err); return []; }),
          provider.getHabits().catch((err: any) => { console.error("Error loading habits:", err?.message || err); return []; }),
          provider.getHabitLogs().catch((err: any) => { console.error("Error loading habit logs:", err?.message || err); return []; }),
          provider.getPersonalMemories().catch((err: any) => { console.warn("Memories table not found or empty (ignoring):", err?.message || err); return []; }),
        ]);

        setProjects(projs);
        setActivities(acts);
        setRelationships(rels);
        setTimelineEvents(times);
        setCommitments(comms);
        setHabits(hbts);
        setHabitLogs(hlogs);
        setMemories(mems);

        if (typeof window !== 'undefined') {
          const localMsgs = localStorage.getItem('rwive_companion_messages');
          if (localMsgs) {
            setMessages(JSON.parse(localMsgs));
          } else {
            // Default greeting
            const greet: CompanionMessage = {
              id: 'init-greet',
              sender: 'rwive',
              type: 'chat',
              text: "Hello Stark. What's up? Do you have something special today?",
              timestamp: new Date().toISOString(),
            };
            setMessages([greet]);
            localStorage.setItem('rwive_companion_messages', JSON.stringify([greet]));
          }
        }

        // Regenerate observations
        const freshObs = CompanionEngine.generateObservations(projs, acts, rels);
        const syncedObs = CompanionEngine.syncObservations(obs, freshObs);
        setObservations(syncedObs);
        await provider.saveObservations(syncedObs);

        // Generate briefs
        setMorningBrief(BriefingEngine.generateMorningBrief(projs, acts, rels, syncedObs));
        setEveningReview(BriefingEngine.generateEveningReview(projs, acts, rels, syncedObs));
      } catch (err: any) {
        console.error('Error loading memory context:', err?.message || err, err?.stack || err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [provider]);

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const recalculateObs = async (
    projs: Project[], acts: Activity[], rels: Relationship[], curObs: Observation[]
  ) => {
    const freshObs = CompanionEngine.generateObservations(projs, acts, rels);
    const synced = CompanionEngine.syncObservations(curObs, freshObs);
    setObservations(synced);
    await provider.saveObservations(synced);
    setMorningBrief(BriefingEngine.generateMorningBrief(projs, acts, rels, synced));
    setEveningReview(BriefingEngine.generateEveningReview(projs, acts, rels, synced));
  };

  // ----------------------------------------------------------------
  // Project / Activity / Relationship
  // ----------------------------------------------------------------
  const addProject = async (name: string, description: string, lifeAreaId: string, aliases?: string[], keywords?: string[]) => {
    const r = MemoryService.executeOperation(
      { operation: 'CREATE_PROJECT', project: name, notes: description, relationshipType: lifeAreaId },
      projects, activities, relationships
    );
    const newProj = r.projectsToSave[0];
    if (!newProj) return;
    newProj.aliases = aliases || [];
    newProj.keywords = keywords || [];
    await provider.saveProject(newProj);
    if (r.timelineEventsToSave[0]) await provider.saveTimelineEvent(r.timelineEventsToSave[0]);
    const updated = [...projects, newProj];
    setProjects(updated);
    if (r.timelineEventsToSave[0]) setTimelineEvents((p) => [...p, r.timelineEventsToSave[0]]);
    await recalculateObs(updated, activities, relationships, observations);
  };

  const updateProject = async (proj: Project) => {
    await provider.saveProject(proj);
    setProjects((prev) => prev.map((p) => p.id === proj.id ? proj : p));
  };

  const logActivity = async (projectName: string, description: string) => {
    const r = MemoryService.executeOperation(
      { operation: 'LOG_ACTIVITY', project: projectName, activity: description },
      projects, activities, relationships
    );
    const newAct = r.activitiesToSave[0];
    const updatedProj = r.projectsToSave[0];
    if (!newAct) return;
    await provider.saveActivity(newAct);
    if (r.timelineEventsToSave[0]) await provider.saveTimelineEvent(r.timelineEventsToSave[0]);
    let updatedProjs = [...projects];
    if (updatedProj) {
      await provider.saveProject(updatedProj);
      const idx = updatedProjs.findIndex((p) => p.id === updatedProj.id);
      updatedProjs = idx >= 0
        ? updatedProjs.map((p, i) => (i === idx ? updatedProj : p))
        : [...updatedProjs, updatedProj];
    }
    const updatedActs = [...activities, newAct];
    setProjects(updatedProjs);
    setActivities(updatedActs);
    if (r.timelineEventsToSave[0]) setTimelineEvents((p) => [...p, r.timelineEventsToSave[0]]);
    await recalculateObs(updatedProjs, updatedActs, relationships, observations);
  };

  const logRelationship = async (name: string, type: string, notes?: string) => {
    const r = MemoryService.executeOperation(
      { operation: 'LOG_RELATIONSHIP_INTERACTION', person: name, relationshipType: type, notes },
      projects, activities, relationships
    );
    const updatedRel = r.relationshipsToSave[0];
    if (!updatedRel) return;
    await provider.saveRelationship(updatedRel);
    const idx = relationships.findIndex((rel) => rel.id === updatedRel.id);
    const updatedRels = idx >= 0
      ? relationships.map((r, i) => (i === idx ? updatedRel : r))
      : [...relationships, updatedRel];
    setRelationships(updatedRels);
    await recalculateObs(projects, activities, updatedRels, observations);
  };

  const dismissObservation = async (id: string) => {
    const updated = observations.map((o) => o.id === id ? { ...o, status: 'dismissed' as const } : o);
    setObservations(updated);
    await provider.saveObservations(updated);
    setMorningBrief(BriefingEngine.generateMorningBrief(projects, activities, relationships, updated));
    setEveningReview(BriefingEngine.generateEveningReview(projects, activities, relationships, updated));
  };

  // ----------------------------------------------------------------
  // Commitments
  // ----------------------------------------------------------------
  const addCommitment = async (title: string, dueAt: string, projectId?: string, relationshipId?: string) => {
    const r = MemoryService.executeOperation(
      { operation: 'CREATE_COMMITMENT', commitmentTitle: title, dueAt, projectId, relationshipId },
      projects, activities, relationships, commitments, habits, habitLogs
    );
    const c = r.commitmentsToSave[0];
    if (!c) return;
    await provider.saveCommitment(c);
    setCommitments((prev) => [...prev, c]);
  };

  const _updateCommitment = async (id: string, op: 'COMPLETE_COMMITMENT' | 'SKIP_COMMITMENT' | 'SNOOZE_COMMITMENT', extra?: Partial<{ outcomeNote: string; snoozedUntil: string }>) => {
    const r = MemoryService.executeOperation(
      { operation: op, commitmentId: id, ...extra },
      projects, activities, relationships, commitments, habits, habitLogs
    );
    const updated = r.commitmentsToSave[0];
    if (!updated) return;
    await provider.saveCommitment(updated);
    setCommitments((prev) => prev.map((c) => c.id === id ? updated : c));
  };

  const completeCommitment = (id: string, outcomeNote?: string) =>
    _updateCommitment(id, 'COMPLETE_COMMITMENT', { outcomeNote });

  const skipCommitment = (id: string, outcomeNote?: string) =>
    _updateCommitment(id, 'SKIP_COMMITMENT', { outcomeNote });

  const snoozeCommitment = (id: string, snoozedUntil: string) =>
    _updateCommitment(id, 'SNOOZE_COMMITMENT', { snoozedUntil });

  const markCommitmentAsked = async (id: string) => {
    const c = commitments.find((c) => c.id === id);
    if (!c) return;
    const updated = { ...c, followUpStatus: 'asked' as const };
    await provider.saveCommitment(updated);
    setCommitments((prev) => prev.map((item) => item.id === id ? updated : item));
  };

  // ----------------------------------------------------------------
  // Habits
  // ----------------------------------------------------------------
  const addHabit = async (title: string, frequency: 'daily' | 'weekly', preferredTime: string) => {
    const r = MemoryService.executeOperation(
      { operation: 'CREATE_HABIT', habitTitle: title, habitFrequency: frequency, preferredTime },
      projects, activities, relationships, commitments, habits, habitLogs
    );
    const h = r.habitsToSave[0];
    if (!h) return;
    await provider.saveHabit(h);
    setHabits((prev) => [...prev, h]);
  };

  const completeHabit = async (habitId: string) => {
    const r = MemoryService.executeOperation(
      { operation: 'COMPLETE_HABIT', habitId },
      projects, activities, relationships, commitments, habits, habitLogs
    );
    if (r.habitLogsToSave[0]) {
      await provider.saveHabitLog(r.habitLogsToSave[0]);
      setHabitLogs((prev) => [...prev, r.habitLogsToSave[0]]);
    }
    if (r.habitsToSave[0]) {
      await provider.saveHabit(r.habitsToSave[0]);
      setHabits((prev) => prev.map((h) => h.id === habitId ? r.habitsToSave[0] : h));
    }
  };

  const markHabitReminded = async (habitId: string) => {
    const h = habits.find((h) => h.id === habitId);
    if (!h) return;
    const updated = { ...h, lastRemindedAt: new Date().toISOString() };
    await provider.saveHabit(updated);
    setHabits((prev) => prev.map((item) => item.id === habitId ? updated : item));
  };

  const deleteTimelineEvent = async (id: string) => {
    await provider.deleteTimelineEvent(id);
    setTimelineEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const updateTimelineEvent = async (id: string, description: string) => {
    const event = timelineEvents.find((e) => e.id === id);
    if (!event) return;
    const updated = { ...event, description };
    await provider.saveTimelineEvent(updated);
    setTimelineEvents((prev) => prev.map((e) => e.id === id ? updated : e));
  };

  const addReflection = async (description: string, title?: string) => {
    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      projectId: null,
      type: 'reflection',
      title: title || 'Reflection',
      description,
      timestamp: new Date().toISOString(),
    };
    await provider.saveTimelineEvent(newEvent);
    setTimelineEvents((prev) => [...prev, newEvent]);
  };

  const addCustomObservation = async (title: string, description: string, category: Observation['category'] = 'general') => {
    const newObs: Observation = {
      id: `custom_${crypto.randomUUID()}`,
      type: 'custom_commitment_reminder' as any,
      category,
      status: 'active',
      severity: 'info',
      title,
      description,
      suggestedAction: 'Dismiss when resolved.',
      relatedEntityId: '',
      timestamp: new Date().toISOString(),
    };
    const updated = [...observations, newObs];
    setObservations(updated);
    await provider.saveObservations(updated);
  };

  const addPersonalMemory = async (content: string, category: string = 'general') => {
    const newMem: PersonalMemory = {
      id: crypto.randomUUID(),
      content,
      category,
      createdAt: new Date().toISOString(),
    };
    await provider.savePersonalMemory(newMem);
    setMemories((prev) => [...prev, newMem]);
  };

  const deletePersonalMemory = async (id: string) => {
    await provider.deletePersonalMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const addCompanionMessage = async (sender: MessageSender, type: MessageType, text: string) => {
    const newMsg: CompanionMessage = {
      id: crypto.randomUUID(),
      sender,
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rwive_companion_messages', JSON.stringify(updated));
    }
  };

  const clearCompanionMessages = () => {
    const greet: CompanionMessage = {
      id: 'init-greet',
      sender: 'rwive',
      type: 'chat',
      text: 'Hello Stark. I am your companion. Tell me what is on your mind today, and I will help you track and remember it.',
      timestamp: new Date().toISOString(),
    };
    setMessages([greet]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rwive_companion_messages', JSON.stringify([greet]));
    }
  };

  const restoreBackup = async (data: any) => {
    if (data.projects) {
      await Promise.allSettled(data.projects.map((p: any) => provider.saveProject(p)));
      setProjects(data.projects);
    }
    if (data.activities) {
      await Promise.allSettled(data.activities.map((a: any) => provider.saveActivity(a)));
      setActivities(data.activities);
    }
    if (data.relationships) {
      await Promise.allSettled(data.relationships.map((r: any) => provider.saveRelationship(r)));
      setRelationships(data.relationships);
    }
    if (data.timelineEvents) {
      await Promise.allSettled(data.timelineEvents.map((e: any) => provider.saveTimelineEvent(e)));
      setTimelineEvents(data.timelineEvents);
    }
    if (data.observations) {
      await provider.saveObservations(data.observations);
      setObservations(data.observations);
    }
    if (data.commitments) {
      await Promise.allSettled(data.commitments.map((c: any) => provider.saveCommitment(c)));
      setCommitments(data.commitments);
    }
    if (data.habits) {
      await Promise.allSettled(data.habits.map((h: any) => provider.saveHabit(h)));
      setHabits(data.habits);
    }
    if (data.habitLogs) {
      await Promise.allSettled(data.habitLogs.map((l: any) => provider.saveHabitLog(l)));
      setHabitLogs(data.habitLogs);
    }
    if (data.memories) {
      await Promise.allSettled(data.memories.map((m: any) => provider.savePersonalMemory(m)));
      setMemories(data.memories);
    }
  };

  return (
    <MemoryContext.Provider
      value={{
        projects, activities, relationships, observations,
        timelineEvents, commitments, habits, habitLogs,
        morningBrief, eveningReview, isLoading,
        addProject, updateProject, logActivity, logRelationship, dismissObservation,
        addCommitment, completeCommitment, skipCommitment, snoozeCommitment, markCommitmentAsked,
        addHabit, completeHabit, markHabitReminded,
        deleteTimelineEvent, updateTimelineEvent, addReflection, addCustomObservation,
        memories, addPersonalMemory, deletePersonalMemory,
        messages, addCompanionMessage, clearCompanionMessages, restoreBackup,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};
