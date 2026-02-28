import { apiRequest } from './client';

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: (token) => apiRequest('/auth/me', { token })
};

export const chipsApi = {
  balance: (token) => apiRequest('/chips/balance', { token }),
  claimDaily: (token) => apiRequest('/chips/daily-claim', { method: 'POST', token })
};

export const teaserApi = {
  today: (token) => apiRequest('/brain-teaser/today', { token }),
  submit: (token, answer) =>
    apiRequest('/brain-teaser/submit', { method: 'POST', token, body: { answer } })
};

export const matchApi = {
  strategies: () => apiRequest('/match/strategies'),
  start: (token, payload) => apiRequest('/match/start', { method: 'POST', token, body: payload }),
  history: (token) => apiRequest('/match/history', { token })
};

export const profileApi = {
  get: (token) => apiRequest('/profile', { token }),
  update: (token, payload) => apiRequest('/profile', { method: 'PUT', token, body: payload })
};
