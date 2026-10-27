const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/health'),
  
  getSummary: (serviceDate) => {
    const q = serviceDate ? `?service_date=${encodeURIComponent(serviceDate)}` : '';
    return request(`/analytics/summary${q}`);
  },

  getDailyTrends: (days = 7) => request(`/analytics/daily?days=${days}`),

  createToken: (visitorName, service) =>
    request('/tokens', {
      method: 'POST',
      body: JSON.stringify({ visitor_name: visitorName, service }),
    }),

  listTokens: (params = {}) => {
    const query = new URLSearchParams();
    if (params.service) query.set('service', params.service);
    if (params.status) query.set('status', params.status);
    if (params.service_date) query.set('service_date', params.service_date);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    return request(`/tokens?${query.toString()}`);
  },

  getTokenById: (id) => request(`/tokens/${id}`),

  getTokenByNumber: (service, number, serviceDate) => {
    const query = new URLSearchParams({ service });
    if (serviceDate) query.set('service_date', serviceDate);
    return request(`/tokens/number/${number}?${query.toString()}`);
  },

  getQueue: (service, serviceDate) => {
    const query = new URLSearchParams();
    if (service) query.set('service', service);
    if (serviceDate) query.set('service_date', serviceDate);
    return request(`/queue?${query.toString()}`);
  },

  callNext: (service, serviceDate) =>
    request('/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({ service, service_date: serviceDate }),
    }),

  callToken: (tokenId) =>
    request(`/tokens/${tokenId}/call`, {
      method: 'POST',
    }),

  completeToken: (tokenId) =>
    request(`/tokens/${tokenId}/complete`, {
      method: 'POST',
    }),

  cancelToken: (tokenId) =>
    request(`/tokens/${tokenId}/cancel`, {
      method: 'POST',
    }),
};
