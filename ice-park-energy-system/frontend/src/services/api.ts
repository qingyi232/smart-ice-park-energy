import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 能源相关API
export const energyApi = {
  getOverview: () => api.get('/energy/overview'),
  getHistory: (hours: number) => api.get(`/energy/history?hours=${hours}`),
  getPrediction: (hours: number) => api.get(`/energy/prediction?hours=${hours}`),
  getByArea: () => api.get('/energy/by-area'),
  getByType: () => api.get('/energy/by-type'),
}

// 设备相关API
export const deviceApi = {
  getAll: () => api.get('/devices'),
  getById: (id: number) => api.get(`/devices/${id}`),
  control: (id: number, action: string, value: any) => api.post(`/devices/${id}/control`, { action, value }),
  inspection: () => api.post('/devices/inspection'),
}

// 预警相关API
export const alertApi = {
  getAll: (params?: { level?: string; status?: string }) => api.get('/alerts', { params }),
  resolve: (id: number) => api.post(`/alerts/${id}/resolve`),
  getRules: () => api.get('/alerts/rules'),
  createRule: (rule: any) => api.post('/alerts/rules', rule),
  updateRule: (id: number, rule: any) => api.put(`/alerts/rules/${id}`, rule),
}

// 环境相关API
export const environmentApi = {
  getCurrent: () => api.get('/environment/current'),
  getHistory: (hours: number) => api.get(`/environment/history?hours=${hours}`),
  getThresholds: () => api.get('/environment/thresholds'),
  updateThresholds: (thresholds: any) => api.put('/environment/thresholds', thresholds),
}

// 冰建相关API
export const iceApi = {
  getAll: () => api.get('/ice'),
  getById: (id: number) => api.get(`/ice/${id}`),
  getHistory: (id: number, days: number) => api.get(`/ice/${id}/history?days=${days}`),
  getPrediction: (id: number, hours: number) => api.get(`/ice/${id}/prediction?hours=${hours}`),
  getFactors: () => api.get('/ice/analysis/factors'),
}

// 碳资产相关API
export const carbonApi = {
  getWallet: () => api.get('/carbon/wallet'),
  getTransactions: () => api.get('/carbon/transactions'),
  getReport: (period: string) => api.get(`/carbon/report?period=${period}`),
  getFlow: () => api.get('/carbon/flow'),
  getContracts: () => api.get('/carbon/contracts'),
}

// 策略相关API
export const strategyApi = {
  getAll: () => api.get('/strategy'),
  getById: (id: number) => api.get(`/strategy/${id}`),
  execute: (id: number) => api.post(`/strategy/${id}/execute`),
  getHistory: () => api.get('/strategy/history/all'),
  create: (strategy: any) => api.post('/strategy', strategy),
  getRecommendations: () => api.get('/strategy/ai/recommendations'),
}

// 用户相关API
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (user: any) => api.post('/users', user),
  update: (id: number, user: any) => api.put(`/users/${id}`, user),
  delete: (id: number) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles/all'),
  getLogs: () => api.get('/users/logs/all'),
  login: (username: string, password: string) => api.post('/users/login', { username, password }),
}

export default api
