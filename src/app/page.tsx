'use client';

import React, { useState } from 'react';
import { MemoryProvider, useMemory } from '../store/MemoryContext';
import { Navigation, TabId } from '../components/common/Navigation';
import { CompanionView } from '../components/companion/CompanionView';
import { TodayView } from '../components/dashboard/TodayView';
import { ProjectsView } from '../components/projects/ProjectsView';
import { PeopleView } from '../components/people/PeopleView';
import { SettingsView } from '../components/settings/SettingsView';

import { ProjectForm } from '../components/dashboard/ProjectForm';
import { RelationshipForm } from '../components/dashboard/RelationshipForm';
import { CommitmentForm } from '../components/dashboard/CommitmentForm';
import { HabitForm } from '../components/dashboard/HabitForm';
import { useReminderEngine } from '../hooks/useReminderEngine';

type ModalKind = 'none' | 'project' | 'relationship' | 'commitment' | 'habit';

function DashboardContent() {
  const { isLoading, commitments, habits, habitLogs, markCommitmentAsked, markHabitReminded } = useMemory();
  const [activeTab, setActiveTab] = useState<TabId>('companion');
  const [activeModal, setActiveModal] = useState<ModalKind>('none');
  const [showFABMenu, setShowFABMenu] = useState(false);

  // Proactive background reminders tick
  useReminderEngine({
    commitments,
    habits,
    habitLogs,
    onCommitmentAsked: markCommitmentAsked,
    onHabitReminded: markHabitReminded,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/40 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs tracking-wider uppercase animate-pulse">Syncing Memory Vault...</p>
        </div>
      </div>
    );
  }

  const openModal = (kind: ModalKind) => {
    setActiveModal(kind);
    setShowFABMenu(false);
  };

  const fabItems: { icon: string; label: string; kind: ModalKind }[] = [
    { icon: '📌', label: 'Commitment', kind: 'commitment' },
    { icon: '🌱', label: 'Habit', kind: 'habit' },
    { icon: '🚀', label: 'Project', kind: 'project' },
    { icon: '👥', label: 'Person', kind: 'relationship' },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'companion': return <CompanionView />;
      case 'today': return <TodayView />;
      case 'projects': return <ProjectsView />;
      case 'people': return <PeopleView />;
      case 'settings': return <SettingsView />;
      default: return <CompanionView />;
    }
  };

  return (
    <div
      className="min-h-screen text-slate-800 font-sans antialiased relative overflow-x-hidden pb-24 md:pb-6 md:pl-64"
      style={{
        backgroundImage: "url('/mountain_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-slate-100/10 backdrop-blur-[1px] pointer-events-none -z-10" />

      {/* Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content wrapper */}
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 relative z-10">
        {renderActiveView()}
      </main>

      {/* Global Quick Capture FAB */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {showFABMenu && (
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 shadow-2xl flex flex-col space-y-1 min-w-[150px] animate-fadeIn">
            {fabItems.map((item) => (
              <button
                key={item.kind}
                onClick={() => openModal(item.kind)}
                className="w-full text-left px-3.5 py-2.5 text-[9px] font-bold tracking-wider uppercase text-slate-700 hover:text-amber-700 hover:bg-slate-100/60 rounded-xl transition-all cursor-pointer flex items-center space-x-2"
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
          className="w-12 h-12 bg-white/95 border border-slate-200 hover:border-amber-500/20 text-amber-600 hover:text-amber-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer text-xl font-light focus:outline-none"
        >
          <span className={`transform transition-transform duration-300 ${showFABMenu ? 'rotate-45' : 'rotate-0'}`}>+</span>
        </button>
      </div>

      {/* Modals */}
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
