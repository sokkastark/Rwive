'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';

interface CommitmentFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const LIFE_AREA_OPTIONS = [
  { value: '', label: 'No project' },
];

export const CommitmentForm: React.FC<CommitmentFormProps> = ({ onCancel, onSuccess }) => {
  const { addCommitment, projects } = useMemory();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [projectId, setProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('What is the commitment?'); return; }
    if (!dueDate) { setError('When is it due?'); return; }

    setIsSubmitting(true);
    try {
      const dueAt = new Date(`${dueDate}T${dueTime}:00`).toISOString();
      await addCommitment(title.trim(), dueAt, projectId || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Today as minimum date value for the date picker
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800 tracking-wide">New Commitment</h3>
        <p className="text-[11px] text-slate-500 tracking-wide">Something you need to do by a specific time.</p>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          What
        </label>
        <input
          id="commitment-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Pay EB bill, Call mechanic"
          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          autoFocus
        />
      </div>

      {/* Due date + time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Due Date
          </label>
          <input
            id="commitment-due-date"
            type="date"
            value={dueDate}
            min={todayStr}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            By Time
          </label>
          <input
            id="commitment-due-time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          />
        </div>
      </div>

      {/* Optional project link */}
      {projects.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Link to Project (optional)
          </label>
          <select
            id="commitment-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          >
            {LIFE_AREA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex space-x-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          id="commitment-submit"
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          {isSubmitting ? 'Saving…' : 'Add Commitment'}
        </button>
      </div>
    </form>
  );
};
