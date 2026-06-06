'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';

interface ProjectFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onCancel, onSuccess }) => {
  const { addProject } = useMemory();
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projArea, setProjArea] = useState('career');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      setError('Project name is required');
      return;
    }
    try {
      await addProject(projName.trim(), projDesc.trim(), projArea);
      setProjName('');
      setProjDesc('');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Failed to initialize project.');
    }
  };

  const areas = [
    { id: 'career', name: '💼 Career' },
    { id: 'learning', name: '📚 Learning' },
    { id: 'health', name: '❤️ Health' },
    { id: 'family', name: '👨‍👩‍👧 Family' },
    { id: 'creative', name: '🎨 Creative' },
    { id: 'finance', name: '💵 Finance' },
    { id: 'relationships', name: '👥 Relationships' },
  ];

  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900">🚀 Initialize New Project</h3>
        <button
          onClick={onCancel}
          type="button"
          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center font-light">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
          <input
            type="text"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500/50 font-light"
            placeholder="e.g. ZenRide App"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
          <input
            type="text"
            value={projDesc}
            onChange={(e) => setProjDesc(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500/50 font-light"
            placeholder="What is this project about?"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Life Area</label>
          <select
            value={projArea}
            onChange={(e) => setProjArea(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-500/50 cursor-pointer font-light"
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-all duration-300 shadow-md cursor-pointer"
        >
          Save Project
        </button>
      </form>
    </div>
  );
};
