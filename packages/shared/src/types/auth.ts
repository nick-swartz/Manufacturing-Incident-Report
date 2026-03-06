export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'reporter';
  jiraEmail?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  jiraApiToken: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}
