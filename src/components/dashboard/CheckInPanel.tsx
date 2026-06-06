'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';
import type { Observation } from '../../types/memory';

interface CheckInPanelProps {
  onOpenProjectModal: () => void;
  onOpenContactModal: () => void;
}

export const CheckInPanel: React.FC<CheckInPanelProps> = ({
  onOpenProjectModal,
  onOpenContactModal,
}) => {
  const {
    projects,
    relationships,
    timelineEvents,
    observations,
    morningBrief,
    eveningReview,
    logActivity,
  } = useMemory();

  const [checkInText, setCheckInText] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [message, setMessage] = useState('');

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !checkInText.trim()) return;
    await logActivity(selectedProject, checkInText.trim());
    showMsg(`Logged step on project: "${selectedProject}"`);
    setCheckInText('');
  };

  const getTimeGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning Stark ☀️';
    if (hrs < 18) return 'Good Afternoon Stark 🌤️';
    return 'Good Evening Stark 🌙';
  };

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

  const activeObs = observations.filter((o) => o.status === 'active').slice(0, 3);
  const isMemoryEmpty = projects.length === 0 && relationships.length === 0 && timelineEvents.length === 0;

  const getNoticeCountText = () => {
    if (isMemoryEmpty) return 'Your companion memory is empty.';
    const count = activeObs.length;
    if (count === 1) return 'Rwive noticed 1 thing today.';
    return `Rwive noticed ${count} things today.`;
  };

  return (
    <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 md:p-10 shadow-xl space-y-8 text-slate-800">
      {message && (
        <div className="p-3 bg-white/60 border border-amber-500/20 text-amber-700 rounded-2xl text-xs text-center animate-pulse tracking-wide font-light">
          {message}
        </div>
      )}

      {/* Onboarding Empty State */}
      {isMemoryEmpty ? (
        <div className="space-y-8 text-left">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-slate-900 tracking-wide leading-tight">{getTimeGreeting()}</h2>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">{getNoticeCountText()}</p>
          </div>

          <div className="bg-white/20 border border-white/40 rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-bold text-amber-700/80 uppercase tracking-[0.22em]">I noticed:</h4>
            <ul className="space-y-3 text-xs text-slate-700 font-light tracking-wide leading-relaxed">
              <li className="flex items-start space-x-3">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>No projects yet.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>No people added.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>No journey recorded.</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-6 pt-2">
            <p className="text-sm font-light text-slate-600 leading-relaxed max-w-md mx-auto tracking-wide">
              Rwive is learning about what matters to you. Start by adding something important to your life: a project, a goal, or a person.
            </p>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">What would you like to remember?</p>
            
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
              <button
                onClick={onOpenProjectModal}
                className="px-6 py-3 bg-white/60 hover:bg-white/80 border border-slate-200/80 text-[10px] font-light tracking-[0.18em] uppercase text-slate-700 rounded-full transition-all duration-300 shadow-sm cursor-pointer"
              >
                🚀 Initialize Project
              </button>
              <button
                onClick={onOpenContactModal}
                className="px-6 py-3 bg-white/60 hover:bg-white/80 border border-slate-200/80 text-[10px] font-light tracking-[0.18em] uppercase text-slate-700 rounded-full transition-all duration-300 shadow-sm cursor-pointer"
              >
                👥 Register Contact
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Check-In State */
        <div className="space-y-8 text-left">
          {/* Greeting Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-slate-900 tracking-wide leading-tight">{getTimeGreeting()}</h2>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">{getNoticeCountText()}</p>
          </div>

          {/* I noticed section */}
          {activeObs.length > 0 && (
            <div className="bg-white/20 border border-white/40 rounded-2xl p-6 space-y-4">
              <h4 className="text-[10px] font-bold text-amber-700/80 uppercase tracking-[0.22em]">I noticed:</h4>
              <ul className="space-y-3 text-xs text-slate-700 font-light tracking-wide leading-relaxed">
                {activeObs.map((obs) => (
                  <li key={obs.id} className="flex items-start space-x-3">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>{humanizeObservation(obs)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Focus Recommendation */}
          {morningBrief?.focusRecommendation && (
            <div className="bg-white/45 border border-white/60 rounded-[24px] p-6 flex flex-col items-center text-center space-y-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-700/85">Suggested Focus</span>
              <h4 className="text-xl font-light text-slate-950 tracking-wide">{morningBrief.focusRecommendation.title}</h4>
              <p className="text-xs text-slate-600 font-light leading-relaxed max-w-sm tracking-wide">{morningBrief.focusRecommendation.reason}</p>
              <p className="text-[9px] text-amber-700/60 italic font-light pt-1 tracking-wider">A small step today could restore momentum.</p>
            </div>
          )}

          {/* Evening Reflection Prompt */}
          {new Date().getHours() >= 18 && eveningReview?.reflectionPrompt && (
            <div className="bg-white/20 border border-white/40 rounded-2xl p-5 text-center space-y-1">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-700/85">Evening Reflection</span>
              <p className="text-xs text-slate-700 font-light italic leading-relaxed">"{eveningReview.reflectionPrompt}"</p>
            </div>
          )}

          {/* Main Input Form */}
          <form onSubmit={handleCheckIn} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 mb-1 pl-1">What did you work on today?</label>
              <textarea
                value={checkInText}
                onChange={(e) => setCheckInText(e.target.value)}
                className="w-full bg-white/50 border border-slate-200/80 rounded-2xl p-4 text-sm text-slate-800 focus:outline-none focus:border-amber-500/40 h-28 resize-none shadow-inner transition-colors duration-300 font-light leading-relaxed placeholder-slate-400"
                placeholder="e.g. Worked on ZenRide dashboard today."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="flex-1 bg-white/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-amber-500/40 cursor-pointer transition-colors duration-300 font-light"
                required
              >
                <option value="">-- Link to Project --</option>
                {projects.filter((p) => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => alert('Speech synthesis & recognition are coming in Phase C (Voice).')}
                className="px-4 py-2.5 bg-white/40 hover:bg-white/60 border border-slate-200/80 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 hover:border-amber-500/20"
              >
                <span>🎙️</span>
                <span>Speak</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900/90 hover:bg-slate-850 text-white font-semibold rounded-xl text-xs tracking-[0.18em] uppercase transition-all duration-300 shadow-md hover:shadow-slate-350/10 cursor-pointer"
            >
              Check In
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
