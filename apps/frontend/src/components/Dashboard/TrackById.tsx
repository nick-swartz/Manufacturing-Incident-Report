import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TrackById: React.FC = () => {
  const [incidentId, setIncidentId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incidentId.trim()) {
      navigate(`/track?id=${encodeURIComponent(incidentId.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={incidentId}
          onChange={(e) => setIncidentId(e.target.value)}
          placeholder="Track by Incident ID..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-line rounded-lg bg-surface-card text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400"
          aria-label="Enter incident ID to track"
        />
      </div>
      <button
        type="submit"
        disabled={!incidentId.trim()}
        className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 text-sm whitespace-nowrap"
        aria-label="Track incident"
      >
        Track
      </button>
    </form>
  );
};
