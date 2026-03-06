import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Report Incident';
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/confirmation') return 'Confirmation';
    if (location.pathname === '/login') return 'Login';
    if (location.pathname === '/track') return 'Track Incident';
    return 'Incident Management';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="bg-surface-card border-b border-line sticky top-0 z-50 backdrop-blur-lg bg-surface-card/95">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Page Title - Left Side */}
            <div>
              <h1 className="text-lg font-bold text-text">{getPageTitle()}</h1>
              <p className="text-xs text-text-muted hidden sm:block">Manufacturing Incident Management System</p>
            </div>

            {/* Navigation Links and User Info - Right Side */}
            <div className="flex items-center space-x-4">
              <nav className="flex items-center space-x-3" aria-label="Primary navigation">
                <Link
                  to="/"
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white shadow-md'
                      : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text'
                  }`}
                  aria-current={isActive('/') ? 'page' : undefined}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Report</span>
                  </span>
                </Link>
                <Link
                  to="/track"
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 ${
                    isActive('/track')
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white shadow-md'
                      : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text'
                  }`}
                  aria-current={isActive('/track') ? 'page' : undefined}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Track</span>
                  </span>
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] flex items-center
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 ${
                      isActive('/dashboard')
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white shadow-md'
                        : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-text'
                    }`}
                    aria-current={isActive('/dashboard') ? 'page' : undefined}
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </span>
                  </Link>
                )}
              </nav>

              {/* User Info / Auth Controls */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-4 border-l border-line pl-6">
                  <div className="text-sm">
                    <div className="font-medium text-text">{user?.name}</div>
                    <div className="text-xs text-text-muted capitalize">{user?.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-5 py-2.5 ml-2 text-sm font-semibold text-red-600 dark:text-red-400
                      hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20
                      border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700
                      rounded-xl transition-all duration-200 shadow-sm hover:shadow
                      focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                      min-h-[44px]"
                    aria-label="Log out of your account"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700
                    dark:bg-primary-500 dark:hover:bg-primary-600 rounded-xl transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800
                    min-h-[44px] flex items-center shadow-sm"
                  aria-label="Log in to your account"
                >
                  Login
                </Link>
              )}

              {/* Theme Toggle - Far Right */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
