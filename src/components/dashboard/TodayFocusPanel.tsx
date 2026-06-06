'use client';

import React, { useMemo, useState } from 'react';
import { useMemory } from '../../store/MemoryContext';
import type { Commitment, Habit } from '../../types/memory';

// ----------------------------------------------------------------
// Priority scoring (deterministic, code-based)
// ----------------------------------------------------------------
type FocusItemKind = 'overdue_commitment' | 'due_commitment' | 'relationship_followup' | 'habit';

interface FocusItem {
  id: string;
  kind: FocusItemKind;
  label: string;
  subLabel?: string;
  priority: number;
  commitment?: Commitment;
  habit?: Habit;
  relationshipId?: string;
}

function buildFocusItems(
  commitments: Commitment[],
  habits: Habit[],
  habitLogs: { habitId: string; date: string; status: string }[],
  relationships: { id: string; name: string; lastInteractionDate: string; preferredContactFrequencyDays: number }[]
): FocusItem[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const items: FocusItem[] = [];

  // Overdue / due commitments
  commitments.forEach((c) => {
    if (c.status !== 'pending') return;
    const snoozed = c.snoozedUntil ? new Date(c.snoozedUntil) : null;
    if (snoozed && now < snoozed) return;

    const due = new Date(c.dueAt);
    const isOverdue = due < now;
    const isDueToday = due.toISOString().split('T')[0] === todayStr;

    if (isOverdue) {
      items.push({
        id: `c_${c.id}`,
        kind: 'overdue_commitment',
        label: c.title,
        subLabel: `Overdue since ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        priority: 100,
        commitment: c,
      });
    } else if (isDueToday) {
      items.push({
        id: `c_${c.id}`,
        kind: 'due_commitment',
        label: c.title,
        subLabel: `Due by ${due.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        priority: 80,
        commitment: c,
      });
    }
  });

  // Relationship follow-ups
  relationships.forEach((r) => {
    const last = new Date(r.lastInteractionDate);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > r.preferredContactFrequencyDays) {
      items.push({
        id: `r_${r.id}`,
        kind: 'relationship_followup',
        label: `Check in with ${r.name}`,
        subLabel: `${daysSince} days since last interaction`,
        priority: 60,
        relationshipId: r.id,
      });
    }
  });

  // Habits not yet completed today
  habits.forEach((h) => {
    const doneToday = habitLogs.some(
      (l) => l.habitId === h.id && l.date === todayStr && l.status === 'completed'
    );
    if (!doneToday) {
      items.push({
        id: `h_${h.id}`,
        kind: 'habit',
        label: h.title,
        subLabel: h.streak > 0 ? `🔥 ${h.streak}-day streak` : 'Start your streak today',
        priority: 40,
        habit: h,
      });
    }
  });

  // Sort descending by priority
  return items.sort((a, b) => b.priority - a.priority);
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const kindColors: Record<FocusItemKind, string> = {
  overdue_commitment: 'bg-rose-500/10 border-rose-500/20 text-rose-700',
  due_commitment: 'bg-amber-400/10 border-amber-400/20 text-amber-700',
  relationship_followup: 'bg-sky-400/10 border-sky-400/20 text-sky-700',
  habit: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-700',
};

const kindIcons: Record<FocusItemKind, string> = {
  overdue_commitment: '⚠️',
  due_commitment: '📌',
  relationship_followup: '🤝',
  habit: '🌱',
};

export const TodayFocusPanel: React.FC = () => {
  const { commitments, habits, habitLogs, relationships, completeCommitment, skipCommitment, snoozeCommitment, completeHabit } = useMemory();
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(30);

  const items = useMemo(() =>
    buildFocusItems(commitments, habits, habitLogs, relationships),
    [commitments, habits, habitLogs, relationships]
  );

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Today&apos;s Focus
        </h2>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4 text-center">
          <p className="text-sm text-emerald-700 font-medium">All clear for today ✓</p>
          <p className="text-[10px] text-slate-400 mt-1">No overdue items or pending habits.</p>
        </div>
      </div>
    );
  }

  const handleSnooze = async (commitmentId: string) => {
    const until = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
    await snoozeCommitment(commitmentId, until);
    setSnoozeTarget(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
          Today&apos;s Focus
        </h2>
        <span className="text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border px-4 py-3.5 ${kindColors[item.kind]} transition-all`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-base mt-0.5 shrink-0">{kindIcons[item.kind]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{item.label}</p>
                  {item.subLabel && (
                    <p className="text-[10px] text-slate-500 mt-0.5 tracking-wide">{item.subLabel}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {item.commitment && (
                  <>
                    <button
                      onClick={() => completeCommitment(item.commitment!.id)}
                      title="Mark done"
                      className="w-7 h-7 rounded-full bg-white/60 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer border border-current/20"
                    >✓</button>
                    <button
                      onClick={() => setSnoozeTarget(snoozeTarget === item.commitment!.id ? null : item.commitment!.id)}
                      title="Snooze"
                      className="w-7 h-7 rounded-full bg-white/60 hover:bg-amber-400 hover:text-white text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer border border-current/20"
                    >⏱</button>
                    <button
                      onClick={() => skipCommitment(item.commitment!.id)}
                      title="Skip"
                      className="w-7 h-7 rounded-full bg-white/60 hover:bg-rose-500 hover:text-white text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer border border-current/20"
                    >✕</button>
                  </>
                )}
                {item.habit && (
                  <button
                    onClick={() => completeHabit(item.habit!.id)}
                    title="Mark done"
                    className="w-7 h-7 rounded-full bg-white/60 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center text-xs transition-all cursor-pointer border border-current/20"
                  >✓</button>
                )}
              </div>
            </div>

            {/* Snooze picker */}
            {snoozeTarget === item.commitment?.id && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                  className="text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={180}>3 hours</option>
                  <option value={1440}>Tomorrow</option>
                </select>
                <button
                  onClick={() => handleSnooze(item.commitment!.id)}
                  className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all cursor-pointer"
                >
                  Snooze
                </button>
                <button
                  onClick={() => setSnoozeTarget(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
