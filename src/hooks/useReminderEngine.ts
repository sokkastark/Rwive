'use client';

import { useEffect, useRef } from 'react';
import type { Commitment, Habit, HabitLog } from '../types/memory';
import { sendNotification, requestNotificationPermission } from '../utils/notifications';

const TICK_INTERVAL_MS = 60_000; // 1 minute

interface ReminderEngineOptions {
  commitments: Commitment[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onCommitmentAsked: (commitmentId: string) => void;
  onHabitReminded: (habitId: string) => void;
}

/**
 * useReminderEngine
 * Runs a 60-second background tick that:
 *   1. Fires a browser notification for overdue/due commitments where followUpStatus is 'pending'.
 *   2. Fires habit reminders at their configured preferredTime (once per day).
 */
export function useReminderEngine({
  commitments,
  habits,
  habitLogs,
  onCommitmentAsked,
  onHabitReminded,
}: ReminderEngineOptions): void {
  // Store callbacks in refs so the interval closure always has fresh values
  const optsRef = useRef({ commitments, habits, habitLogs, onCommitmentAsked, onHabitReminded });
  useEffect(() => {
    optsRef.current = { commitments, habits, habitLogs, onCommitmentAsked, onHabitReminded };
  });

  useEffect(() => {
    // Request permission once on mount
    requestNotificationPermission();

    function tick() {
      const now = new Date();
      const { commitments, habits, habitLogs, onCommitmentAsked, onHabitReminded } =
        optsRef.current;

      // ---- Commitment reminders ----
      commitments.forEach((c) => {
        if (c.status !== 'pending') return;
        if (c.followUpStatus !== 'pending') return;

        const dueAt = new Date(c.dueAt);
        const snoozedUntil = c.snoozedUntil ? new Date(c.snoozedUntil) : null;

        // If snoozed and snooze time hasn't passed, skip
        if (snoozedUntil && now < snoozedUntil) return;

        // Fire if overdue or due within the next minute
        if (dueAt <= now) {
          sendNotification(
            '⏰ Commitment Due',
            c.title,
            `commitment_${c.id}`
          );
          onCommitmentAsked(c.id);
        }
      });

      // ---- Habit reminders ----
      const todayStr = now.toISOString().split('T')[0];
      const nowHH = now.getHours().toString().padStart(2, '0');
      const nowMM = now.getMinutes().toString().padStart(2, '0');
      const nowTime = `${nowHH}:${nowMM}`;

      habits.forEach((h) => {
        // Skip if already logged today
        const loggedToday = habitLogs.some(
          (l) => l.habitId === h.id && l.date === todayStr && l.status === 'completed'
        );
        if (loggedToday) return;

        // Skip if reminded in the last hour
        if (h.lastRemindedAt) {
          const lastReminded = new Date(h.lastRemindedAt);
          const msSince = now.getTime() - lastReminded.getTime();
          if (msSince < 60 * 60 * 1000) return;
        }

        // Fire if current time matches preferredTime (within same minute)
        if (nowTime === h.preferredTime) {
          sendNotification(
            '🌱 Habit Reminder',
            `Time for: ${h.title}`,
            `habit_${h.id}`
          );
          onHabitReminded(h.id);
        }
      });
    }

    const intervalId = setInterval(tick, TICK_INTERVAL_MS);
    // Also run once immediately so any overdue items fire on load
    tick();

    return () => clearInterval(intervalId);
  }, []); // Only runs once; opts are always fresh via ref
}
