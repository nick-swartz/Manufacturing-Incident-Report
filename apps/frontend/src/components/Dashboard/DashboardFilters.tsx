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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        <button
          onClick={onToggleExpanded}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Hide Filters
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SEVERITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.severity?.includes(option.value) || false}
                  onChange={() => handleSeverityChange(option.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.value}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {SYSTEM_OPTIONS.map((system) => (
              <label key={system} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.system?.includes(system) || false}
                  onChange={() => handleSystemChange(system)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{system}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['pending', 'submitted', 'failed'].map((status) => (
              <label key={status} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.status?.includes(status as any) || false}
                  onChange={() => handleStatusChange(status as any)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
