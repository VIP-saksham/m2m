import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('m2m_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CONTROL_KEYS = new Set(['success', 'error']);

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (!body || typeof body !== 'object' || !('success' in body)) {
      return body;
    }
    if (body.success === false && body.error) {
      const err = new Error(body.error.message || 'Request failed');
      err.code = body.error.code;
      err.payload = body.error;
      err.status = response.status;
      return Promise.reject(err);
    }
    if (body.success === true && 'data' in body) {
      const extra = {};
      for (const k of Object.keys(body)) {
        if (!CONTROL_KEYS.has(k) && k !== 'data') {
          extra[k] = body[k];
        }
      }
      const payload = body.data;
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return Object.assign({}, payload, extra);
      }
      if (Array.isArray(payload) && Object.keys(extra).length) {
        Object.defineProperty(payload, '_extra', {
          value: extra,
          enumerable: false,
          configurable: true,
          writable: true,
        });
        for (const [k, v] of Object.entries(extra)) {
          try { Object.defineProperty(payload, k, { value: v, enumerable: false, configurable: true }); } catch (_) {}
        }
      }
      return payload;
    }
    return body;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const reqUrl = error.config?.url || '';
      const isLoginAttempt =
        reqUrl.includes('/auth/login') || reqUrl.includes('/auth/demo-login');
      // A failed login attempt returns 401 too — don't redirect/reload in that case,
      // otherwise the error message on the form gets wiped by a full page reload.
      if (!isLoginAttempt) {
        localStorage.removeItem('m2m_token');
        localStorage.removeItem('m2m_user');
        window.location.href = '/login';
      }
    }
    const body = error.response?.data;
    if (body && typeof body === 'object' && body.success === false && body.error) {
      const err = new Error(body.error.message || error.message);
      err.code = body.error.code;
      err.status = error.response?.status;
      err.payload = body.error;
      return Promise.reject(err);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  config: () => api.get('/api/auth/config'),
  google: (data) => api.post('/api/auth/google', data),
  login: (data) => api.post('/api/auth/login', data),
  demoLogin: (role) => api.post('/api/auth/demo-login', { role }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.post('/api/auth/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const batchApi = {
  list: (params) => api.get('/api/batches', { params }),
  getAll: (params) => api.get('/api/batches', { params }),
  create: (data) => api.post('/api/batches', data),
  get: (id) => api.get(`/api/batches/${id}`),
  getById: (id) => api.get(`/api/batches/${id}`),
  update: (id, data) => api.put(`/api/batches/${id}`, data),
  publish: (id) => api.put(`/api/batches/${id}`, { status: 'available' }),
  assess: (id, formData) => api.post(`/api/batches/${id}/assess`, formData || undefined, formData ? {
    headers: { 'Content-Type': 'multipart/form-data' }
  } : undefined),
  getAssessment: (id) => api.get(`/api/batches/${id}/assessment`),
  runDecision: (id) => api.post(`/api/batches/${id}/decision`),
  decision: (id) => api.post(`/api/batches/${id}/decision`),
  getDecision: (id) => api.get(`/api/batches/${id}/decision`),
  uploadImage: (id, formData) => api.post(`/api/batches/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const demandApi = {
  list: (params) => api.get('/api/demands', { params }),
  getAll: (params) => api.get('/api/demands', { params }),
  getDemands: (params) => api.get('/api/demands', { params }),
  create: (data) => api.post('/api/demands', data),
  createDemand: (data) => api.post('/api/demands', data),
  get: (id) => api.get(`/api/demands/${id}`),
  getById: (id) => api.get(`/api/demands/${id}`),
  update: (id, data) => api.put(`/api/demands/${id}`, data),
  close: (id) => api.post(`/api/demands/${id}/close`),
  match: (id) => api.post(`/api/demands/${id}/match`),
  getMatches: (id) => api.get(`/api/demands/${id}/matches`),
};

export const lotApi = {
  list: (params) => api.get('/api/procurement-lots', { params }),
  getAll: (params) => api.get('/api/procurement-lots', { params }),
  get: (id) => api.get(`/api/procurement-lots/${id}`),
  getById: (id) => api.get(`/api/procurement-lots/${id}`),
  confirm: (id, notes) => api.post(`/api/procurement-lots/${id}/confirm`, { notes }),
  reject: (id, notes) => api.post(`/api/procurement-lots/${id}/reject`, { notes }),
  farmerRespond: (id, response) => api.post(`/api/procurement-lots/${id}/farmer-respond`, { response }),
};

export const dashboardApi = {
  farmer: () => api.get('/api/dashboard/farmer'),
  processor: () => api.get('/api/dashboard/processor'),
  getFarmerStats: () => api.get('/api/dashboard/farmer'),
  getProcessorStats: () => api.get('/api/dashboard/processor'),
  getNotifications: () => api.get('/api/notifications'),
};

export const notificationApi = {
  list: () => api.get('/api/notifications'),
  getAll: () => api.get('/api/notifications'),
  count: () => api.get('/api/notifications/count'),
  getCount: () => api.get('/api/notifications/count'),
  markRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
};

export const adminNotificationApi = {
  send: (data) => api.post('/api/admin/notifications', data),
};

export const marketApi = {
  prices: (crop, region) => api.get('/api/market/prices', { params: { crop, region } }),
  trends: () => api.get('/api/market/trends'),
  getPrices: (crop, region) => api.get('/api/market/prices', { params: { crop, region } }),
  getTrends: () => api.get('/api/market/trends'),
};

export const storageApi = {
  list: (params) => api.get('/api/storage', { params }),
  getAll: (params) => api.get('/api/storage', { params }),
};

export const adminApi = {
  users: (params) => api.get('/api/admin/users', { params }),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  verifyUser: (id) => api.post(`/api/admin/users/${id}/verify`),
  suspendUser: (id) => api.post(`/api/admin/users/${id}/suspend`),
  removeUser: (id) => api.post(`/api/admin/users/${id}/delete`),
  removeBatch: (id, reason) => api.post(`/api/admin/batches/${id}/remove`, { reason }),
  removeDemand: (id, reason) => api.post(`/api/admin/demands/${id}/remove`, { reason }),
  moderationScan: () => api.post('/api/admin/moderation/scan'),
  auditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
  stats: () => api.get('/api/admin/stats'),
  getStats: () => api.get('/api/admin/stats'),
};

export const networkApi = {
  overview: () => api.get('/api/network/overview'),
  getOverview: () => api.get('/api/network/overview'),
  participants: (params) => api.get('/api/network/participants', { params }),
  getParticipants: (params) => api.get('/api/network/participants', { params }),
};

export const communityApi = {
  feed: (params) => api.get('/api/community/feed', { params }),
  unlist: (listingType, listingId) => api.post(`/api/community/listings/${listingType}/${listingId}/unlist`),
  toggleLike: (data) => api.post('/api/community/likes', data),
  conversations: () => api.get('/api/community/conversations'),
  createConversation: (data) => api.post('/api/community/conversations', data),
  messages: (id) => api.get(`/api/community/conversations/${id}/messages`),
  sendMessage: (id, body) => api.post(`/api/community/conversations/${id}/messages`, { body }),
};

export const surplusApi = {
  radar: (params) => api.get('/api/surplus/radar', { params }),
  getRadar: (params) => api.get('/api/surplus/radar', { params }),
  opportunities: () => api.get('/api/surplus/opportunities'),
  getOpportunities: () => api.get('/api/surplus/opportunities'),
};

export const assistantApi = {
  chat: (question) => api.post('/api/assistant/chat', { question }),
};

export default api;
