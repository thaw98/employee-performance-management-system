export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  createdDate: string
  updatedDate: string
  managerId: number | null
  managerName: string | null
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status?: 'Active' | 'Inactive'
  managerId: number
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number
}

export interface EmployeeOptionDto {
  employeeId: number
  employeeName: string
}
