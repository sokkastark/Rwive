'use client';

import React from 'react';
import { useMemory } from '../../store/MemoryContext';

export type TabId = 'companion' | 'today' | 'projects' | 'people' | 'settings';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { commitments, observations, habits, habitLogs } = useMemory();

  // Calculate notifications/attention items
  const activeObsCount = observations.filter((o) => o.status === 'active').length;
  
  const overdueCommsCount = commitments.filter((c) => {
    if (c.status !== 'pending') return false;
    const due = new Date(c.dueAt);
    return due <= new Date();
  }).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingHabitsCount = habits.filter((h) => {
    const loggedToday = habitLogs.some((l) => l.habitId === h.id && l.date === todayStr && l.status === 'completed');
    return !loggedToday;
  }).length;

  const todayAttentionCount = activeObsCount + overdueCommsCount + pendingHabitsCount;

  const navItems = [
    { id: 'companion' as TabId, label: 'Companion', icon: '💬' },
    { id: 'today' as TabId, label: 'Today', icon: '🎯', badge: todayAttentionCount },
    { id: 'projects' as TabId, label: 'Projects', icon: '🚀' },
    { id: 'people' as TabId, label: 'People', icon: '👥' },
    { id: 'settings' as TabId, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation (Visible on mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-t border-slate-200/50 md:hidden flex justify-around py-3 px-2 shadow-2xl rounded-t-[24px]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl relative transition-all duration-300 ${
                isActive ? 'text-amber-700 font-semibold' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[9px] tracking-wider uppercase font-semibold">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-2 min-w-[14px] h-[14px] px-1 bg-amber-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center select-none shadow">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop Sidebar Navigation (Visible on md and up) */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white/40 backdrop-blur-2xl border-r border-slate-200/40 p-6 z-40 shadow-sm">
        <div className="space-y-1 mb-8 pl-2">
          <h1 className="text-xl font-light tracking-[0.25em] text-slate-800 uppercase">Rwive</h1>
          <p className="text-[8px] text-slate-500 font-bold tracking-[0.18em] uppercase">Life Companion OS</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600/10 text-amber-800 font-medium border border-amber-600/15'
                    : 'text-slate-600 hover:bg-white/50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs uppercase tracking-[0.1em] font-semibold">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1.5 bg-amber-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center select-none shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
