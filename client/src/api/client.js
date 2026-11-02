const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

if (!API_BASE && import.meta.env.PROD) {
  console.warn(
    '[API] VITE_API_BASE_URL is not set! In production on Vercel, set VITE_API_BASE_URL in Vercel Settings -> Environment Variables to your Render backend URL (e.g. https://your-service.onrender.com).'
  );
}

export class ApiError extends Error {
  constructor(message, code, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'INTERNAL_ERROR';
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new ApiError(
      !API_BASE && import.meta.env.PROD
        ? 'Cannot connect to backend: VITE_API_BASE_URL is not configured in Vercel project settings.'
        : 'Unable to connect to the mystery investigation server. Render free tier may be waking up (takes ~30s) or offline.',
      'NETWORK_ERROR',
      0
    );
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorPayload = data?.error || {};
    let message = errorPayload.message;
    if (!message) {
      if (!API_BASE && import.meta.env.PROD) {
        message = 'VITE_API_BASE_URL is missing in Vercel. Set it to your Render backend URL and redeploy.';
      } else if (response.status === 404) {
        message = `API endpoint ${endpoint} was not found on the server.`;
      } else if (response.status === 502 || response.status === 503) {
        message = 'The backend server is temporarily unavailable or starting up. Please retry in a few moments.';
      } else {
        message = response.statusText || 'Request failed';
      }
    }
    const code = errorPayload.code || (response.status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');
    throw new ApiError(message, code, response.status, errorPayload.details || []);
  }

  return data;
}

export const api = {
  // Check health
  async checkHealth() {
    return request('/api/health');
  },

  // Create mystery
  async createCase(premise, difficulty) {
    return request('/api/cases', {
      method: 'POST',
      body: JSON.stringify({ premise, difficulty }),
    });
  },

  // Retrieve active case
  async getCase(id) {
    return request(`/api/cases/${id}`);
  },

  // Discover clue
  async discoverClue(caseId, clueId) {
    return request(`/api/cases/${caseId}/clues/${clueId}/discover`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Request hint
  async requestHint(caseId) {
    return request(`/api/cases/${caseId}/hints`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Submit accusation
  async submitAccusation(caseId, suspectId) {
    return request(`/api/cases/${caseId}/accuse`, {
      method: 'POST',
      body: JSON.stringify({ suspectId }),
    });
  },

  // Get completed result
  async getCaseResult(caseId) {
    return request(`/api/cases/${caseId}/result`);
  },
};
