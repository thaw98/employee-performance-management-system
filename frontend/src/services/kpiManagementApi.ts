import apiClient from '../app/axiosInstance';
import type { PositionKpi, Position, KpiCategory, Employee } from '../types/kpiManagement';

const BASE_URL = '/kpi-management';

export const kpiManagementApi = {
  // Categories
  getCategories: () => apiClient.get(`${BASE_URL}/categories`),
  createCategory: (name: string) => apiClient.post(`${BASE_URL}/categories?name=${name}`),

  // Position KPIs
  getPositionKpis: (positionId: number) => apiClient.get(`${BASE_URL}/positions/${positionId}/kpis`),
  savePositionKpis: (data: { positionId: number; kpis: PositionKpi[]; isFinal: boolean }) =>
    apiClient.post(`${BASE_URL}/positions/kpis`, data),
  deletePositionKpi: (kpiId: number) => apiClient.delete(`${BASE_URL}/positions/kpis/${kpiId}`),

  // Positions
  getPositions: () => apiClient.get(`${BASE_URL}/positions`),

  // Employees
  getEmployees: () => apiClient.get(`${BASE_URL}/employees`),
  getEmployeeKpis: (employeeId: number) => apiClient.get(`${BASE_URL}/employees/${employeeId}/kpis`),
  updateActualValues: (employeeId: number, kpis: PositionKpi[]) => 
    apiClient.post(`${BASE_URL}/employees/${employeeId}/actuals`, kpis),
  lockEmployeeKpis: (employeeId: number) => 
    apiClient.post(`${BASE_URL}/employees/${employeeId}/lock`),
};
