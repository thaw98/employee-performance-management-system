export interface MasterOption {
  id: number
  name: string
}

/** Partial body for POST/PUT draft — any mix of filled and empty fields */
export type EmployeeDraftPayload = Partial<EmployeeInfoPayload>

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
  contactAddress: string
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
  emergencyPhone?: string
  emergencyRelation?: string
  departmentId: number
  positionId: number
  nationality: string
  dateOfJoining: string
  onProbation?: boolean
  probationStartDate?: string
  /** 1, 3, or 6 for fixed periods; null for custom (use probationEndDate). */
  probationMonth?: number | null
  probationEndDate?: string | null
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
