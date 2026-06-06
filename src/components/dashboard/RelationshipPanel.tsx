'use client';

import React from 'react';
import { useMemory } from '../../store/MemoryContext';

export const RelationshipPanel: React.FC = () => {
  const { relationships, logRelationship } = useMemory();

  const handleQuickContact = async (name: string, type: string) => {
    await logRelationship(name, type, 'Logged connection interaction.');
  };

  const getDaysSince = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const utc1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    return diff < 0 ? 0 : diff;
  };

  const getNaturalContactText = (dateStr: string) => {
    const days = getDaysSince(dateStr);
    if (days === 0) return 'Last contacted today';
    if (days === 1) return 'Last contacted yesterday';
    return `Last contacted ${days} days ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light tracking-wide text-slate-800">People</h2>
        <span className="text-xs text-slate-500 tracking-wide font-normal bg-white/50 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm select-none">
          {relationships.length} connections
        </span>
      </div>

      {relationships.length === 0 ? (
        <div className="bg-white/20 border border-white/40 rounded-3xl p-8 text-slate-600 text-sm space-y-2">
          <p className="font-semibold text-slate-800">Who matters in your life?</p>
          <p className="text-xs text-slate-500 font-light leading-relaxed">
            Add a person to help Rwive remember important connections and support your relationships.
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="bg-white/25 border border-white/50 rounded-2xl p-4 flex justify-between items-center hover:border-white/80 transition-all duration-300 text-left"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-sm font-semibold text-slate-800 tracking-wide">{rel.name}</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-white/50 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200/50 select-none">
                    {rel.type}
                  </span>
                </div>
                {rel.notes && <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed font-light">{rel.notes}</p>}
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider select-none">
                  {getNaturalContactText(rel.lastInteractionDate)}
                </p>
              </div>

              <button
                onClick={() => handleQuickContact(rel.name, rel.type)}
                className="px-3.5 py-2 bg-white/60 hover:bg-white/80 border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-amber-700 rounded-xl transition-all duration-300 cursor-pointer hover:border-amber-500/20 shadow-sm"
              >
                ⚡ Step
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
