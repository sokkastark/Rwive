'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';

interface HabitFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({ onCancel, onSuccess }) => {
  const { addHabit } = useMemory();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [preferredTime, setPreferredTime] = useState('08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('What is the habit?'); return; }

    setIsSubmitting(true);
    try {
      await addHabit(title.trim(), frequency, preferredTime);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800 tracking-wide">New Habit</h3>
        <p className="text-[11px] text-slate-500 tracking-wide">A practice you want to track consistently.</p>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Habit
        </label>
        <input
          id="habit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning walk, Read 20 pages"
          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
          autoFocus
        />
      </div>

      {/* Frequency */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Frequency
        </label>
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {(['daily', 'weekly'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                frequency === f
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred time */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Reminder Time
        </label>
        <input
          id="habit-time"
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all"
        />
        <p className="text-[10px] text-slate-400 tracking-wide">
          Rwive will remind you at this time if you haven't completed it.
        </p>
      </div>

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
          id="habit-submit"
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          {isSubmitting ? 'Saving…' : 'Add Habit'}
        </button>
      </div>
    </form>
  );
};
