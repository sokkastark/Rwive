'use client';

import React from 'react';
import { useMemory } from '../../store/MemoryContext';
import { TodayFocusPanel } from './TodayFocusPanel';
import type { Observation } from '../../types/memory';

export const TodayView: React.FC = () => {
  const { observations, dismissObservation, morningBrief } = useMemory();

  const activeObs = observations.filter((o) => o.status === 'active').slice(0, 5);

  const humanizeObservation = (obs: Observation): string => {
    if (obs.type === 'relationship_overdue') {
      const match = obs.description.match(/(\d+) days/);
      const days = match ? match[1] : 'several';
      const name = obs.title.replace('Stay Connected: ', '');
      return `You usually call ${name} weekly. It's been ${days} days.`;
    }
    if (obs.type === 'project_inactive') {
      const projName = obs.title.replace(' has been inactive', '').replace(' is drifting', '');
      return `${projName} hasn't received activity recently.`;
    }
    if (obs.type === 'project_momentum') {
      const projName = obs.title.replace(' is building momentum', '');
      return `${projName} has been moving steadily this week.`;
    }
    if (obs.type === 'learning_consistent') {
      const projName = obs.title.replace('Consistent learning: ', '');
      return `You have studied ${projName} consistently this week.`;
    }
    return obs.description;
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 text-left">
      {/* 1. Briefing Focus Recommendation (if any) */}
      {morningBrief?.focusRecommendation && (
        <div className="bg-white/45 border border-white/60 rounded-[28px] p-6 flex flex-col items-center text-center space-y-2.5 shadow-sm">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-700/85">Suggested Focus</span>
          <h4 className="text-xl font-light text-slate-950 tracking-wide">{morningBrief.focusRecommendation.title}</h4>
          <p className="text-xs text-slate-650 font-light leading-relaxed max-w-md tracking-wide">{morningBrief.focusRecommendation.reason}</p>
        </div>
      )}

      {/* 2. Today's Focus List (Commitments, Habits due today) */}
      <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 shadow-lg">
        <TodayFocusPanel />
      </div>

      {/* 3. Companion Active Notices / Observations */}
      {activeObs.length > 0 && (
        <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 space-y-4 shadow-sm">
          <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-[0.22em]">🧭 Companion Notices</h4>
          <ul className="space-y-3 text-xs text-slate-700 font-light tracking-wide leading-relaxed">
            {activeObs.map((obs) => (
              <li key={obs.id} className="flex items-start justify-between group/obs py-1 border-b border-slate-200/20 last:border-0">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{humanizeObservation(obs)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissObservation(obs.id)}
                  className="text-xs text-slate-400 hover:text-rose-600 px-1.5 opacity-0 group-hover/obs:opacity-100 transition-opacity cursor-pointer ml-2"
                  title="Dismiss notice"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
