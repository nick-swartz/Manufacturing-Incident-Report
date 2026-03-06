import axios from 'axios';
import { SubmissionResponse } from '@incident-system/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const incidentApiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  timeout: 60000
});

// Add auth token to incident requests
incidentApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function submitIncident(formData: FormData): Promise<SubmissionResponse> {
  try {
    const response = await incidentApiClient.post<SubmissionResponse>('/incidents', formData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || 'Failed to submit incident');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}

export interface Assignee {
  email: string;
  name: string;
  source: string;
}

export async function getAssignees(): Promise<Assignee[]> {
  try {
    const response = await axios.get<{ success: boolean; assignees: Assignee[] }>(`${API_URL}/incidents/assignees`);
    return response.data.assignees;
  } catch (error: any) {
    console.error('Failed to fetch assignees:', error);
    return [];
  }
}
