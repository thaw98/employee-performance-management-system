export interface MasterOption {
  id: number
  name: string
}

/** Partial body for POST/PUT draft — any mix of filled and empty fields */
export type EmployeeDraftPayload = Partial<EmployeeInfoPayload>

export interface EmployeeInfoPayload {
  /** Business employee id; optional on create — backend may default to the string form of the primary key. */
  employeeId?: string
  employeeName: string
  otherName?: string
  staffNrcNo: string
  gender: string
  race: string
  religionId: number
  dateOfBirth: string
  birthPlace?: string
  contactAddress: string
  permanentAddress?: string
  phoneNo: string
  /** Backend enum: SINGLE | MARRIED */
  maritalStatus?: 'SINGLE' | 'MARRIED'
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
  passportNo?: string
  passportExpireDate?: string
  dateOfDemotion?: string
  dateOfTitleChange?: string
  dateOfPromotion?: string
  dateOfTransfer?: string
  staffTypeId: number
  probationStartDate?: string
  /** 1, 3, or 6 for fixed periods; null for custom (use probationEndDate). */
  probationMonth?: number | null
  probationEndDate?: string | null
  /** URL from POST /api/files/profile-pictures or http(s) */
  profilePictureUrl?: string
}

export interface EmployeeInfo extends EmployeeInfoPayload {
  id: number
  /** Present when a login user is linked; comes from users.email. */
  emailAddress?: string | null
  staffTypeName?: string
  probationMonth?: number | null
  probationEndDate?: string | null
  recordStatus: 'DRAFT' | 'COMPLETED'
}

export interface CreateEmployeeAccountResponse {
  userId: number
  /** Employee table primary key (stringified for JSON). */
  employeeId: string
  email: string
  roleId: number
  mustChangePassword: boolean
  active: boolean
  /** False when the account was created but sending the temporary password email failed. */
  emailSent: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}
