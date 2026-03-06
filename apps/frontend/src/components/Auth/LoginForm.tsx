import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { Button } from '../common/Button';
import { Header } from '../common/Header';

export default function LoginForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Get OAuth authorization URL
      const { url, state, codeVerifier } = await authApi.getOAuthUrl();

      // Encode state and codeVerifier together in the URL
      const encodedState = btoa(JSON.stringify({ state, codeVerifier }));

      // Replace the state in the URL with our encoded version
      const urlWithEncodedState = url.replace(`state=${state}`, `state=${encodeURIComponent(encodedState)}`);

      // Redirect to Atlassian login
      window.location.href = urlWithEncodedState;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initiate login');
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main id="main-content" className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-text">
              Sign in to your account
            </h1>
            <p className="mt-2 text-center text-sm text-text-secondary">
              Use your Atlassian account to access the dashboard
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {error && (
              <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleOAuthLogin}
                className="w-full flex items-center justify-center space-x-3"
                disabled={isLoading}
                aria-label={isLoading ? 'Redirecting to Atlassian login' : 'Sign in with Atlassian'}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6S6.698 2.4 12 2.4s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/>
                </svg>
                <span>{isLoading ? 'Redirecting...' : 'Sign in with Atlassian'}</span>
              </Button>

              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full flex justify-center py-2 px-4 border border-line rounded-md shadow-sm text-sm font-medium text-text-secondary bg-surface-card hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
                aria-label="Continue without signing in"
              >
                Continue as Guest
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Secure OAuth Authentication</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>You'll be redirected to Atlassian's secure login page. We never see your password.</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-text-muted">
              Guest access allows you to submit incidents but not view the dashboard or analytics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
