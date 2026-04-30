export interface ManagerOption {
  employeeId: number
  fullName: string
  staffNo: string
  departmentName: string
  positionName: string
}

export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number | null
  managerName: string
  createdDate: string
  updatedDate: string
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  managerId: number | null
  status?: 'Active' | 'Inactive'
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number | null
}
