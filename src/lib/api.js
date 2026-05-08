const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') || '' : '';

export function setAuthToken(token) {
  authToken = token || '';
  if (typeof window !== 'undefined') {
    if (authToken) localStorage.setItem('authToken', authToken);
    else localStorage.removeItem('authToken');
  }
}

export function getAuthToken() {
  return authToken;
}

async function parseJson(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  return parseJson(response);
}
