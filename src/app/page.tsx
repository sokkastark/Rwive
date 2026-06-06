'use client';

import React, { useState } from 'react';
import { MemoryProvider, useMemory } from '../store/MemoryContext';
import { CheckInPanel } from '../components/dashboard/CheckInPanel';
import { ProjectForm } from '../components/dashboard/ProjectForm';
import { RelationshipForm } from '../components/dashboard/RelationshipForm';
import { CommitmentForm } from '../components/dashboard/CommitmentForm';
import { HabitForm } from '../components/dashboard/HabitForm';
import { ProjectPanel } from '../components/dashboard/ProjectPanel';
import { RelationshipPanel } from '../components/dashboard/RelationshipPanel';
import { TimelinePanel } from '../components/dashboard/TimelinePanel';
import { TodayFocusPanel } from '../components/dashboard/TodayFocusPanel';
import { useReminderEngine } from '../hooks/useReminderEngine';
import { migrateLocalToSupabaseIfNeeded } from '../utils/localStorageMigration';
import { isSupabaseConfigured } from '../lib/supabaseClient';

type ModalKind = 'none' | 'project' | 'relationship' | 'commitment' | 'habit';

function DashboardContent() {
  const { isLoading, commitments, habits, habitLogs, markCommitmentAsked, markHabitReminded } = useMemory();
  const [showDetails, setShowDetails] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKind>('none');
  const [showFABMenu, setShowFABMenu] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  // Proactive reminder engine (60s background tick)
  useReminderEngine({
    commitments,
    habits,
    habitLogs,
    onCommitmentAsked: markCommitmentAsked,
    onHabitReminded: markHabitReminded,
  });

  const handleForceReload = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      } catch (err) {
        console.error('Error unregistering SW:', err);
      }
    }
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        for (const key of keys) await caches.delete(key);
      } catch (err) {
        console.error('Error deleting cache:', err);
      }
    }
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/40 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs tracking-[0.2em] font-light uppercase animate-pulse">
            Syncing memory history...
          </p>
        </div>
      </div>
    );
  }

  const openModal = (kind: ModalKind) => {
    setActiveModal(kind);
    setShowFABMenu(false);
  };

  const fabItems: { icon: string; label: string; kind: ModalKind }[] = [
    { icon: '📌', label: 'Add Commitment', kind: 'commitment' },
    { icon: '🌱', label: 'Track Habit', kind: 'habit' },
    { icon: '🚀', label: 'Initialize Project', kind: 'project' },
    { icon: '👥', label: 'Register Contact', kind: 'relationship' },
  ];

  return (
    <div
      className="min-h-screen text-slate-800 font-sans antialiased relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/mountain_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Glass layer */}
      <div className="absolute inset-0 bg-slate-100/15 backdrop-blur-[1px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-28 relative z-10">

        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b border-slate-200/50">
          <div className="space-y-0.5 text-left">
            <h1 className="text-2xl font-light tracking-[0.3em] text-slate-800 uppercase">Rwive</h1>
            <p className="text-[9px] text-slate-500 font-semibold tracking-[0.2em] uppercase">Life Companion OS</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-white/70 text-amber-700 px-3 py-1 rounded-full border border-slate-200/80 shadow-sm select-none">
            v1.1
          </span>
        </header>

        {/* 1. Today's Focus */}
        <div className="max-w-2xl mx-auto bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 shadow-lg animate-fadeIn">
          <TodayFocusPanel />
        </div>

        {/* 2. Companion Check-In */}
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <CheckInPanel
            onOpenProjectModal={() => openModal('project')}
            onOpenContactModal={() => openModal('relationship')}
          />
        </div>

        {/* 3. Journey Timeline */}
        <div className="max-w-2xl mx-auto bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 shadow-lg">
          <TimelinePanel />
        </div>

        {/* Toggle Details */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-2.5 bg-white/55 hover:bg-white/80 border border-slate-200/80 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 rounded-full transition-all duration-300 shadow-md cursor-pointer hover:text-amber-700 hover:border-amber-500/10"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* 4. Projects & People (hidden by default) */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200/40 animate-fadeIn">
            <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 shadow-lg">
              <ProjectPanel />
            </div>
            <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 shadow-lg">
              <RelationshipPanel />
            </div>
          </div>
        )}

        {/* Sync to Cloud */}
        {isSupabaseConfigured() && (
          <div className="max-w-2xl mx-auto pt-4">
            <div className="bg-sky-950/5 border border-sky-500/15 rounded-[24px] p-5 flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold text-base select-none">☁️</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-sky-700 tracking-wide">Sync to Cloud</h4>
                  <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">
                    {syncState === 'done' ? 'Sync complete ✓' :
                     syncState === 'error' ? 'Sync failed — check console' :
                     syncState === 'syncing' ? 'Syncing…' :
                     'Push local data to Supabase'}
                  </p>
                </div>
              </div>
              <button
                id="sync-to-cloud"
                disabled={syncState === 'syncing'}
                onClick={async () => {
                  setSyncState('syncing');
                  try {
                    // Clear the migration flag so it runs again
                    localStorage.removeItem('rwive_migrated_to_supabase');
                    // Dynamically load Supabase provider
                    const { supabase } = await import('../lib/supabaseClient');
                    const { SupabaseMemoryProvider } = await import('../memory/SupabaseMemoryProvider');
                    const remote = new SupabaseMemoryProvider(supabase!);
                    await migrateLocalToSupabaseIfNeeded(remote);
                    setSyncState('done');
                    // Reload after 1.5s so fresh data loads from Supabase
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (err) {
                    console.error('[Rwive] Sync failed:', err);
                    setSyncState('error');
                  }
                }}
                className="px-4 py-2 bg-white/40 hover:bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-xs font-semibold text-sky-700 rounded-full transition-all duration-300 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {syncState === 'syncing' ? '…' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        {/* Hard Refresh */}
        <div className="max-w-2xl mx-auto pt-4">
          <div className="bg-rose-950/5 border border-rose-500/10 rounded-[24px] p-5 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold text-base select-none">⚡</div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-rose-700 tracking-wide">Hard Refresh System</h4>
                <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">
                  Clear Cache & Reload · Reminder Engine requires active PWA
                </p>
              </div>
            </div>
            <button
              onClick={handleForceReload}
              className="px-4 py-2 bg-white/40 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-xs font-semibold text-rose-700 rounded-full transition-all duration-300 cursor-pointer uppercase tracking-wider"
            >
              Force Reload
            </button>
          </div>
        </div>

      </div>

      {/* FAB Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {showFABMenu && (
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-2 shadow-2xl flex flex-col space-y-1 min-w-[190px] shadow-slate-300/30 animate-fadeIn">
            {fabItems.map((item) => (
              <button
                key={item.kind}
                onClick={() => openModal(item.kind)}
                className="w-full text-left px-3.5 py-2.5 text-[10px] font-medium tracking-[0.1em] uppercase text-slate-700 hover:text-amber-700 hover:bg-slate-100/60 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          id="fab-toggle"
          onClick={() => setShowFABMenu(!showFABMenu)}
          className="w-12 h-12 bg-white/95 border border-slate-200/80 hover:border-amber-500/20 text-amber-600 hover:text-amber-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer text-xl font-light focus:outline-none"
        >
          <span className={`transform transition-transform duration-300 ${showFABMenu ? 'rotate-45' : 'rotate-0'}`}>+</span>
        </button>
      </div>

      {/* Modal Overlays */}
      {activeModal !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal('none'); }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            {activeModal === 'project' && (
              <ProjectForm onCancel={() => setActiveModal('none')} onSuccess={() => setActiveModal('none')} />
            )}
            {activeModal === 'relationship' && (
              <RelationshipForm onCancel={() => setActiveModal('none')} onSuccess={() => setActiveModal('none')} />
            )}
            {activeModal === 'commitment' && (
              <CommitmentForm onCancel={() => setActiveModal('none')} onSuccess={() => setActiveModal('none')} />
            )}
            {activeModal === 'habit' && (
              <HabitForm onCancel={() => setActiveModal('none')} onSuccess={() => setActiveModal('none')} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <MemoryProvider>
      <DashboardContent />
    </MemoryProvider>
  );
}
