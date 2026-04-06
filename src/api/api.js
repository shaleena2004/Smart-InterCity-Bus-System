 import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// ── REVENUE ──────────────────────────────────────────────
export const getAllRevenue   = ()         => api.get('/revenue/all');
export const getRevenueById = (id)       => api.get(`/revenue/${id}`);
export const addRevenue     = (data)     => api.post('/revenue/add', data);
export const updateRevenue  = (id, data) => api.put(`/revenue/update/${id}`, data);
export const deleteRevenue  = (id)       => api.delete(`/revenue/delete/${id}`);
export const getReport      = (period)   => api.get(`/revenue/report?period=${period}`);

// ── SALARY ───────────────────────────────────────────────
export const getAllSalaries  = ()         => api.get('/salary/all');
export const getSalaryById  = (id)       => api.get(`/salary/${id}`);
export const addSalary      = (data)     => api.post('/salary/add', data);
export const updateSalary   = (id, data) => api.put(`/salary/update/${id}`, data);
export const deleteSalary   = (id)       => api.delete(`/salary/delete/${id}`);

// ── COMMISSION ───────────────────────────────────────────
export const getAllCommissions = ()         => api.get('/commission/all');
export const getCommissionById = (id)      => api.get(`/commission/${id}`);
export const addCommission    = (data)     => api.post('/commission/add', data);
export const updateCommission = (id, data) => api.put(`/commission/update/${id}`, data);
export const deleteCommission = (id)       => api.delete(`/commission/delete/${id}`);

export default api;
