'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Activity, Relationship, Observation, TimelineEvent } from '../types/memory';
import type { MorningBrief, EveningReview } from '../types/briefing';
import { LocalMemoryProvider } from '../memory/LocalMemoryProvider';
import { MemoryService } from '../services/MemoryService';
import { CompanionEngine } from '../services/CompanionEngine';
import { BriefingEngine } from '../services/BriefingEngine';

interface MemoryContextType {
  projects: Project[];
  activities: Activity[];
  relationships: Relationship[];
  observations: Observation[];
  timelineEvents: TimelineEvent[];
  morningBrief: MorningBrief | null;
  eveningReview: EveningReview | null;
  isLoading: boolean;
  addProject: (name: string, description: string, lifeAreaId: string) => Promise<void>;
  logActivity: (projectName: string, description: string) => Promise<void>;
  logRelationship: (name: string, type: string, notes?: string) => Promise<void>;
  dismissObservation: (id: string) => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [eveningReview, setEveningReview] = useState<EveningReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const provider = React.useMemo(() => new LocalMemoryProvider(), []);

  // Initialize and load data from LocalMemoryProvider
  useEffect(() => {
    async function loadData() {
      try {
        const projs = await provider.getProjects();
        const acts = await provider.getActivities();
        const rels = await provider.getRelationships();
        const obs = await provider.getObservations();
        const times = await provider.getTimelineEvents();

        setProjects(projs);
        setActivities(acts);
        setRelationships(rels);
        setTimelineEvents(times);

        // Run rules to generate fresh observations, then sync
        const freshObs = CompanionEngine.generateObservations(projs, acts, rels);
        const syncedObs = CompanionEngine.syncObservations(obs, freshObs);
        setObservations(syncedObs);
        await provider.saveObservations(syncedObs);

        // Generate Briefs
        const mBrief = BriefingEngine.generateMorningBrief(projs, acts, rels, syncedObs);
        const eReview = BriefingEngine.generateEveningReview(projs, acts, rels, syncedObs);
        setMorningBrief(mBrief);
        setEveningReview(eReview);
      } catch (err) {
        console.error('Error loading memory context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [provider]);

  // Recalculate briefs and observations when state changes, and persist observations
  const recalculateAndPersist = async (
    updatedProjs: Project[],
    updatedActs: Activity[],
    updatedRels: Relationship[],
    currentObsList: Observation[]
  ) => {
    const freshObs = CompanionEngine.generateObservations(updatedProjs, updatedActs, updatedRels);
    const synced = CompanionEngine.syncObservations(currentObsList, freshObs);
    
    setObservations(synced);
    await provider.saveObservations(synced);

    const mBrief = BriefingEngine.generateMorningBrief(updatedProjs, updatedActs, updatedRels, synced);
    const eReview = BriefingEngine.generateEveningReview(updatedProjs, updatedActs, updatedRels, synced);
    setMorningBrief(mBrief);
    setEveningReview(eReview);
  };

  const addProject = async (name: string, description: string, lifeAreaId: string) => {
    const op = {
      operation: 'CREATE_PROJECT' as const,
      project: name,
      notes: description,
      relationshipType: lifeAreaId,
    };

    const result = MemoryService.executeOperation(op, projects, activities, relationships);
    const newProj = result.projectsToSave[0];

    if (newProj) {
      await provider.saveProject(newProj);
      let newEvent: TimelineEvent | null = null;
      if (result.timelineEventsToSave[0]) {
        newEvent = result.timelineEventsToSave[0];
        await provider.saveTimelineEvent(newEvent);
      }

      const updated = [...projects, newProj];
      setProjects(updated);
      if (newEvent) {
        setTimelineEvents((prev) => [...prev, newEvent!]);
      }
      await recalculateAndPersist(updated, activities, relationships, observations);
    }
  };

  const logActivity = async (projectName: string, description: string) => {
    const op = {
      operation: 'LOG_ACTIVITY' as const,
      project: projectName,
      activity: description,
    };

    const result = MemoryService.executeOperation(op, projects, activities, relationships);
    const newAct = result.activitiesToSave[0];
    const updatedProj = result.projectsToSave[0];

    if (newAct) {
      await provider.saveActivity(newAct);
      let newEvent: TimelineEvent | null = null;
      if (result.timelineEventsToSave[0]) {
        newEvent = result.timelineEventsToSave[0];
        await provider.saveTimelineEvent(newEvent);
      }

      let updatedProjs = [...projects];
      if (updatedProj) {
        await provider.saveProject(updatedProj);
        const idx = updatedProjs.findIndex((p) => p.id === updatedProj.id);
        if (idx >= 0) {
          updatedProjs[idx] = updatedProj;
        } else {
          updatedProjs.push(updatedProj);
        }
      }

      const updatedActs = [...activities, newAct];
      setProjects(updatedProjs);
      setActivities(updatedActs);
      if (newEvent) {
        setTimelineEvents((prev) => [...prev, newEvent!]);
      }
      await recalculateAndPersist(updatedProjs, updatedActs, relationships, observations);
    }
  };

  const logRelationship = async (name: string, type: string, notes?: string) => {
    const op = {
      operation: 'LOG_RELATIONSHIP_INTERACTION' as const,
      person: name,
      relationshipType: type,
      notes,
    };

    const result = MemoryService.executeOperation(op, projects, activities, relationships);
    const updatedRel = result.relationshipsToSave[0];

    if (updatedRel) {
      await provider.saveRelationship(updatedRel);
      const updatedRels = [...relationships];
      const idx = updatedRels.findIndex((r) => r.id === updatedRel.id);
      if (idx >= 0) {
        updatedRels[idx] = updatedRel;
      } else {
        updatedRels.push(updatedRel);
      }
      setRelationships(updatedRels);
      await recalculateAndPersist(projects, activities, updatedRels, observations);
    }
  };

  const dismissObservation = async (id: string) => {
    const updatedObs = observations.map((obs) => {
      if (obs.id === id) {
        return { ...obs, status: 'dismissed' as const };
      }
      return obs;
    });
    setObservations(updatedObs);
    await provider.saveObservations(updatedObs);
    
    // Refresh briefs
    const mBrief = BriefingEngine.generateMorningBrief(projects, activities, relationships, updatedObs);
    const eReview = BriefingEngine.generateEveningReview(projects, activities, relationships, updatedObs);
    setMorningBrief(mBrief);
    setEveningReview(eReview);
  };

  return (
    <MemoryContext.Provider
      value={{
        projects,
        activities,
        relationships,
        observations,
        timelineEvents,
        morningBrief,
        eveningReview,
        isLoading,
        addProject,
        logActivity,
        logRelationship,
        dismissObservation,
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
