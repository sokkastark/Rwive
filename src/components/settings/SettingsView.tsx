'use client';

import React, { useState, useEffect } from 'react';
import { useMemory } from '../../store/MemoryContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export const SettingsView: React.FC = () => {
  const {
    projects, relationships, commitments, habits, habitLogs,
    timelineEvents, activities, observations, memories, restoreBackup,
  } = useMemory();

  const [notifPermission, setNotifPermission] = useState('default');
  const [swStatus, setSwStatus] = useState('Checking...');
  const [importStatus, setImportStatus] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  const handleSyncToCloud = async () => {
    setSyncState('syncing');
    try {
      localStorage.removeItem('rwive_migrated_to_supabase');
      const { supabase } = await import('../../lib/supabaseClient');
      const { SupabaseMemoryProvider } = await import('../../memory/SupabaseMemoryProvider');
      const { migrateLocalToSupabaseIfNeeded } = await import('../../utils/localStorageMigration');
      
      if (supabase) {
        const remote = new SupabaseMemoryProvider(supabase);
        await migrateLocalToSupabaseIfNeeded(remote);
        setSyncState('done');
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload();
        }, 1500);
      } else {
        throw new Error('Supabase client not initialized');
      }
    } catch (err) {
      console.error('[Rwive] Sync failed:', err);
      setSyncState('error');
    }
  };

  const handleForceReload = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      } catch (err) {
        console.error('Error unregistering SW:', err);
      }
    }
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        for (const key of keys) await caches.delete(key);
      } catch (err) {
        console.error('Error deleting cache:', err);
      }
    }
    window.location.reload();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotifPermission(Notification.permission);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          setSwStatus(regs.length > 0 ? 'Active ✓' : 'Inactive ✗');
        });
      } else {
        setSwStatus('Unsupported');
      }
    }
  }, []);

  const handleExport = () => {
    const backup = { projects, relationships, commitments, habits, habitLogs, timelineEvents, activities, observations, memories };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup));
    const dl = document.createElement('a');
    dl.href = dataStr;
    dl.download = `rwive-backup-${new Date().toISOString().split('T')[0]}.json`;
    dl.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Reading file...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data.projects || !data.commitments || !data.habits) {
          throw new Error('Invalid backup schema definition.');
        }

        setImportStatus('Restoring database tables...');
        await restoreBackup(data);
        setImportStatus('Backup restored successfully!');
      } catch (err: any) {
        console.error('[Rwive] Import failed:', err);
        setImportStatus(`Import failed: ${err.message || 'Check console'}`);
      }
    };
    reader.readAsText(file);
  };

  const requestNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn text-slate-800">
      <h2 className="text-lg font-light tracking-wide text-slate-800">Settings</h2>

      {/* 1. Backup Card */}
      <div className="bg-white/35 backdrop-blur-2xl border border-white/50 rounded-[28px] p-6 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">Data Backup & Ownership</h3>
        <p className="text-xs text-slate-650 font-light leading-relaxed">
          Rwive is built on data ownership. You can export a snapshot of your entire life logs, relationships, commitments, and settings as a portable JSON file, or restore one.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-md cursor-pointer"
          >
            Export Life Data
          </button>
          
          <label className="px-5 py-2.5 bg-white/60 hover:bg-white/80 border border-slate-200 text-slate-700 font-semibold rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-sm cursor-pointer flex items-center">
            <span>Import Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <p className="text-[10px] text-amber-700 font-medium pl-1 animate-pulse">{importStatus}</p>
        )}
      </div>
      
      {/* Sync to Cloud Card */}
      {isSupabaseConfigured() && (
        <div className="bg-white/35 backdrop-blur-2xl border border-sky-500/10 rounded-[28px] p-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold text-base select-none">☁️</div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-sky-700 tracking-wide text-left">Sync to Cloud</h4>
              <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase text-left">
                {syncState === 'done' ? 'Sync complete ✓' :
                 syncState === 'error' ? 'Sync failed — check console' :
                 syncState === 'syncing' ? 'Syncing…' :
                 'Push local data cache to Supabase'}
              </p>
            </div>
          </div>
          <button
            disabled={syncState === 'syncing'}
            onClick={handleSyncToCloud}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {syncState === 'syncing' ? '…' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* 2. Diagnostics Card */}
      <div className="bg-white/25 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">System Diagnostics</h3>
        
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-200/20">
            <span className="font-light text-slate-600">Database Connection</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
              isSupabaseConfigured()
                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/10'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {isSupabaseConfigured() ? 'Supabase Active' : 'Local Storage Cache'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-200/20">
            <span className="font-light text-slate-600">Browser Push Notifications</span>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">{notifPermission}</span>
              {notifPermission !== 'granted' && (
                <button
                  onClick={requestNotifPermission}
                  className="text-[9px] font-semibold text-amber-700 hover:text-amber-600 tracking-wider uppercase cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="font-light text-slate-600">PWA Offline Support</span>
            <span className="text-[10px] font-mono text-slate-500">{swStatus}</span>
          </div>
        </div>
      </div>

      {/* 3. Hard Refresh Card */}
      <div className="bg-white/35 backdrop-blur-2xl border border-rose-500/10 rounded-[28px] p-6 flex justify-between items-center shadow-lg animate-fadeIn">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold text-base select-none">⚡</div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-rose-700 tracking-wide text-left">Hard Refresh System</h4>
            <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase text-left">
              Clear Cache & Reload · PWA updates
            </p>
          </div>
        </div>
        <button
          onClick={handleForceReload}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-550 text-white font-semibold rounded-xl text-[10px] tracking-wider uppercase transition-all shadow-md cursor-pointer"
        >
          Force Reload
        </button>
      </div>
    </div>
  );
};
