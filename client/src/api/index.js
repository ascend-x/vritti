import api from './axiosInstance';

export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const logout = () => api.post('/auth/logout').then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);

// Vehicles
export const getVehicles = (params) => api.get('/vehicles', { params }).then(r => r.data);
export const getVehicle = (id) => api.get(`/vehicles/${id}`).then(r => r.data);
export const createVehicle = (data) => api.post('/vehicles', data).then(r => r.data);
export const updateVehicle = (id, data) => api.put(`/vehicles/${id}`, data).then(r => r.data);
export const retireVehicle = (id) => api.patch(`/vehicles/${id}/retire`).then(r => r.data);
export const getAvailableVehicles = () => api.get('/vehicles/available-for-dispatch').then(r => r.data);

// Drivers
export const getDrivers = (params) => api.get('/drivers', { params }).then(r => r.data);
export const getDriver = (id) => api.get(`/drivers/${id}`).then(r => r.data);
export const createDriver = (data) => api.post('/drivers', data).then(r => r.data);
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data).then(r => r.data);
export const suspendDriver = (id) => api.patch(`/drivers/${id}/suspend`).then(r => r.data);
export const reinstateDriver = (id) => api.patch(`/drivers/${id}/reinstate`).then(r => r.data);
export const getAvailableDrivers = () => api.get('/drivers/available-for-dispatch').then(r => r.data);

// Trips
export const getTrips = (params) => api.get('/trips', { params }).then(r => r.data);
export const getTrip = (id) => api.get(`/trips/${id}`).then(r => r.data);
export const createTrip = (data) => api.post('/trips', data).then(r => r.data);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data).then(r => r.data);
export const dispatchTrip = (id) => api.post(`/trips/${id}/dispatch`).then(r => r.data);
export const completeTrip = (id, data) => api.post(`/trips/${id}/complete`, data).then(r => r.data);
export const cancelTrip = (id) => api.post(`/trips/${id}/cancel`).then(r => r.data);

// Maintenance
export const getMaintenance = (params) => api.get('/maintenance', { params }).then(r => r.data);
export const createMaintenance = (data) => api.post('/maintenance', data).then(r => r.data);
export const updateMaintenance = (id, data) => api.put(`/maintenance/${id}`, data).then(r => r.data);
export const closeMaintenance = (id, data) => api.put(`/maintenance/${id}/close`, data).then(r => r.data);

// Fuel & Expenses
export const getFuelLogs = (params) => api.get('/fuel-logs', { params }).then(r => r.data);
export const createFuelLog = (data) => api.post('/fuel-logs', data).then(r => r.data);
export const deleteFuelLog = (id) => api.delete(`/fuel-logs/${id}`).then(r => r.data);
export const getExpenses = (params) => api.get('/fuel-logs/expenses', { params }).then(r => r.data);
export const createExpense = (data) => api.post('/fuel-logs/expenses', data).then(r => r.data);
export const deleteExpense = (id) => api.delete(`/fuel-logs/expenses/${id}`).then(r => r.data);

// Dashboard
export const getDashboardKPIs = () => api.get('/dashboard/kpis').then(r => r.data);
export const getRecentTrips = (limit = 10) => api.get('/dashboard/recent-trips', { params: { limit } }).then(r => r.data);
export const getVehicleStatusDist = () => api.get('/dashboard/vehicle-status-distribution').then(r => r.data);
export const getMonthlyRevenue = (year) => api.get('/dashboard/monthly-revenue', { params: { year } }).then(r => r.data);
export const getTripsPerDay = () => api.get('/dashboard/trips-per-day').then(r => r.data);
export const getExpiringLicenses = () => api.get('/dashboard/expiring-licenses').then(r => r.data);

// Analytics
export const getVehicleROI = () => api.get('/analytics/vehicle-roi').then(r => r.data);
export const getFuelEfficiency = () => api.get('/analytics/fuel-efficiency').then(r => r.data);
export const getCostBreakdown = (params) => api.get('/analytics/cost-breakdown', { params }).then(r => r.data);
export const getFleetUtilization = (params) => api.get('/analytics/fleet-utilization', { params }).then(r => r.data);
export const getTopVehicles = () => api.get('/analytics/top-vehicles').then(r => r.data);
export const exportCSV = (type) => {
  return api.get(`/analytics/export/csv`, { params: { type }, responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vritti_${type}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

// Settings / Users
export const getUsers = () => api.get('/settings/users').then(r => r.data);
export const createUser = (data) => api.post('/settings/users', data).then(r => r.data);
export const updateUser = (id, data) => api.put(`/settings/users/${id}`, data).then(r => r.data);
export const deleteUser = (id) => api.delete(`/settings/users/${id}`).then(r => r.data);

// Audit Log
export const getAuditLog = (limit = 50) => api.get('/audit', { params: { limit } }).then(r => r.data);

// Leaderboard
export const getLeaderboard = () => api.get('/leaderboard').then(r => r.data);

// Carbon Footprint
export const getCarbonFootprint = () => api.get('/carbon').then(r => r.data);
