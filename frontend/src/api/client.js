const API_BASE = '/api';

/**
 * Beveiligde API client met automatische token-handling.
 * Stuurt JWT mee bij elk verzoek en handelt 401-responses af.
 */
class ApiClient {
  getToken() {
    return localStorage.getItem('sportportal_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    const response = await fetch(url, config);

    // Bij een 401 (ongeautoriseerd), clear token en redirect naar login
    if (response.status === 401) {
      localStorage.removeItem('sportportal_token');
      localStorage.removeItem('sportportal_user');
      window.location.href = '/login';
      throw new Error('Sessie verlopen');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Er is een fout opgetreden.');
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
export default apiClient;
