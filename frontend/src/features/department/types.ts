export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  createdDate: string
  updatedDate: string
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status?: 'Active' | 'Inactive'
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
}
