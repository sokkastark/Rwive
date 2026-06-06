'use client';

import React, { useState } from 'react';
import { MemoryProvider, useMemory } from '../store/MemoryContext';
import { CheckInPanel } from '../components/dashboard/CheckInPanel';
import { ProjectForm } from '../components/dashboard/ProjectForm';
import { RelationshipForm } from '../components/dashboard/RelationshipForm';
import { ProjectPanel } from '../components/dashboard/ProjectPanel';
import { RelationshipPanel } from '../components/dashboard/RelationshipPanel';
import { TimelinePanel } from '../components/dashboard/TimelinePanel';

function DashboardContent() {
  const { isLoading } = useMemory();
  const [showDetails, setShowDetails] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'project' | 'relationship'>('none');
  const [showFABMenu, setShowFABMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/40 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs tracking-[0.2em] font-light uppercase animate-pulse">Syncing memory history...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-slate-800 font-sans antialiased relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/mountain_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Soft light glass layer overlay to unify the background color and sky mist */}
      <div className="absolute inset-0 bg-slate-100/15 backdrop-blur-[1px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-28 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b border-slate-200/50">
          <div className="space-y-0.5 text-left">
            <h1 className="text-2xl font-light tracking-[0.3em] text-slate-800 uppercase">
              Rwive
            </h1>
            <p className="text-[9px] text-slate-500 font-semibold tracking-[0.2em] uppercase">Life Companion OS</p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-white/70 text-amber-700 px-3 py-1 rounded-full border border-slate-200/80 shadow-sm select-none">
            Phase B.5
          </span>
        </header>

        {/* 1. Companion-First Check-In (Centered at Top) */}
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <CheckInPanel
            onOpenProjectModal={() => setActiveModal('project')}
            onOpenContactModal={() => setActiveModal('relationship')}
          />
        </div>

        {/* 2. Journey (TimelinePanel) directly below Check-In */}
        <div className="max-w-2xl mx-auto bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 shadow-lg">
          <TimelinePanel />
        </div>

        {/* Toggle Button for Details */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-2.5 bg-white/55 hover:bg-white/80 border border-slate-200/80 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 rounded-full transition-all duration-300 shadow-md cursor-pointer hover:text-amber-700 hover:border-amber-500/10"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* 3. Hidden Details (Projects and People lists) */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200/40 animate-fadeIn">
            <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 shadow-lg">
              <ProjectPanel />
            </div>
            <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 shadow-lg">
              <RelationshipPanel />
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Button (FAB) & Popover Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {showFABMenu && (
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-2 shadow-2xl flex flex-col space-y-1 text-right min-w-[170px] shadow-slate-300/30">
            <button
              onClick={() => {
                setActiveModal('project');
                setShowFABMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-[10px] font-medium tracking-[0.1em] uppercase text-slate-700 hover:text-amber-700 hover:bg-slate-100/60 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5"
            >
              <span>🚀</span>
              <span>Initialize Project</span>
            </button>
            <button
              onClick={() => {
                setActiveModal('relationship');
                setShowFABMenu(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-[10px] font-medium tracking-[0.1em] uppercase text-slate-700 hover:text-amber-700 hover:bg-slate-100/60 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5"
            >
              <span>👥</span>
              <span>Register Contact</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setShowFABMenu(!showFABMenu)}
          className="w-12 h-12 bg-white/95 border border-slate-200/80 hover:border-amber-500/20 text-amber-600 hover:text-amber-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer text-xl font-light focus:outline-none"
        >
          <span className={`transform transition-transform duration-300 ${showFABMenu ? 'rotate-45' : 'rotate-0'}`}>
            +
          </span>
        </button>
      </div>

      {/* Modal Overlays */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white border border-slate-250 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            {activeModal === 'project' && (
              <ProjectForm
                onCancel={() => setActiveModal('none')}
                onSuccess={() => setActiveModal('none')}
              />
            )}
            {activeModal === 'relationship' && (
              <RelationshipForm
                onCancel={() => setActiveModal('none')}
                onSuccess={() => setActiveModal('none')}
              />
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
