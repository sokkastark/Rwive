'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';
import type { Project } from '../../types/memory';

export const ProjectsView: React.FC = () => {
  const { projects, updateProject, timelineEvents, commitments, habits, activities } = useMemory();
  const [selectedProj, setSelectedProj] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [aliasesText, setAliasesText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');

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

  const handleOpenDetails = (proj: Project) => {
    setSelectedProj(proj);
    setAliasesText((proj.aliases || []).join(', '));
    setKeywordsText((proj.keywords || []).join(', '));
    setIsEditing(false);
  };

  const handleSaveIdentity = async () => {
    if (!selectedProj) return;
    const updated: Project = {
      ...selectedProj,
      aliases: aliasesText.split(',').map((s) => s.trim()).filter(Boolean),
      keywords: keywordsText.split(',').map((s) => s.trim()).filter(Boolean),
    };
    await updateProject(updated);
    setSelectedProj(updated);
    setIsEditing(false);
  };

  const activeProjects = projects.filter((p) => p.status === 'active');

  if (selectedProj) {
    const projEvents = timelineEvents.filter((e) => e.projectId === selectedProj.id);
    const projCommitments = commitments.filter((c) => c.projectId === selectedProj.id);
    const projActivities = activities.filter((a) => a.projectId === selectedProj.id);

    return (
      <div className="space-y-6 text-left animate-fadeIn text-slate-800">
        <button
          onClick={() => setSelectedProj(null)}
          className="text-xs text-amber-700 font-semibold tracking-wider uppercase cursor-pointer flex items-center space-x-1"
        >
          <span>← Back to Workspaces</span>
        </button>

        <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 md:p-8 space-y-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
                <span>{getAreaEmoji(selectedProj.lifeAreaId)}</span>
                <span>{selectedProj.name}</span>
              </h2>
              <p className="text-xs text-slate-500 font-light leading-relaxed">{selectedProj.description}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-250 px-3 py-1.5 rounded-xl transition-all font-semibold uppercase tracking-wider cursor-pointer"
            >
              {isEditing ? 'Cancel' : 'Edit Identifiers'}
            </button>
          </div>

          {/* Alias / Keyword Editor */}
          {isEditing && (
            <div className="bg-white/50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Identity Layer</h4>
              <p className="text-[9px] text-slate-400">Add search keywords and aliases separated by commas to map entries automatically.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1">Aliases</label>
                  <input
                    value={aliasesText}
                    onChange={(e) => setAliasesText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="e.g. manager, meeting, client"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1">Keywords</label>
                  <input
                    value={keywordsText}
                    onChange={(e) => setKeywordsText(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="e.g. linkedin, report, presentation"
                  />
                </div>
                <button
                  onClick={handleSaveIdentity}
                  className="px-4 py-2 bg-amber-600 text-white text-[9px] font-bold uppercase rounded-lg hover:bg-amber-700 tracking-wider transition-all cursor-pointer"
                >
                  Save Identifiers
                </button>
              </div>
            </div>
          )}

          {/* Aliases & Keywords Badges */}
          <div className="flex gap-4 text-xs border-b border-slate-200/30 pb-4">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Aliases:</span>
              <div className="flex flex-wrap gap-1">
                {(selectedProj.aliases || []).map((a) => (
                  <span key={a} className="bg-slate-100/80 text-slate-550 border border-slate-200 text-[8px] px-2 py-0.5 rounded-md font-mono">{a}</span>
                ))}
                {(selectedProj.aliases || []).length === 0 && <span className="text-[9px] text-slate-400 italic">None</span>}
              </div>
            </div>
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Keywords:</span>
              <div className="flex flex-wrap gap-1">
                {(selectedProj.keywords || []).map((k) => (
                  <span key={k} className="bg-slate-100/80 text-slate-550 border border-slate-200 text-[8px] px-2 py-0.5 rounded-md font-mono">{k}</span>
                ))}
                {(selectedProj.keywords || []).length === 0 && <span className="text-[9px] text-slate-400 italic">None</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Project Timeline</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {projEvents.map((e) => (
                  <div key={e.id} className="bg-white/20 border border-slate-200/30 rounded-xl p-3 text-xs shadow-sm">
                    <p className="font-semibold text-slate-800">{e.title}</p>
                    <p className="text-[10px] text-slate-650 leading-relaxed font-light mt-0.5">{e.description}</p>
                    <span className="text-[8px] text-slate-400 block mt-1">{e.timestamp.split('T')[0]}</span>
                  </div>
                ))}
                {projEvents.length === 0 && <p className="text-xs text-slate-400 italic pl-1">No timeline milestones.</p>}
              </div>
            </div>

            {/* Commitments & Activities */}
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Linked Reminders</h3>
                <div className="space-y-1.5">
                  {projCommitments.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-white/20 border border-slate-200/30 rounded-xl p-3 text-xs shadow-sm">
                      <span className="font-medium text-slate-800">{c.title}</span>
                      <span className="text-[9px] font-mono text-slate-400">{c.dueAt.split('T')[0]}</span>
                    </div>
                  ))}
                  {projCommitments.length === 0 && <p className="text-xs text-slate-400 italic pl-1">No pending reminders.</p>}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Recent Activities</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {projActivities.map((a) => (
                    <div key={a.id} className="bg-white/20 border border-slate-200/30 rounded-xl p-2.5 text-xs shadow-sm flex justify-between items-center">
                      <span className="font-light text-slate-700">{a.description}</span>
                      <span className="text-[8px] text-slate-400">{a.timestamp.split('T')[0]}</span>
                    </div>
                  ))}
                  {projActivities.length === 0 && <p className="text-xs text-slate-400 italic pl-1">No activities logged.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn text-slate-800">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-light tracking-wide text-slate-800">Workspaces</h2>
        <span className="text-xs text-slate-500 tracking-wide font-normal bg-white/50 px-3 py-1 rounded-full border border-slate-200/60 shadow-sm select-none">
          {activeProjects.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => handleOpenDetails(proj)}
            className="bg-white/25 border border-white/50 rounded-3xl p-5 hover:border-white/80 transition-all duration-300 shadow-sm space-y-4 cursor-pointer hover:bg-white/35 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-slate-900 tracking-wide">{proj.name}</h3>
                <span className="text-sm">{getAreaEmoji(proj.lifeAreaId)}</span>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed font-light line-clamp-2">{proj.description}</p>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-200/20 select-none">
              <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/10`}>
                {proj.health === 'green' ? 'Healthy' : proj.health === 'yellow' ? 'Losing' : 'Neglected'}
              </span>
              <span className={`text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full font-bold bg-amber-600/10 text-amber-700 border border-amber-600/10`}>
                {proj.momentum}
              </span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="bg-white/20 border border-white/40 rounded-3xl p-8 text-center text-xs text-slate-400 italic col-span-2">
            No projects initialized yet. Click "+" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
