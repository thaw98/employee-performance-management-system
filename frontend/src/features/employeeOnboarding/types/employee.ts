export interface MasterOption {
  id: number
  name: string
}

export interface EmployeeInfoPayload {
  employeeId: string
  employeeName: string
  otherName?: string
  nrcStateCode: string
  nrcTownshipCode: string
  nrcType: string
  nrcNumber: string
  gender: string
  race: string
  religionId: number
  dateOfBirth: string
  birthPlace?: string
  contactAddress?: string
  permanentAddress?: string
  phoneNo: string
  emailAddress: string
  maritalStatus?: string
  spouseName?: string
  spouseNrcNo?: string
  fatherName?: string
  fatherNrcNo?: string
  fatherOccupation?: string
  spouseOccupation?: string
  departmentId: number
  positionId: number
  nationalityId: number
  dateOfJoining: string
  onProbation?: boolean
  probationStartDate?: string
}

export interface EmployeeInfo extends EmployeeInfoPayload {
  id: number
  probationMonth?: number | null
  probationEndDate?: string | null
  recordStatus: 'DRAFT' | 'COMPLETED'
}

export interface CreateEmployeeAccountResponse {
  userId: number
  employeeId: string
  email: string
  roleId: number
  mustChangePassword: boolean
  active: boolean
  temporaryPassword: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}
