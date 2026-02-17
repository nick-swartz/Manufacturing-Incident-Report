import axios from 'axios';
import { SubmissionResponse } from '@incident-system/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  timeout: 60000
});

export async function submitIncident(formData: FormData): Promise<SubmissionResponse> {
  try {
    const response = await apiClient.post<SubmissionResponse>('/incidents', formData);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || 'Failed to submit incident');
    }
    throw new Error(error.message || 'Network error occurred');
  }
}
