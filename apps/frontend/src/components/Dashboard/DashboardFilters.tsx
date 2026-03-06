import React, { useState } from 'react';
import { AnalyticsFilters, Severity, SEVERITY_OPTIONS, SYSTEM_OPTIONS } from '@incident-system/shared';

interface DashboardFiltersProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  onChange,
  isExpanded,
  onToggleExpanded
}) => {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(filters);

  const handleApply = () => {
    onChange(localFilters);
  };

  const handleReset = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const defaultFilters: AnalyticsFilters = {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      severity: undefined,
      system: undefined,
      status: undefined
    };

    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
  };

  const handleSeverityChange = (severity: Severity) => {
    const currentSeverities = localFilters.severity || [];
    const updated = currentSeverities.includes(severity)
      ? currentSeverities.filter((s) => s !== severity)
      : [...currentSeverities, severity];

    setLocalFilters({
      ...localFilters,
      severity: updated.length > 0 ? updated : undefined
    });
  };

  const handleSystemChange = (system: string) => {
    const currentSystems = localFilters.system || [];
    const updated = currentSystems.includes(system)
      ? currentSystems.filter((s) => s !== system)
      : [...currentSystems, system];

    setLocalFilters({
      ...localFilters,
      system: updated.length > 0 ? updated : undefined
    });
  };

  const handleStatusChange = (status: 'pending' | 'submitted' | 'failed') => {
    const currentStatuses = localFilters.status || [];
    const updated = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    setLocalFilters({
      ...localFilters,
      status: updated.length > 0 ? updated : undefined
    });
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div id="advanced-filters" className="bg-surface-card dark:bg-gray-800 rounded-lg shadow-md p-6 border border-line mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Advanced Filters</h3>
        <button
          onClick={onToggleExpanded}
          className="text-sm text-text-secondary hover:text-text flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 rounded px-2 min-h-[32px]"
          aria-label="Hide advanced filters"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Hide Filters
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="filter-start-date" className="block text-sm font-medium text-text mb-2">
              Start Date
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-md bg-surface-card text-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
          </div>

          <div>
            <label htmlFor="filter-end-date" className="block text-sm font-medium text-text mb-2">
              End Date
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-md bg-surface-card text-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-text mb-2">
            Severity
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEVERITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.severity?.includes(option.value) || false}
                  onChange={() => handleSeverityChange(option.value)}
                  className="w-4 h-4 text-primary-600 dark:text-primary-400 border-line rounded focus:ring-primary-500 dark:focus:ring-primary-400 min-h-[20px] min-w-[20px]"
                />
                <span className="text-sm text-text-secondary">{option.value}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-text mb-2">
            System
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-line rounded-md p-3 bg-surface dark:bg-gray-900">
            {SYSTEM_OPTIONS.map((system) => (
              <label key={system} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.system?.includes(system) || false}
                  onChange={() => handleSystemChange(system)}
                  className="w-4 h-4 text-primary-600 dark:text-primary-400 border-line rounded focus:ring-primary-500 dark:focus:ring-primary-400 min-h-[20px] min-w-[20px]"
                />
                <span className="text-sm text-text-secondary">{system}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-medium text-text mb-2">
            Status
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {['pending', 'submitted', 'failed'].map((status) => (
              <label key={status} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.status?.includes(status as any) || false}
                  onChange={() => handleStatusChange(status as any)}
                  className="w-4 h-4 text-primary-600 dark:text-primary-400 border-line rounded focus:ring-primary-500 dark:focus:ring-primary-400 min-h-[20px] min-w-[20px]"
                />
                <span className="text-sm text-text-secondary capitalize">{status}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3 pt-4 border-t border-line">
          <button
            onClick={handleApply}
            type="button"
            className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
            aria-label="Apply selected filters"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            type="button"
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
            aria-label="Reset all filters to default"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
