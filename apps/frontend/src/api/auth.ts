import { apiClient } from './client';
import { LoginRequest, LoginResponse, User } from '@incident-system/shared';

export async function login(email: string, jiraApiToken: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    jiraApiToken
  } as LoginRequest);
  return response.data;
}

export async function verifyToken(token: string): Promise<{ valid: boolean; user: any }> {
  const response = await apiClient.post('/auth/verify', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getMe(): Promise<{ user: User }> {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// OAuth 2.0 methods
export async function getOAuthUrl(): Promise<{ url: string; state: string; codeVerifier: string }> {
  const response = await apiClient.get('/auth/oauth/url');
  return response.data;
}

export async function exchangeOAuthCode(
  code: string,
  state: string,
  codeVerifier: string,
  expectedState: string
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/oauth/callback', {
    code,
    state,
    codeVerifier,
    expectedState
  });
  return response.data;
}
