'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';

export const TimelinePanel: React.FC = () => {
  const { timelineEvents, projects, deleteTimelineEvent, updateTimelineEvent } = useMemory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    if (!groupedEvents[day]) groupedEvents[day] = [];
    groupedEvents[day].push(event);
  });

  const getEventEmoji = (type: string) => {
    switch (type) {
      case 'created': return '🏔️';
      case 'status_change': return '🗺️';
      case 'milestone': return '🏅';
      case 'activity': return '👣';
      default: return '📍';
    }
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setEditText(current);
    setDeletingId(null);
  };

  const saveEdit = async (id: string) => {
    if (editText.trim()) {
      await updateTimelineEvent(id, editText.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = async (id: string) => {
    await deleteTimelineEvent(id);
    setDeletingId(null);
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
              {/* Day heading */}
              <div className="flex items-center space-x-2 -ml-[22px] bg-transparent pr-2 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 border border-white" />
                <span className="text-[10px] font-bold text-amber-700/95 uppercase tracking-widest">{day}</span>
              </div>

              {/* Events */}
              <div className="space-y-3">
                {groupedEvents[day].map((event) => {
                  const proj = projects.find((p) => p.id === event.projectId);
                  const isEditing = editingId === event.id;
                  const isConfirmingDelete = deletingId === event.id;

                  return (
                    <div
                      key={event.id}
                      className="group bg-white/20 border border-white/40 rounded-2xl p-4 space-y-1.5 hover:border-white/70 hover:bg-white/30 transition-all duration-300 shadow-sm"
                    >
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className="text-xs shrink-0">{getEventEmoji(event.type)}</span>
                          <span className="text-xs font-semibold text-slate-800 tracking-wide truncate">{event.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {proj && (
                            <span className="text-[9px] font-semibold bg-white/50 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200/50 select-none">
                              {proj.name}
                            </span>
                          )}
                          {/* Edit / Delete action buttons — show on hover */}
                          {!isEditing && !isConfirmingDelete && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => startEdit(event.id, event.description)}
                                title="Edit"
                                className="w-6 h-6 rounded-full bg-white/60 hover:bg-amber-400/20 text-slate-400 hover:text-amber-600 flex items-center justify-center text-[10px] transition-all cursor-pointer border border-slate-200/50"
                              >✏️</button>
                              <button
                                onClick={() => { setDeletingId(event.id); setEditingId(null); }}
                                title="Delete"
                                className="w-6 h-6 rounded-full bg-white/60 hover:bg-rose-400/20 text-slate-400 hover:text-rose-600 flex items-center justify-center text-[10px] transition-all cursor-pointer border border-slate-200/50"
                              >🗑</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description — editable or static */}
                      {isEditing ? (
                        <div className="pl-5 space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full text-xs text-slate-700 bg-white/70 border border-amber-400/40 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(event.id)}
                              className="text-[10px] font-semibold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all cursor-pointer uppercase tracking-wider"
                            >Save</button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer px-2"
                            >Cancel</button>
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="pl-5 space-y-2">
                          <p className="text-[11px] text-rose-600 font-medium">Delete this entry?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmDelete(event.id)}
                              className="text-[10px] font-semibold px-3 py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all cursor-pointer uppercase tracking-wider"
                            >Delete</button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer px-2"
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 pl-6 leading-relaxed font-light">{event.description}</p>
                      )}
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
