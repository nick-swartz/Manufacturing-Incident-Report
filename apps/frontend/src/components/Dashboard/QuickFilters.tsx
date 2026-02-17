import React from 'react';
import { AnalyticsFilters, Severity } from '@incident-system/shared';

interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  filters: Partial<AnalyticsFilters>;
}

interface QuickFiltersProps {
  activeFilterId: string | null;
  onFilterSelect: (filterId: string, filters: Partial<AnalyticsFilters>) => void;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    icon: '📊',
    filters: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    icon: '📅',
    filters: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    id: 'critical',
    label: 'Critical',
    icon: '🔥',
    filters: {
      severity: [Severity.CRITICAL]
    }
  },
  {
    id: 'high-priority',
    label: 'High Priority',
    icon: '⚠️',
    filters: {
      severity: [Severity.CRITICAL, Severity.HIGH]
    }
  },
  {
    id: 'open',
    label: 'Open Issues',
    icon: '📝',
    filters: {
      status: ['pending', 'failed']
    }
  }
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({ activeFilterId, onFilterSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-600 self-center mr-2">Quick:</span>
      {QUICK_FILTERS.map((filter) => {
        const isActive = activeFilterId === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id, filter.filters)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all
              flex items-center gap-2
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            {isActive && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};
