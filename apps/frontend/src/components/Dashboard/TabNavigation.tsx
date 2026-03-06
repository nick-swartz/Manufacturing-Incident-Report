import React from 'react';

export type DashboardTab = 'all' | 'my-incidents' | 'favorites';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isAuthenticated: boolean;
  myIncidentsCount?: number;
  favoritesCount?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  isAuthenticated,
  myIncidentsCount,
  favoritesCount
}) => {
  const tabs: Array<{ id: DashboardTab; label: string; icon: JSX.Element; requiresAuth?: boolean; count?: number }> = [
    {
      id: 'all',
      label: 'All Incidents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'my-incidents',
      label: 'My Incidents',
      requiresAuth: true,
      count: myIncidentsCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'favorites',
      label: 'Favorites',
      count: favoritesCount,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    }
  ];

  const visibleTabs = tabs.filter(tab => !tab.requiresAuth || isAuthenticated);

  return (
    <nav className="border-b border-line bg-surface-card dark:bg-gray-800 rounded-t-lg" aria-label="Dashboard tabs">
      <div className="flex space-x-1 p-2">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                ${isActive
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                  : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${tab.label}${tab.count !== undefined ? ` (${tab.count})` : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-text-secondary'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
