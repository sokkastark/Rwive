'use client';

import React from 'react';
import { useMemory } from '../../store/MemoryContext';

export const ProjectPanel: React.FC = () => {
  const { projects } = useMemory();

  const getHealthText = (health: string) => {
    switch (health) {
      case 'green': return 'On Trail';
      case 'yellow': return 'Losing Momentum';
      case 'red': return 'Trail Quiet';
      default: return 'Unknown';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-medium';
      case 'yellow':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-700 font-medium';
      case 'red':
        return 'bg-slate-100/50 border border-slate-200/50 text-slate-500 font-normal';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-400';
    }
  };

  const getMomentumText = (momentum: string) => {
    switch (momentum) {
      case 'high': return 'High Momentum';
      case 'medium': return 'Steady';
      case 'low': return 'Developing';
      case 'dormant': return 'Paused';
      default: return momentum;
    }
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'high':
        return 'bg-amber-600/10 border border-amber-500/20 text-amber-700 font-medium';
      case 'medium':
        return 'bg-slate-100/60 border border-slate-200 text-slate-600 font-normal';
      case 'low':
        return 'bg-slate-100/30 border border-slate-200/50 text-slate-500 font-normal';
      case 'dormant':
        return 'bg-slate-200/40 border border-slate-250 text-slate-400 font-light';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-400';
    }
  };

  const getAreaEmoji = (area: string) => {
    switch (area) {
      case 'career': return '💼';
      case 'learning': return '📚';
      case 'health': return '❤️';
      case 'family': return '👨‍👩‍👧';
      case 'creative': return '🎨';
      case 'finance': return '💵';
      case 'relationships': return '👥';
      default: return '📁';
    }
  };

  const activeCount = projects.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light tracking-wide text-slate-800">Projects</h2>
        <span className="text-xs text-slate-500 tracking-wide font-normal bg-white/50 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm select-none">
          {activeCount} active
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white/20 border border-white/40 rounded-3xl p-8 text-slate-600 text-sm space-y-3">
          <p className="font-semibold text-slate-800">No projects yet.</p>
          <p className="text-xs text-slate-500 font-light">Start with something important to you.</p>
          <div className="text-xs text-slate-500 space-y-1 pl-4 border-l-2 border-amber-500/30">
            <p className="font-medium text-slate-700 mb-1">A project can be:</p>
            <p>• Learning Anthropology</p>
            <p>• Building ZenRide</p>
            <p>• Making a Film</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white/25 border border-white/50 rounded-3xl p-5 hover:border-white/80 transition-all duration-300 shadow-sm space-y-4 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-800 tracking-wide">{proj.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-light">{proj.description}</p>
                </div>
                <span className="text-sm pl-2 select-none" title={proj.lifeAreaId}>
                  {getAreaEmoji(proj.lifeAreaId)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/30">
                <span className={`text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full ${getHealthColor(proj.health)}`}>
                  {getHealthText(proj.health)}
                </span>
                <span className={`text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full ${getMomentumColor(proj.momentum)}`}>
                  {getMomentumText(proj.momentum)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-450 font-semibold tracking-wider uppercase pt-1 select-none">
                <span>Started: {proj.createdAt.split('T')[0]}</span>
                <span>Active: {proj.updatedAt.split('T')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
