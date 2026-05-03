import axios from 'axios';

const API_BASE_URL = 'http://192.168.8.186:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ========================
// Auth
// ========================
export const login = (credentials) => api.post('/user/login', credentials);
export const register = (userData) => api.post('/user/register', userData);
export const getUsers = () => api.get('/user');
export const updateUserProfile = (id, data) => api.put(`/user/${id}`, data);

// ========================
// Bookings
// ========================
export const getBookings = () => api.get('/booking');
export const getUserBookings = (userId) => api.get(`/booking/user/${userId}`);
export const createBooking = (data) => api.post('/booking', data);
export const updateBooking = (id, data) => api.patch(`/booking/${id}`, data);
export const cancelBooking = (id) => api.patch(`/booking/${id}/cancel`);
export const deleteBooking = (id) => api.delete(`/booking/${id}`);

// ========================
// Routes / Scheduling
// ========================
export const getBusRoutes = () => api.get('/route');
export const createRoute = (data) => api.post('/route', data);
export const updateRoute = (id, data) => api.put(`/route/${id}`, data);
export const deleteRoute = (id) => api.delete(`/route/${id}`);

// ========================
// Finance - Revenue
// ========================
export const getRevenue = () => api.get('/revenue');
export const addRevenue = (data) => api.post('/revenue', data);
export const updateRevenue = (id, data) => api.put(`/revenue/${id}`, data);
export const deleteRevenue = (id) => api.delete(`/revenue/${id}`);
export const getRevenueReport = (period) => api.get(`/revenue/report?period=${period}`);

// ========================
// Finance - Salaries
// ========================
export const getSalaries = () => api.get('/salary');
export const addSalary = (data) => api.post('/salary', data);
export const updateSalary = (id, data) => api.put(`/salary/${id}`, data);
export const deleteSalary = (id) => api.delete(`/salary/${id}`);

// ========================
// Finance - Commissions
// ========================
export const getCommissions = () => api.get('/commission');
export const addCommission = (data) => api.post('/commission', data);
export const updateCommission = (id, data) => api.put(`/commission/${id}`, data);
export const deleteCommission = (id) => api.delete(`/commission/${id}`);

// ========================
// Suppliers
// ========================
export const getSuppliers = () => api.get('/supplier');
export const getSupplierById = (id) => api.get(`/supplier/${id}`);
export const createSupplier = (data) => api.post('/supplier', data);
export const updateSupplier = (id, data) => api.put(`/supplier/${id}`, data);
export const changeSupplierStatus = (id, status) => api.patch(`/supplier/${id}/status`, { status });
export const deleteSupplier = (id) => api.delete(`/supplier/${id}`);

// ========================
// Bus / Fleet
// ========================
export const getBuses = () => api.get('/bus');
export const getBusDetails = (id) => api.get(`/bus/${id}`);
export const createBus = (data) => api.post('/bus', data);
export const updateBus = (id, data) => api.put(`/bus/${id}`, data);
export const changeBusStatus = (id) => api.patch(`/bus/${id}/status`);
export const deleteBus = (id) => api.delete(`/bus/${id}`);

// ========================
// Performance
// ========================
export const getSupplierPerformance = (supplierId) => api.get(`/performance/stats/${supplierId}`);
export const addTrip = (data) => api.post('/performance/trip', data);
export const addIncident = (data) => api.post('/performance/incident', data);
export const addFeedback = (data) => api.post('/performance/feedback', data);
export const getAllFeedback = () => api.get('/performance/feedback');
export const getDriverStats = (driverId) => api.get(`/performance/driver-stats/${driverId}`);
export const updateIncident = (id, data) => api.put(`/performance/incidents/${id}`, data);
export const deleteIncident = (id) => api.delete(`/performance/incidents/${id}`);

// ========================
// Revenue Allocation
// ========================
export const createRevenueAllocation = (data) => api.post('/revenue-allocation', data);
export const getRevenueAllocationSummary = () => api.get('/revenue-allocation/summary');

// ========================
// Maintenance & Incidents (from User App)
// ========================
export const getMaintenance = () => api.get('/bus/maintenance');
export const getIncidents = () => api.get('/performance/list-all');
export const createIncident = (data) => api.post('/performance/incident', data);
export const updateIncidentStatus = (id, status) => api.patch(`/performance/incidents/${id}`, { status });

export default api;
