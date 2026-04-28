export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  createdDate: string
  updatedDate: string
  managerId?: number | null
  managerName?: string | null
  managerStaffNo?: string | null
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status?: 'Active' | 'Inactive'
  managerId?: number | null
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId?: number | null
}

export interface ManagerOption {
  employeeId: number
  fullName: string
  staffNo: string | null
  email: string | null
  phoneNumber: string | null
  departmentId: number | null
  departmentName: string | null
  departmentCode: string | null
  positionName: string | null
  positionCode: string | null
  userId: number
  roleName: string | null
}
