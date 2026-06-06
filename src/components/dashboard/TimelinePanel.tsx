'use client';

import React from 'react';
import { useMemory } from '../../store/MemoryContext';

export const TimelinePanel: React.FC = () => {
  const { timelineEvents, projects } = useMemory();

  const getRelativeDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    const utc1 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const utc2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1 && diff <= 7) return `${diff} Days Ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedEvents = [...timelineEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const groupedEvents: { [key: string]: typeof timelineEvents } = {};
  sortedEvents.forEach((event) => {
    const day = getRelativeDay(event.timestamp);
    if (!groupedEvents[day]) {
      groupedEvents[day] = [];
    }
    groupedEvents[day].push(event);
  });

  const getEventEmoji = (type: string) => {
    switch (type) {
      case 'created': return '🏔️'; // Starting point
      case 'status_change': return '🗺️'; // Path change
      case 'milestone': return '🏅'; // Milestone
      case 'activity': return '👣'; // Steps taken
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4 text-slate-850">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light tracking-wide text-slate-800">Journey</h2>
        <span className="text-xs text-slate-500 tracking-wide font-normal bg-white/50 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm select-none">
          {timelineEvents.length} milestones
        </span>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="bg-white/20 border border-white/40 rounded-3xl p-8 text-slate-500 text-sm text-center font-light leading-relaxed">
          No steps taken yet. Log check-ins or initialize projects to begin your journey.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-6 text-left animate-fadeIn">
          {Object.keys(groupedEvents).map((day) => (
            <div key={day} className="space-y-3 relative">
              {/* Day heading and bullet */}
              <div className="flex items-center space-x-2 -ml-[22px] bg-transparent pr-2 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-white"></span>
                <span className="text-[10px] font-bold text-amber-700/95 uppercase tracking-widest">{day}</span>
              </div>

              {/* Day's events */}
              <div className="space-y-3">
                {groupedEvents[day].map((event) => {
                  const proj = projects.find((p) => p.id === event.projectId);
                  return (
                    <div
                      key={event.id}
                      className="bg-white/20 border border-white/40 rounded-2xl p-4 space-y-1.5 hover:border-white/60 transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs">{getEventEmoji(event.type)}</span>
                          <span className="text-xs font-semibold text-slate-800 tracking-wide">{event.title}</span>
                        </div>
                        {proj && (
                          <span className="text-[9px] font-semibold bg-white/50 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200/50 select-none">
                            {proj.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 pl-6 leading-relaxed font-light">{event.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
