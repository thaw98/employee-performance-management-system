export interface PositionKpi {
  id?: number;
  positionId: number;
  positionName?: string;
  kpiName: string;
  category: string;
  target: string;
  unit: string;
  weight: number;
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  logicDirection: 'higher' | 'lower';
  displayOrder?: number;
  isActive?: boolean;
  actualValue?: number;
  assignmentId?: number;
  isLocked?: boolean;
  updatedBy?: string;
  score?: number;
  weightedScore?: number;
  remarks?: string;
}

export interface Employee {
  id: number;
  employeeName: string;
  employeeId: string;
  department?: { id: number; name: string };
  position?: { id: number; name: string };
}

export interface Position {
  id: number;
  name: string;
  code?: string;
  department?: { id: number; name: string };
}

export interface KpiCategory {
  id: number;
  name: string;
  isActive: boolean;
  displayOrder: number;
}
