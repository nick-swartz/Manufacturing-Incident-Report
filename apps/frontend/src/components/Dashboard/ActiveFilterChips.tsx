import React from 'react';
import { AnalyticsFilters } from '@incident-system/shared';

interface ActiveFilterChipsProps {
  filters: AnalyticsFilters;
  onRemoveFilter: (filterKey: keyof AnalyticsFilters, value?: string) => void;
  onClearAll: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll
}) => {
  const chips: Array<{ key: keyof AnalyticsFilters; label: string; value?: string }> = [];

  // Date range
  if (filters.startDate || filters.endDate) {
    const start = filters.startDate || '...';
    const end = filters.endDate || '...';
    chips.push({ key: 'startDate', label: `${start} to ${end}` });
  }

  // Severity
  if (filters.severity && filters.severity.length > 0) {
    filters.severity.forEach((sev) => {
      chips.push({ key: 'severity', label: sev, value: sev });
    });
  }

  // System
  if (filters.system && filters.system.length > 0) {
    filters.system.forEach((sys) => {
      chips.push({ key: 'system', label: sys, value: sys });
    });
  }

  // Status
  if (filters.status && filters.status.length > 0) {
    filters.status.forEach((stat) => {
      chips.push({ key: 'status', label: stat, value: stat });
    });
  }

  // Search query
  if (filters.searchQuery) {
    chips.push({ key: 'searchQuery', label: `"${filters.searchQuery}"` });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Active:</span>
      {chips.map((chip, index) => (
        <span
          key={`${chip.key}-${chip.value || index}`}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-gray-600 hover:text-gray-900 underline"
      >
        Clear All
      </button>
    </div>
  );
};
