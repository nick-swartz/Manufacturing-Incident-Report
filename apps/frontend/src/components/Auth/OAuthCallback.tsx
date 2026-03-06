import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromResponse } = useAuth();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const hasRun = React.useRef(false);

  useEffect(() => {
    // Prevent duplicate execution (React StrictMode runs effects twice)
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        // Get authorization code and encoded state from URL
        const code = searchParams.get('code');
        const encodedState = searchParams.get('state');

        console.log('OAuth callback - code:', code ? 'present' : 'missing');
        console.log('OAuth callback - encodedState:', encodedState ? 'present' : 'missing');

        if (!code || !encodedState) {
          throw new Error('Missing authorization code or state');
        }

        // Decode the state to get both original state and codeVerifier
        let state: string;
        let codeVerifier: string;

        try {
          const decoded = JSON.parse(atob(decodeURIComponent(encodedState)));
          state = decoded.state;
          codeVerifier = decoded.codeVerifier;
          console.log('Decoded state and codeVerifier successfully');
        } catch (decodeError) {
          console.error('Failed to decode state:', decodeError);
          throw new Error('Invalid state parameter');
        }

        if (!state || !codeVerifier) {
          throw new Error('Missing state or code verifier in decoded data');
        }

        // Exchange code for tokens (use original state for verification)
        const response = await authApi.exchangeOAuthCode(code, state, codeVerifier, state);

        // Store token and user info
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));

        // Update auth context
        if (setUserFromResponse) {
          setUserFromResponse(response.user);
        }

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.response?.data?.error || err.message || 'Authentication failed');
        setIsProcessing(false);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUserFromResponse]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        {isProcessing ? (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Completing sign in...
            </h2>
            <p className="text-gray-600">Please wait while we authenticate your account.</p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Authentication Failed
            </h2>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
