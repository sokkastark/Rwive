'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';
import type { Relationship } from '../../types/memory';

export const PeopleView: React.FC = () => {
  const { relationships, commitments, timelineEvents } = useMemory();
  const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);

  const getContactStatus = (lastDateStr: string, frequencyDays: number) => {
    const last = new Date(lastDateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= frequencyDays) {
      return { text: 'In Touch', style: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/10' };
    }
    return { text: 'Overdue', style: 'bg-rose-500/10 text-rose-700 border-rose-500/10' };
  };

  const getRelativeDays = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (selectedPerson) {
    const personCommitments = commitments.filter((c) => c.relationshipId === selectedPerson.id);
    const status = getContactStatus(selectedPerson.lastInteractionDate, selectedPerson.preferredContactFrequencyDays || 7);

    return (
      <div className="space-y-6 text-left animate-fadeIn text-slate-800">
        <button
          onClick={() => setSelectedPerson(null)}
          className="text-xs text-amber-700 font-semibold tracking-wider uppercase cursor-pointer flex items-center space-x-1"
        >
          <span>← Back to Contacts</span>
        </button>

        <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 space-y-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
                <span>👤</span>
                <span>{selectedPerson.name}</span>
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-550 border border-slate-200 px-2.5 py-0.5 rounded-full select-none">
                {selectedPerson.type}
              </span>
            </div>
            <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold border ${status.style}`}>
              {status.text}
            </span>
          </div>

          <div className="bg-white/50 border border-slate-200/40 rounded-2xl p-4 space-y-3.5">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Notes / Context</span>
              <p className="text-xs text-slate-700 font-light leading-relaxed">{selectedPerson.notes || 'No notes added.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200/20">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Last Interaction</span>
                <p className="font-semibold text-slate-800">{getRelativeDays(selectedPerson.lastInteractionDate)}</p>
                <p className="text-[9px] text-slate-400 font-mono">({selectedPerson.lastInteractionDate.split('T')[0]})</p>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Preferred Frequency</span>
                <p className="font-semibold text-slate-800">Every {selectedPerson.preferredContactFrequencyDays || 7} Days</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Scheduled Reminders / Commitments</h3>
            <div className="space-y-1.5">
              {personCommitments.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-white/20 border border-slate-200/30 rounded-xl p-3 text-xs shadow-sm">
                  <span className="font-medium text-slate-850">{c.title}</span>
                  <span className="text-[9px] font-mono text-slate-400">Due {c.dueAt.split('T')[0]}</span>
                </div>
              ))}
              {personCommitments.length === 0 && <p className="text-xs text-slate-400 italic pl-1">No scheduled follow-ups.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn text-slate-800">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light tracking-wide text-slate-800">People</h2>
        <span className="text-xs text-slate-500 tracking-wide font-normal bg-white/50 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm select-none">
          {relationships.length} contacts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relationships.map((rel) => {
          const status = getContactStatus(rel.lastInteractionDate, rel.preferredContactFrequencyDays || 7);
          return (
            <div
              key={rel.id}
              onClick={() => setSelectedPerson(rel)}
              className="bg-white/25 border border-white/50 rounded-3xl p-5 hover:border-white/80 transition-all duration-300 shadow-sm space-y-4 cursor-pointer hover:bg-white/35 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-wide">{rel.name}</h3>
                  <span className="text-[9px] tracking-wider uppercase font-bold text-slate-450">{rel.type}</span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-light line-clamp-1">{rel.notes || 'No context notes.'}</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200/20 select-none">
                <span className="text-[9px] text-slate-400 font-medium">Last Contact: {getRelativeDays(rel.lastInteractionDate)}</span>
                <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold border ${status.style}`}>
                  {status.text}
                </span>
              </div>
            </div>
          );
        })}
        {relationships.length === 0 && (
          <div className="bg-white/20 border border-white/40 rounded-3xl p-8 text-center text-xs text-slate-400 italic col-span-2">
            No contacts registered yet. Click "+" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
