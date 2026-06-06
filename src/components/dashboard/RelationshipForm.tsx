'use client';

import React, { useState } from 'react';
import { useMemory } from '../../store/MemoryContext';

interface RelationshipFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const RelationshipForm: React.FC<RelationshipFormProps> = ({ onCancel, onSuccess }) => {
  const { logRelationship } = useMemory();
  const [relName, setRelName] = useState('');
  const [relType, setRelType] = useState('Family');
  const [relNotes, setRelNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relName.trim()) {
      setError('Contact name is required');
      return;
    }
    try {
      await logRelationship(relName.trim(), relType, relNotes.trim());
      setRelName('');
      setRelNotes('');
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Failed to register contact.');
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900">👥 Register Contact</h3>
        <button
          onClick={onCancel}
          type="button"
          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-55 border border-rose-200 text-rose-700 rounded-xl text-xs text-center font-light">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Name</label>
          <input
            type="text"
            value={relName}
            onChange={(e) => setRelName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500/50 font-light"
            placeholder="e.g. Mother"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Relationship Type</label>
          <select
            value={relType}
            onChange={(e) => setRelType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-amber-500/50 cursor-pointer font-light"
          >
            <option value="Family">👨‍👩‍👧 Family</option>
            <option value="Friend">👥 Friend</option>
            <option value="Work">💼 Work Partner</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
          <input
            type="text"
            value={relNotes}
            onChange={(e) => setRelNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-500/50 font-light"
            placeholder="e.g. Call every Sunday"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-all duration-300 shadow-md cursor-pointer"
        >
          Save Contact
        </button>
      </form>
    </div>
  );
};
