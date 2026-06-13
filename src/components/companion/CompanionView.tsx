'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMemory } from '../../store/MemoryContext';
import { parseCheckInText, ParsedCandidate } from '../../utils/ruleParser';

export const CompanionView: React.FC = () => {
  const {
    projects,
    relationships,
    logActivity,
    addCommitment,
    addHabit,
    addReflection,
    addCustomObservation,
    messages,
    addCompanionMessage,
    clearCompanionMessages,
  } = useMemory();

  const [checkInText, setCheckInText] = useState('');
  const [candidate, setCandidate] = useState<ParsedCandidate | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [messageAlert, setMessageAlert] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showMsg = (msg: string) => {
    setMessageAlert(msg);
    setTimeout(() => setMessageAlert(''), 4000);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCheckInText(val);
    const parsed = parseCheckInText(val, projects, relationships);
    if (parsed) {
      setCandidate(parsed);
      setShowSuggestion(true);
    } else {
      setCandidate(null);
      setShowSuggestion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInText.trim()) return;

    await addCompanionMessage('user', 'chat', checkInText.trim());

    const parsed = parseCheckInText(checkInText, projects, relationships);
    if (parsed) {
      setCandidate(parsed);
      setShowSuggestion(true);
      await addCompanionMessage(
        'rwive',
        parsed.type === 'relationship_followup' ? 'relationship' : parsed.type,
        `I noticed this sounds like a ${parsed.type}. Please confirm below.`
      );
    } else {
      // Default to general activity log
      await logActivity('General', checkInText.trim());
      await addCompanionMessage('system', 'activity', `Logged general activity.`);
      setCheckInText('');
      setCandidate(null);
      setShowSuggestion(false);
    }
  };

  const getMessageStyle = (sender: string) => {
    if (sender === 'user') return 'bg-amber-600/10 text-slate-800 ml-auto border border-amber-500/10 rounded-br-none';
    if (sender === 'rwive') return 'bg-sky-50 text-sky-850 mr-auto border border-sky-200/50 rounded-bl-none';
    return 'bg-slate-100 text-slate-500 text-[10px] mx-auto py-1.5 border border-slate-200/40 text-center tracking-wider max-w-sm rounded-full';
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      {/* Conversation History Log Feed */}
      <div className="flex-1 overflow-y-auto bg-white/20 border border-white/40 rounded-[28px] p-5 shadow-inner space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs font-light">
            No companion logs recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm flex flex-col space-y-1 ${getMessageStyle(msg.sender)}`}
              >
                <p className="text-xs font-light leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[7px] text-slate-400 self-end">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {messageAlert && (
        <div className="p-2.5 bg-white/60 border border-amber-500/25 text-amber-800 text-[10px] rounded-xl text-center font-medium shadow-sm shrink-0">
          {messageAlert}
        </div>
      )}

      {/* Suggestion Card (Overlay inside flow) */}
      {showSuggestion && candidate && (
        <div className="bg-sky-500/5 border border-sky-500/20 backdrop-blur-lg rounded-[20px] p-4 space-y-3 shadow-inner shrink-0 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-sky-700">🧭 I noticed: {candidate.type}</span>
              <p className="text-[11px] text-slate-800 font-semibold mt-1 font-serif">"{candidate.title}"</p>
            </div>
            <button onClick={() => { setShowSuggestion(false); setCandidate(null); }} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1">×</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (candidate.type === 'commitment') {
                  await addCommitment(candidate.title, candidate.dueAt || new Date().toISOString(), candidate.projectId, candidate.relationshipId);
                  await addCustomObservation('Reminder created', `Planned to: ${candidate.title}.`);
                } else if (candidate.type === 'habit') {
                  await addHabit(candidate.title, candidate.frequency || 'daily', '08:00');
                  await addCustomObservation('Habit tracked', `Started tracking: ${candidate.title}.`);
                } else if (candidate.type === 'relationship_followup') {
                  await addCommitment(candidate.title, candidate.dueAt || new Date().toISOString(), undefined, candidate.relationshipId);
                  await addCustomObservation('Relationship follow-up', `Scheduled to: ${candidate.title}.`);
                } else if (candidate.type === 'reflection') {
                  await addReflection(candidate.reflectionText || candidate.title, candidate.title);
                } else if (candidate.type === 'activity') {
                  await logActivity(candidate.projectName || 'General', candidate.title);
                }
                await addCompanionMessage(
                  'system',
                  candidate.type === 'relationship_followup' ? 'relationship' : candidate.type,
                  `Successfully registered ${candidate.type}.`
                );
                setCheckInText('');
                setCandidate(null);
                setShowSuggestion(false);
                showMsg('Action saved!');
              }}
              className="px-4 py-1.5 bg-sky-650 hover:bg-sky-700 text-[9px] font-bold text-white uppercase rounded-xl tracking-wider cursor-pointer"
            >
              Confirm
            </button>
            <button onClick={() => { setShowSuggestion(false); setCandidate(null); }} className="px-4 py-1.5 bg-white/40 border border-slate-200 text-[9px] text-slate-500 font-bold uppercase rounded-xl tracking-wider cursor-pointer">Ignore</button>
          </div>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[24px] p-5 shadow-sm shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={checkInText}
            onChange={handleTextChange}
            className="w-full bg-white/50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-850 focus:outline-none focus:border-amber-500/40 h-20 resize-none font-light leading-relaxed placeholder-slate-400"
            placeholder="e.g. Worked on ZenRide portfolio today, or call mom tomorrow"
            required
          />
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={clearCompanionMessages}
              className="text-[9px] font-bold text-slate-400 hover:text-rose-600 tracking-wider uppercase transition-colors cursor-pointer"
            >
              Clear Logs
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-md cursor-pointer hover:bg-slate-800"
            >
              Send Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
