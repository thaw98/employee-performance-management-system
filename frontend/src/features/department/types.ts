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
  managerId: number
  managerName: string
  createdDate: string
  updatedDate: string
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  managerId: number
  status?: 'Active' | 'Inactive'
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number
}
