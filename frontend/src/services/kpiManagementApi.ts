// src/services/kpiManagementApi.ts
import apiClient from '../app/axiosInstance';
import type { PositionKpi, PositionKpiRequest } from '../types/kpiManagement';

export const kpiManagementApi = {
  // Categories
  getCategories: () => apiClient.get('/kpi-management/categories'),
  createCategory: (name: string) => apiClient.post('/kpi-management/categories', null, { params: { name } }),

  // Positions
  getPositions: () => apiClient.get('/kpi-management/positions'),
  getPositionKpis: (positionId: number) => apiClient.get(`/kpi-management/positions/${positionId}/kpis`),
  savePositionKpis: (data: PositionKpiRequest) => apiClient.post('/kpi-management/positions/kpis', data),
  deletePositionKpi: (kpiId: number) => apiClient.delete(`/kpi-management/positions/kpis/${kpiId}`),

  // Validate position KPI weights
  validatePositionKpiWeights: (data: PositionKpiRequest) =>
    apiClient.post('/kpi-management/positions/validate-weights', data),

  // Employees
  getEmployees: () => apiClient.get('/kpi-management/employees'),
  getEmployeeKpis: (employeeId: number) => apiClient.get(`/kpi-management/employees/${employeeId}/kpis`),
  updateActualValues: (employeeId: number, kpis: PositionKpi[]) =>
    apiClient.post(`/kpi-management/employees/${employeeId}/actuals`, kpis),
  lockEmployeeKpis: (employeeId: number) =>
    apiClient.post(`/kpi-management/employees/${employeeId}/lock`),
  unlockEmployeeKpis: (employeeId: number) =>
    apiClient.post(`/kpi-management/employees/${employeeId}/unlock`),

  // Individual KPI actual update
  updateKpiActual: (assignmentId: number, actualValue: string, remarks?: string) =>
    apiClient.put(`/hr/kpi/record/${assignmentId}/actual`, { actual: actualValue, remarks }),

  // KPI Revision
  reviseKpi: (assignmentId: number, revisionData: any) =>
    apiClient.put(`/kpi/record/${assignmentId}/revise`, revisionData),

  // Get revision history
  getRevisionHistory: (assignmentId: number) =>
    apiClient.get(`/kpi/record/${assignmentId}/revisions`),

  // Validate KPI weights
  validateKpiWeights: (kpis: any[]) =>
    apiClient.post('/kpi/validate-weights', kpis),

  // KPI Record operations
  getKpiRecords: (employeeId: number, periodId?: number) =>
    apiClient.get(`/hr/kpi/employee/${employeeId}`, { params: { periodId } }),
  saveKpiBatch: (records: any[], isFinal: boolean) =>
    apiClient.post(`/hr/kpi/records/batch`, { records, isFinal }),

  // Assignment operations
  assignKpisToEmployee: (employeeId: number, periodId: number, positionKpiIds: number[]) =>
    apiClient.post(`/hr/kpi/employees/${employeeId}/assign`, { periodId, positionKpiIds }),

  // Get revision history for a specific KPI assignment
  getKpiRevisionHistory: (employeeId: number, kpiAssignmentId: number) =>
    apiClient.get(`/kpi-management/employees/${employeeId}/kpis/${kpiAssignmentId}/revisions`),
};