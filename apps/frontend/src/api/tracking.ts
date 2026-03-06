import { TrackingLookupResponse } from '@incident-system/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function lookupIncident(trackingId: string): Promise<TrackingLookupResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tracking/${trackingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to lookup incident' }));
      return {
        success: false,
        error: errorData.error || `HTTP error ${response.status}`
      };
    }

    return response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to server. Please check your connection and try again.'
    };
  }
}

export async function searchIncidents(query: string): Promise<{ success: boolean; incidents?: string[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tracking/search/${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Search failed' }));
      return {
        success: false,
        error: errorData.error || `HTTP error ${response.status}`
      };
    }

    return response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to server. Please check your connection and try again.'
    };
  }
}
