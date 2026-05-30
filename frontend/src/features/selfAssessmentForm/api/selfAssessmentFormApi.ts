import { baseApi } from '../../../app/baseApi'

export type SelfAssessmentRatingSystem = 'FIVE_POINT' | 'TEN_POINT'

export interface QuestionDto {
  id: number
  questionText: string
  sortOrder: number
  createdBy: number
  createdByRoleId: number | null
  isManagerAdded: boolean
  canEdit: boolean
  canDeactivate: boolean
  canHighlight: boolean
  createdOn: string
  deletedAt?: string | null
  deletedBy?: number | null
}

export interface SelfAssessmentFormTemplateDto {
  id: number
  title: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  reviewCycleId: number | null
  reviewCycleName: string | null
  timelineMode: 'REVIEW_CYCLE' | 'MANUAL'
  manualStartDate: string | null
  manualEndDate: string | null
  isActive: boolean
  ratingSystem: SelfAssessmentRatingSystem
  tenPointYesMinRating: number
  isLocked: boolean
  isAssignedToDeadline: boolean
  questions: QuestionDto[]
  /** Questions soft-deleted from the template; still visible for restore until cleared server-side. */
  deletedQuestions: QuestionDto[]
  createdOn: string
  createdBy: number
}

export interface QuestionRequest {
  id?: number
  questionText: string
  sortOrder: number
}

export interface QuestionBankDto {
  id: number
  questionText: string
  isActive: boolean
  ownerRoleId: number
  createdBy: number
  createdByRoleId: number | null
  departmentId: number | null
  departmentName: string | null
  createdOn: string
  updatedBy: number | null
  updatedOn: string | null
}

export interface QuestionBankRequest {
  questionText: string
  isActive: boolean
}

export interface CreateTemplateRequest {
  title: string
  departmentId: number
  positionId: number
  questions: QuestionRequest[]
  deletedQuestions?: QuestionRequest[]
  /** Omit or null to use the active employee-submission cycle on the server. */
  reviewCycleId?: number | null
  timelineMode?: 'REVIEW_CYCLE' | 'MANUAL'
  manualStartDate?: string | null
  manualEndDate?: string | null
  ratingSystem?: SelfAssessmentRatingSystem
  tenPointYesMinRating?: number | null
}

export interface CopiedSelfAssessmentFormTemplateDto {
  id: number
  sourceTemplateId: number
  title: string
  ratingSystem: SelfAssessmentRatingSystem
  tenPointYesMinRating: number
  departmentId: number
  positionId: number
  departmentName?: string | null
  positionName?: string | null
  questions: QuestionDto[]
  deletedQuestions: QuestionDto[]
  createdOn: string
  createdBy: number
}

export interface TemplateTargetPairRequest {
  departmentId: number
  positionId: number
}

export interface TemplateActiveCheckRequest {
  reviewCycleId: number
  targets: TemplateTargetPairRequest[]
}

export interface TemplateActiveCheckResultDto {
  departmentId: number
  positionId: number
  templateId: number
  templateTitle: string
  departmentName: string
  positionName: string
  reviewCycleId: number | null
  reviewCycleName: string | null
}

export interface UpdateTemplateRequest {
  title: string
  departmentId: number
  positionId: number
  isActive: boolean
  questions: QuestionRequest[]
  ratingSystem?: SelfAssessmentRatingSystem
  tenPointYesMinRating?: number | null
}

export interface EmployeeInfoDto {
  id: number
  employeeId: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  departmentCode: string
  positionId: number
  positionName: string
  positionCode: string
  roleId: number | null
}

export interface SelfAssessmentAttemptAnswerDto {
  answerId: number
  questionText: string
  sortOrder: number
  yesNoAnswer: string | null
  rating: number | null
  remarks: string | null
  retakeReason: string | null
  managerForceChangeReason: string | null
}

export interface SelfAssessmentSubmissionAttemptDto {
  attemptNumber: number
  submittedAt: string | null
  retakeReason: string | null
  answers: SelfAssessmentAttemptAnswerDto[]
}

export interface AnswerDto {
  id: number
  questionText: string
  sortOrder: number
  yesNoAnswer: string | null
  rating: number | null
  remarks: string | null
  managerProposedYesNo: string | null
  managerProposedRating: number | null
  managerProposedComment: string | null
  hrAdjustmentApproved: boolean | null
  finalApprovedYesNo: string | null
  finalApprovedRating: number | null
  retakeRequested: boolean
  retakeRequestComment: string | null
  retakeYesNoAnswer: string | null
  retakeRating: number | null
  retakeReason: string | null
  retakeSubmittedAt: string | null
  retakeApproved: boolean | null
  managerForceChanged: boolean
  managerForceChangeReason: string | null
  managerForceChangedAt: string | null
}

export interface AdjustmentDto {
  id: number
  questionText: string
  sortOrder: number
  originalYesNo: string | null
  originalRating: number | null
  proposedYesNo: string | null
  proposedRating: number | null
  managerComment: string | null
  hrDecision: string | null
  hrRejectionReason: string | null
  adjustedAt: string
  adjustedBy: number
}

export interface SelfAssessmentFormDto {
  id: number
  templateId: number
  cycleId: number | null
  cycleName: string | null
  cycleStartDate: string | null
  cycleEndDate: string | null
  title: string
  ratingSystem: SelfAssessmentRatingSystem
  tenPointYesMinRating: number
  startDate: string | null
  deadlineDate: string | null
  managerReviewDeadlineDate: string | null
  finalApprovalDeadlineDate: string | null
  assignedAt: string | null
  assignedBy: number | null
  status: string
  totalScore: number | null
  ratingCategory: string | null
  employeeRemarks: string | null
  employeeSignatureId: number | null
  employeeSignatureData: string | null
  employeeSignatureType: string | null
  employeeSignatureDate: string | null
  overallRemarks: string | null
  managerId: number | null
  managerName: string | null
  managerSignatureId: number | null
  managerSignatureData: string | null
  managerSignatureType: string | null
  managerSignatureDate: string | null
  managerComments: string | null
  hrSignatureId: number | null
  hrSignatureData: string | null
  hrSignatureType: string | null
  hrSignatureDate: string | null
  hrFinalSignatureId: number | null
  hrFinalSignatureData: string | null
  hrFinalSignatureType: string | null
  hrFinalSignatureDate: string | null
  hrAdjustmentSignatureId: number | null
  hrAdjustmentSignatureData: string | null
  hrAdjustmentSignatureType: string | null
  hrAdjustmentSignatureDate: string | null
  createdDate: string
  submittedDate: string | null
  /** Calendar date set automatically when the employee submits (cleared when HR reopens). */
  assessmentDate: string | null
  employee: EmployeeInfoDto
  answers: AnswerDto[]
  adjustments: AdjustmentDto[]
  managerRevisedTotalScore: number | null
  finalApprovedTotalScore: number | null
  employeeAcknowledgedAt: string | null
  employeeDisputedAt: string | null
  employeeDisputeReason: string | null
  retakeRequestedAt: string | null
  retakeSubmittedAt: string | null
  retakeRequestUsed: boolean
  managerApprovedRetakeAt: string | null
  managerForceChangeApprovedAt: string | null
  hrReviewRequired: boolean | null
  hrReviewReason: string | null
  hrReturnComments: string | null
  hrReviewReasonAt: string | null
  hrName: string | null
  submissionAttempts: SelfAssessmentSubmissionAttemptDto[]
  pendingUnlockRequest?: SelfAssessmentUnlockRequestDto | null
}

export interface FormListDto {
  id: number
  templateId: number
  title: string
  cycleId: number | null
  cycleName: string | null
  startDate: string | null
  deadlineDate: string | null
  managerReviewDeadlineDate: string | null
  finalApprovalDeadlineDate: string | null
  assignedAt: string | null
  assignedBy: number | null
  employee: EmployeeInfoDto
  status: string
  totalScore: number | null
  ratingCategory: string | null
  submittedDate: string | null
  assessmentDate: string | null
  retakeSubmittedAt: string | null
  createdDate: string
}

export interface CycleInfoDto {
  id: number
  name: string
  code: string
  startDate: string
  endDate: string
}

export interface SetTemplateDeadlineRequest {
  startDate: string
  deadlineDate: string
  managerReviewDeadlineDate: string
}

export interface SetTemplateDeadlineResponse {
  templateId: number
  templateTitle: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  title: string
  deadlineDate: string
  activeCycle: CycleInfoDto
  createdCount: number
  skippedCount: number
}

export type SelfAssessmentAssignmentMode = 'ALL_EMPLOYEES' | 'DEPARTMENTS' | 'POSITIONS' | 'HYBRID' | 'SPECIFIC_EMPLOYEES'

export interface SelfAssessmentAssignmentRequest {
  assignmentMode: SelfAssessmentAssignmentMode
  departmentIds: number[]
  positionIds: number[]
  employeeIds?: number[]
  startDate: string
  deadlineDate: string
  managerReviewDeadlineDate: string
  timelineMode?: 'REVIEW_CYCLE' | 'MANUAL'
  reviewCycleId?: number | null
  manualStartDate?: string | null
  manualEndDate?: string | null
}

export interface SelfAssessmentAssignmentResponse {
  createdCount: number
  skippedExistingCount: number
  skippedNoTemplateCount: number
  skippedIneligibleCount: number
  activeCycle: CycleInfoDto | null
}

export type SelfAssessmentAssignmentPreviewStatus = 'NOT_ASSIGNED' | 'ALREADY_ASSIGNED' | 'NO_TEMPLATE'

export interface SelfAssessmentAssignmentPreviewRequest {
  targets: TemplateTargetPairRequest[]
  deadlineDate: string
  managerReviewDeadlineDate: string
  timelineMode?: 'REVIEW_CYCLE' | 'MANUAL'
  reviewCycleId?: number | null
  manualStartDate?: string | null
  manualEndDate?: string | null
}

export interface SelfAssessmentAssignmentPreviewDto {
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  templateId: number | null
  templateTitle: string | null
  ratingSystem: SelfAssessmentRatingSystem | null
  questionCount: number
  assignmentStatus: SelfAssessmentAssignmentPreviewStatus
  assignedCount: number
}

export interface ActiveCycleFormsDto {
  activeCycle: CycleInfoDto | null
  forms: FormListDto[]
}

export interface ScoreRecordDto {
  id: number
  employee: EmployeeInfoDto
  status: string
  finalApprovedScore: number | null
  performance: string | null
  cycleId: number | null
  cycleName: string | null
  submittedDate: string | null
  createdDate: string
  finalApprovalDate: string | null
}

export interface SelfAssessmentSettingsDto {
  ratingSystem: SelfAssessmentRatingSystem
  tenPointYesMinRating: number
  ratingSystemEditable: boolean
  ratingSystemLockReason: string | null
}

export interface SelfAssessmentSettingsRequest {
  ratingSystem: SelfAssessmentRatingSystem
  tenPointYesMinRating?: number | null
}

export interface FormStatusDto {
  status: string | null
  isEligible: boolean
  hasActiveTemplate: boolean
  deadlinePassed: boolean
  message: string | null
}

export interface AnswerRequest {
  id: number
  yesNoAnswer: string | null
  rating: number | null
  remarks: string | null
}

export interface SaveDraftRequest {
  answers: AnswerRequest[]
  employeeRemarks: string | null
  overallRemarks: string | null
}

export interface SubmitFormRequest {
  answers: AnswerRequest[]
  employeeRemarks: string | null
  overallRemarks: string | null
}

export interface ManagerAdjustmentRequest {
  answerId: number
  proposedYesNo: string
  proposedRating: number
  comment: string
}

export interface ManagerReviewRequest {
  comments: string
  adjustments: ManagerAdjustmentRequest[]
}

export interface RetakeQuestionRequest {
  answerId: number
  comment: string
}

export interface ManagerRetakeRequest {
  comments?: string | null
  retakeRequests: RetakeQuestionRequest[]
}

export type HrRetakeRequest = ManagerRetakeRequest

export interface EmployeeRetakeAnswerRequest {
  answerId: number
  yesNoAnswer: string
  rating: number
  reason: string
}

export interface EmployeeRetakeSubmitRequest {
  answers: EmployeeRetakeAnswerRequest[]
}

export interface ManagerApproveRetakeRequest {
  comments?: string | null
}

export interface ManagerForceChangeRetakeAnswerRequest {
  answerId: number
  finalYesNoAnswer: string
  finalRating: number
  reason?: string | null
}

export interface ManagerForceChangeRetakeRequest {
  answers: ManagerForceChangeRetakeAnswerRequest[]
  comments?: string | null
}

export interface EmployeeDisputeRequest {
  disputeReason: string
}

export interface HrApproveManagerReviewRequest {
  /** Optional; server uses the HR user's default signature from Signature Settings. */
  signatureId?: number | null
}

export interface HrRejectManagerReviewRequest {
  rejectionReason: string
  retakeDeadline: string
  signatureId?: number | null
}

export interface HrReturnDisputedReviewRequest {
  reason: string
}

export interface HrReturnBackRequest {
  returnReason: string
  comments?: string | null
}

export interface HrApproveFormRequest {
  signatureId?: number | null
}

export interface HrReopenFormRequest {
  signatureId?: number | null
}

export type SelfAssessmentUnlockReasonCode =
  | 'TYPO_COMMENT'
  | 'WRONG_RATING'
  | 'INCOMPLETE_ANSWER'
  | 'WRONG_ANSWER'
  | 'OTHER'

export type SelfAssessmentUnlockHrApproveReasonCode =
  | 'SUBSTANTIVE_ERROR_CONFIRMED'
  | 'VALID_JUSTIFICATION'
  | 'WITHIN_ALLOWED_WINDOW'
  | 'SUPPORTING_EVIDENCE_REVIEWED'
  | 'REQUEST_ACCEPTED_AFTER_REVIEW'
  | 'OTHER'

export type SelfAssessmentUnlockHrRejectReasonCode =
  | 'INSUFFICIENT_JUSTIFICATION'
  | 'NO_SUBSTANTIVE_ERROR'
  | 'PAST_ALLOWED_WINDOW'
  | 'MANAGER_REVIEW_IN_PROGRESS'
  | 'DUPLICATE_REQUEST'
  | 'OTHER'

export interface SelfAssessmentArchiveSnapshotDto {
  id: number
  originalFormId: number
  employeeId: number
  employeeName: string
  employeeStaffNo: string | null
  departmentId: number | null
  departmentName: string | null
  positionId: number | null
  positionName: string | null
  templateId: number | null
  templateTitle: string
  cycleId: number | null
  cycleName: string | null
  archivedStatus: string
  rejectionReason: string
  hrUserId: number
  hrUserName: string | null
  archivedAt: string
  retakeDeadline: string
  totalScore: number | null
  managerRevisedTotalScore: number | null
  finalApprovedTotalScore: number | null
  ratingCategory: string | null
  formSnapshot: string
}

export const SELF_ASSESSMENT_UNLOCK_REASON_OPTIONS: { value: SelfAssessmentUnlockReasonCode; label: string }[] = [
  { value: 'TYPO_COMMENT', label: 'Typo or comment correction' },
  { value: 'WRONG_RATING', label: 'Wrong rating selected' },
  { value: 'INCOMPLETE_ANSWER', label: 'Incomplete answer' },
  { value: 'WRONG_ANSWER', label: 'Wrong answer selected' },
  { value: 'OTHER', label: 'Other' },
]

export const SELF_ASSESSMENT_UNLOCK_HR_APPROVE_REASON_OPTIONS: {
  value: SelfAssessmentUnlockHrApproveReasonCode
  label: string
}[] = [
  { value: 'SUBSTANTIVE_ERROR_CONFIRMED', label: 'Substantive error confirmed' },
  { value: 'VALID_JUSTIFICATION', label: 'Valid justification for unlock' },
  { value: 'WITHIN_ALLOWED_WINDOW', label: 'Within allowed edit window' },
  { value: 'SUPPORTING_EVIDENCE_REVIEWED', label: 'Supporting evidence reviewed' },
  { value: 'REQUEST_ACCEPTED_AFTER_REVIEW', label: 'Request accepted after review' },
  { value: 'OTHER', label: 'Other' },
]

export const SELF_ASSESSMENT_UNLOCK_REJECT_REASON_OPTIONS: {
  value: SelfAssessmentUnlockHrRejectReasonCode
  label: string
}[] = [
  { value: 'INSUFFICIENT_JUSTIFICATION', label: 'Insufficient justification for unlock' },
  { value: 'NO_SUBSTANTIVE_ERROR', label: 'No substantive error in submission' },
  { value: 'PAST_ALLOWED_WINDOW', label: 'Past allowed edit window' },
  { value: 'MANAGER_REVIEW_IN_PROGRESS', label: 'Manager review already in progress' },
  { value: 'DUPLICATE_REQUEST', label: 'Duplicate or unnecessary request' },
  { value: 'OTHER', label: 'Other' },
]

export type SelfAssessmentUnlockRequestStatus = 'PENDING' | 'UNLOCKED' | 'REJECTED'

export interface SelfAssessmentUnlockRequestActionRequest {
  reasonCode: SelfAssessmentUnlockReasonCode
  reasonText?: string | null
}

export interface SelfAssessmentUnlockRejectRequest {
  reasonCode: SelfAssessmentUnlockHrRejectReasonCode
  reasonText?: string | null
}

export interface SelfAssessmentUnlockRequestUnlockRequest {
  reasonCode: SelfAssessmentUnlockHrApproveReasonCode
  reasonText?: string | null
}

export interface SelfAssessmentUnlockRequestDto {
  id: number
  formId: number
  employeeId: number
  employeeNumber: string | null
  employeeName: string | null
  requestedByUserId: number
  requestedByName: string | null
  resolvedByUserId: number | null
  resolvedByName: string | null
  status: SelfAssessmentUnlockRequestStatus
  reasonCode: SelfAssessmentUnlockReasonCode
  reasonText: string | null
  hrReasonCode: string | null
  hrReasonText: string | null
  unlockDeadline: string | null
  requestedAt: string
  resolvedAt: string | null
  formTitle: string | null
  cycleId: number | null
  cycleName: string | null
  managerReviewDeadlineDate: string | null
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const getRecord = (source: UnknownRecord, key: string) => {
  const value = source[key]
  return isRecord(value) ? value : undefined
}

const getArray = (value: unknown) => {
  return Array.isArray(value) ? value : []
}

const getString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value : fallback
}

const getNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value ?? fallback)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const getBoolean = (value: unknown, fallback = false) => {
  return typeof value === 'boolean' ? value : fallback
}

const getOptionalString = (value: unknown) => {
  return typeof value === 'string' ? value : undefined
}

/** Parses API ids; treats null/undefined/invalid as absent (avoids coalescing JSON null to 0). */
const parsePositiveId = (value: unknown): number | undefined => {
  if (value == null || value === '') {
    return undefined
  }
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const normalizeRatingSystem = (value: unknown): SelfAssessmentRatingSystem => {
  return value === 'TEN_POINT' ? 'TEN_POINT' : 'FIVE_POINT'
}

const normalizeTenPointYesMinRating = (value: unknown): number => {
  const numericValue = Number(value ?? 5)
  if (!Number.isFinite(numericValue)) return 5
  return Math.min(10, Math.max(2, Math.trunc(numericValue)))
}

const getResponseData = (response: unknown) => {
  return isRecord(response) ? response.data : undefined
}

const normalizeEmployeeInfo = (source: UnknownRecord): EmployeeInfoDto => {
  const departmentSource = getRecord(source, 'department')
  const positionSource = getRecord(source, 'position')

  return {
    id: getNumber(source.id),
    employeeId: getString(source.employeeId ?? source.staffNo),
    employeeName: getString(source.employeeName ?? source.fullName ?? source.name, 'N/A'),
    email: getString(source.email),
    departmentId: getNumber(departmentSource?.id ?? source.departmentId),
    departmentName: getString(departmentSource?.departmentName ?? departmentSource?.name ?? source.departmentName, 'N/A'),
    departmentCode: getString(departmentSource?.departmentCode ?? departmentSource?.code ?? source.departmentCode),
    positionId: getNumber(positionSource?.id ?? source.positionId),
    positionName: getString(positionSource?.positionName ?? positionSource?.name ?? source.positionName, 'N/A'),
    positionCode: getString(positionSource?.positionCode ?? positionSource?.code ?? source.positionCode),
    roleId: source.roleId != null ? getNumber(source.roleId) : null,
  }
}

const normalizeAnswer = (source: UnknownRecord): AnswerDto => {
  return {
    id: getNumber(source.id),
    questionText: getString(source.questionText),
    sortOrder: getNumber(source.sortOrder),
    yesNoAnswer: getOptionalString(source.yesNoAnswer) ?? null,
    rating: source.rating != null ? getNumber(source.rating) : null,
    remarks: getOptionalString(source.remarks) ?? null,
    managerProposedYesNo: getOptionalString(source.managerProposedYesNo) ?? null,
    managerProposedRating: source.managerProposedRating != null ? getNumber(source.managerProposedRating) : null,
    managerProposedComment: getOptionalString(source.managerProposedComment) ?? null,
    hrAdjustmentApproved: source.hrAdjustmentApproved != null ? getBoolean(source.hrAdjustmentApproved) : null,
    finalApprovedYesNo: getOptionalString(source.finalApprovedYesNo) ?? null,
    finalApprovedRating: source.finalApprovedRating != null ? getNumber(source.finalApprovedRating) : null,
    retakeRequested: getBoolean(source.retakeRequested),
    retakeRequestComment: getOptionalString(source.retakeRequestComment) ?? null,
    retakeYesNoAnswer: getOptionalString(source.retakeYesNoAnswer) ?? null,
    retakeRating: source.retakeRating != null ? getNumber(source.retakeRating) : null,
    retakeReason: getOptionalString(source.retakeReason) ?? null,
    retakeSubmittedAt: getOptionalString(source.retakeSubmittedAt) ?? null,
    retakeApproved: source.retakeApproved != null ? getBoolean(source.retakeApproved) : null,
    managerForceChanged: getBoolean(source.managerForceChanged),
    managerForceChangeReason: getOptionalString(source.managerForceChangeReason) ?? null,
    managerForceChangedAt: getOptionalString(source.managerForceChangedAt) ?? null,
  }
}

const normalizeAttemptAnswer = (source: UnknownRecord): SelfAssessmentAttemptAnswerDto => ({
  answerId: getNumber(source.answerId ?? source.id),
  questionText: getString(source.questionText),
  sortOrder: getNumber(source.sortOrder),
  yesNoAnswer: getOptionalString(source.yesNoAnswer) ?? null,
  rating: source.rating != null ? getNumber(source.rating) : null,
  remarks: getOptionalString(source.remarks) ?? null,
  retakeReason: getOptionalString(source.retakeReason) ?? null,
  managerForceChangeReason: getOptionalString(source.managerForceChangeReason) ?? null,
})

const normalizeSubmissionAttempt = (source: UnknownRecord): SelfAssessmentSubmissionAttemptDto => ({
  attemptNumber: getNumber(source.attemptNumber),
  submittedAt: getOptionalString(source.submittedAt) ?? null,
  retakeReason: getOptionalString(source.retakeReason) ?? null,
  answers: getArray(source.answers).map(a => normalizeAttemptAnswer(isRecord(a) ? a : {})),
})

const normalizeUnlockReasonCode = (value: unknown): SelfAssessmentUnlockReasonCode => {
  return value === 'TYPO_COMMENT'
    || value === 'WRONG_RATING'
    || value === 'INCOMPLETE_ANSWER'
    || value === 'WRONG_ANSWER'
    || value === 'OTHER'
    ? value
    : 'OTHER'
}

const normalizeUnlockStatus = (value: unknown): SelfAssessmentUnlockRequestStatus => {
  return value === 'UNLOCKED' || value === 'REJECTED' ? value : 'PENDING'
}

const normalizeUnlockRequest = (request: unknown): SelfAssessmentUnlockRequestDto => {
  const source = isRecord(request) ? request : {}
  return {
    id: getNumber(source.id),
    formId: getNumber(source.formId),
    employeeId: getNumber(source.employeeId),
    employeeNumber: getOptionalString(source.employeeNumber) ?? null,
    employeeName: getOptionalString(source.employeeName) ?? null,
    requestedByUserId: getNumber(source.requestedByUserId),
    requestedByName: getOptionalString(source.requestedByName) ?? null,
    resolvedByUserId: source.resolvedByUserId != null ? getNumber(source.resolvedByUserId) : null,
    resolvedByName: getOptionalString(source.resolvedByName) ?? null,
    status: normalizeUnlockStatus(source.status),
    reasonCode: normalizeUnlockReasonCode(source.reasonCode),
    reasonText: getOptionalString(source.reasonText) ?? null,
    hrReasonCode: getOptionalString(source.hrReasonCode) ?? null,
    hrReasonText: getOptionalString(source.hrReasonText) ?? null,
    unlockDeadline: getOptionalString(source.unlockDeadline) ?? null,
    requestedAt: getString(source.requestedAt),
    resolvedAt: getOptionalString(source.resolvedAt) ?? null,
    formTitle: getOptionalString(source.formTitle) ?? null,
    cycleId: source.cycleId != null ? getNumber(source.cycleId) : null,
    cycleName: getOptionalString(source.cycleName) ?? null,
    managerReviewDeadlineDate: getOptionalString(source.managerReviewDeadlineDate) ?? null,
  }
}

const normalizeAdjustment = (source: UnknownRecord): AdjustmentDto => {
  return {
    id: getNumber(source.id),
    questionText: getString(source.questionText),
    sortOrder: getNumber(source.sortOrder),
    originalYesNo: getOptionalString(source.originalYesNo) ?? null,
    originalRating: source.originalRating != null ? getNumber(source.originalRating) : null,
    proposedYesNo: getOptionalString(source.proposedYesNo) ?? null,
    proposedRating: source.proposedRating != null ? getNumber(source.proposedRating) : null,
    managerComment: getOptionalString(source.managerComment) ?? null,
    hrDecision: getOptionalString(source.hrDecision) ?? null,
    hrRejectionReason: getOptionalString(source.hrRejectionReason) ?? null,
    adjustedAt: getString(source.adjustedAt),
    adjustedBy: getNumber(source.adjustedBy),
  }
}

const normalizeForm = (form: unknown): SelfAssessmentFormDto => {
  const source = isRecord(form) ? form : {}

  return {
    id: getNumber(source.id),
    templateId: getNumber(source.templateId),
    cycleId: source.cycleId != null ? getNumber(source.cycleId) : null,
    cycleName: getOptionalString(source.cycleName) ?? null,
    cycleStartDate: getOptionalString(source.cycleStartDate) ?? null,
    cycleEndDate: getOptionalString(source.cycleEndDate) ?? null,
    title: getString(source.title, 'Self Assessment Form'),
    ratingSystem: normalizeRatingSystem(source.ratingSystem),
    tenPointYesMinRating: normalizeTenPointYesMinRating(source.tenPointYesMinRating),
    startDate: getOptionalString(source.startDate) ?? null,
    deadlineDate: getOptionalString(source.deadlineDate) ?? null,
    managerReviewDeadlineDate: getOptionalString(source.managerReviewDeadlineDate) ?? null,
    finalApprovalDeadlineDate: getOptionalString(source.finalApprovalDeadlineDate) ?? null,
    assignedAt: getOptionalString(source.assignedAt) ?? null,
    assignedBy: source.assignedBy != null ? getNumber(source.assignedBy) : null,
    status: getString(source.status),
    totalScore: source.totalScore != null ? getNumber(source.totalScore) : null,
    ratingCategory: getOptionalString(source.ratingCategory) ?? null,
    employeeRemarks: getOptionalString(source.employeeRemarks) ?? null,
    employeeSignatureId: source.employeeSignatureId != null ? getNumber(source.employeeSignatureId) : null,
    employeeSignatureData: getOptionalString(source.employeeSignatureData) ?? null,
    employeeSignatureType: getOptionalString(source.employeeSignatureType) ?? null,
    employeeSignatureDate: getOptionalString(source.employeeSignatureDate) ?? null,
    overallRemarks: getOptionalString(source.overallRemarks) ?? null,
    managerId: source.managerId != null ? getNumber(source.managerId) : null,
    managerName: getOptionalString(source.managerName) ?? null,
    managerSignatureId: source.managerSignatureId != null ? getNumber(source.managerSignatureId) : null,
    managerSignatureData: getOptionalString(source.managerSignatureData) ?? null,
    managerSignatureType: getOptionalString(source.managerSignatureType) ?? null,
    managerSignatureDate: getOptionalString(source.managerSignatureDate) ?? null,
    managerComments: getOptionalString(source.managerComments) ?? null,
    hrSignatureId: source.hrSignatureId != null ? getNumber(source.hrSignatureId) : null,
    hrSignatureData: getOptionalString(source.hrSignatureData) ?? null,
    hrSignatureType: getOptionalString(source.hrSignatureType) ?? null,
    hrSignatureDate: getOptionalString(source.hrSignatureDate) ?? null,
    hrFinalSignatureId: source.hrFinalSignatureId != null ? getNumber(source.hrFinalSignatureId) : null,
    hrFinalSignatureData: getOptionalString(source.hrFinalSignatureData) ?? null,
    hrFinalSignatureType: getOptionalString(source.hrFinalSignatureType) ?? null,
    hrFinalSignatureDate: getOptionalString(source.hrFinalSignatureDate) ?? null,
    hrAdjustmentSignatureId: source.hrAdjustmentSignatureId != null ? getNumber(source.hrAdjustmentSignatureId) : null,
    hrAdjustmentSignatureData: getOptionalString(source.hrAdjustmentSignatureData) ?? null,
    hrAdjustmentSignatureType: getOptionalString(source.hrAdjustmentSignatureType) ?? null,
    hrAdjustmentSignatureDate: getOptionalString(source.hrAdjustmentSignatureDate) ?? null,
    createdDate: getString(source.createdDate),
    submittedDate: getOptionalString(source.submittedDate) ?? null,
    assessmentDate: getOptionalString(source.assessmentDate) ?? null,
    employee: normalizeEmployeeInfo(isRecord(source.employee) ? source.employee : {}),
    answers: getArray(source.answers).map(a => normalizeAnswer(isRecord(a) ? a : {})),
    adjustments: getArray(source.adjustments).map(a => normalizeAdjustment(isRecord(a) ? a : {})),
    managerRevisedTotalScore: source.managerRevisedTotalScore != null ? getNumber(source.managerRevisedTotalScore) : null,
    finalApprovedTotalScore: source.finalApprovedTotalScore != null ? getNumber(source.finalApprovedTotalScore) : null,
    employeeAcknowledgedAt: getOptionalString(source.employeeAcknowledgedAt) ?? null,
    employeeDisputedAt: getOptionalString(source.employeeDisputedAt) ?? null,
    employeeDisputeReason: getOptionalString(source.employeeDisputeReason) ?? null,
    retakeRequestedAt: getOptionalString(source.retakeRequestedAt) ?? null,
    retakeSubmittedAt: getOptionalString(source.retakeSubmittedAt) ?? null,
    retakeRequestUsed: getBoolean(source.retakeRequestUsed),
    managerApprovedRetakeAt: getOptionalString(source.managerApprovedRetakeAt) ?? null,
    managerForceChangeApprovedAt: getOptionalString(source.managerForceChangeApprovedAt) ?? null,
    hrReviewRequired: source.hrReviewRequired != null ? getBoolean(source.hrReviewRequired) : null,
    hrReviewReason: getOptionalString(source.hrReviewReason) ?? null,
    hrReturnComments: getOptionalString(source.hrReturnComments) ?? null,
    hrReviewReasonAt: getOptionalString(source.hrReviewReasonAt) ?? null,
    hrName: getOptionalString(source.hrName) ?? null,
    submissionAttempts: getArray(source.submissionAttempts).map(a => normalizeSubmissionAttempt(isRecord(a) ? a : {})),
    pendingUnlockRequest: source.pendingUnlockRequest ? normalizeUnlockRequest(source.pendingUnlockRequest) : null,
  }
}

const normalizeFormList = (form: unknown): FormListDto => {
  const source = isRecord(form) ? form : {}

  return {
    id: getNumber(source.id),
    templateId: getNumber(source.templateId),
    title: getString(source.title, 'Self Assessment Form'),
    cycleId: source.cycleId != null ? getNumber(source.cycleId) : null,
    cycleName: getOptionalString(source.cycleName) ?? null,
    startDate: getOptionalString(source.startDate) ?? null,
    deadlineDate: getOptionalString(source.deadlineDate) ?? null,
    managerReviewDeadlineDate: getOptionalString(source.managerReviewDeadlineDate) ?? null,
    finalApprovalDeadlineDate: getOptionalString(source.finalApprovalDeadlineDate) ?? null,
    assignedAt: getOptionalString(source.assignedAt) ?? null,
    assignedBy: source.assignedBy != null ? getNumber(source.assignedBy) : null,
    employee: normalizeEmployeeInfo(isRecord(source.employee) ? source.employee : {}),
    status: getString(source.status),
    totalScore: source.totalScore != null ? getNumber(source.totalScore) : null,
    ratingCategory: getOptionalString(source.ratingCategory) ?? null,
    submittedDate: getOptionalString(source.submittedDate) ?? null,
    assessmentDate: getOptionalString(source.assessmentDate) ?? null,
    retakeSubmittedAt: getOptionalString(source.retakeSubmittedAt) ?? null,
    createdDate: getString(source.createdDate),
  }
}

const normalizeArchiveSnapshot = (snapshot: unknown): SelfAssessmentArchiveSnapshotDto => {
  const source = isRecord(snapshot) ? snapshot : {}
  return {
    id: getNumber(source.id),
    originalFormId: getNumber(source.originalFormId),
    employeeId: getNumber(source.employeeId),
    employeeName: getString(source.employeeName),
    employeeStaffNo: getOptionalString(source.employeeStaffNo) ?? null,
    departmentId: source.departmentId != null ? getNumber(source.departmentId) : null,
    departmentName: getOptionalString(source.departmentName) ?? null,
    positionId: source.positionId != null ? getNumber(source.positionId) : null,
    positionName: getOptionalString(source.positionName) ?? null,
    templateId: source.templateId != null ? getNumber(source.templateId) : null,
    templateTitle: getString(source.templateTitle),
    cycleId: source.cycleId != null ? getNumber(source.cycleId) : null,
    cycleName: getOptionalString(source.cycleName) ?? null,
    archivedStatus: getString(source.archivedStatus),
    rejectionReason: getString(source.rejectionReason),
    hrUserId: getNumber(source.hrUserId),
    hrUserName: getOptionalString(source.hrUserName) ?? null,
    archivedAt: getString(source.archivedAt),
    retakeDeadline: getString(source.retakeDeadline),
    totalScore: source.totalScore != null ? getNumber(source.totalScore) : null,
    managerRevisedTotalScore: source.managerRevisedTotalScore != null ? getNumber(source.managerRevisedTotalScore) : null,
    finalApprovedTotalScore: source.finalApprovedTotalScore != null ? getNumber(source.finalApprovedTotalScore) : null,
    ratingCategory: getOptionalString(source.ratingCategory) ?? null,
    formSnapshot: getString(source.formSnapshot),
  }
}

const normalizeCycleInfo = (cycle: unknown): CycleInfoDto | null => {
  if (!isRecord(cycle)) return null
  return {
    id: getNumber(cycle.id),
    name: getString(cycle.name),
    code: getString(cycle.code),
    startDate: getString(cycle.startDate),
    endDate: getString(cycle.endDate),
  }
}

const normalizeSetDeadlineResponse = (response: unknown): SetTemplateDeadlineResponse => {
  const source = isRecord(response) ? response : {}
  return {
    templateId: getNumber(source.templateId),
    templateTitle: getString(source.templateTitle),
    departmentId: getNumber(source.departmentId),
    departmentName: getString(source.departmentName),
    positionId: getNumber(source.positionId),
    positionName: getString(source.positionName),
    title: getString(source.title),
    deadlineDate: getString(source.deadlineDate),
    activeCycle: normalizeCycleInfo(source.activeCycle) ?? { id: 0, name: '', code: '', startDate: '', endDate: '' },
    createdCount: getNumber(source.createdCount),
    skippedCount: getNumber(source.skippedCount),
  }
}

const normalizeAssignmentResponse = (response: unknown): SelfAssessmentAssignmentResponse => {
  const source = isRecord(response) ? response : {}
  return {
    createdCount: getNumber(source.createdCount),
    skippedExistingCount: getNumber(source.skippedExistingCount),
    skippedNoTemplateCount: getNumber(source.skippedNoTemplateCount),
    skippedIneligibleCount: getNumber(source.skippedIneligibleCount),
    activeCycle: normalizeCycleInfo(source.activeCycle),
  }
}

const normalizeAssignmentPreview = (preview: unknown): SelfAssessmentAssignmentPreviewDto => {
  const source = isRecord(preview) ? preview : {}
  const assignmentStatus = getString(source.assignmentStatus)

  return {
    departmentId: getNumber(source.departmentId),
    departmentName: getString(source.departmentName),
    positionId: getNumber(source.positionId),
    positionName: getString(source.positionName),
    templateId: source.templateId != null ? getNumber(source.templateId) : null,
    templateTitle: getOptionalString(source.templateTitle) ?? null,
    ratingSystem: source.ratingSystem != null ? normalizeRatingSystem(source.ratingSystem) : null,
    questionCount: getNumber(source.questionCount),
    assignmentStatus:
      assignmentStatus === 'ALREADY_ASSIGNED' || assignmentStatus === 'NO_TEMPLATE'
        ? assignmentStatus
        : 'NOT_ASSIGNED',
    assignedCount: getNumber(source.assignedCount),
  }
}

const normalizeSettings = (settings: unknown): SelfAssessmentSettingsDto => {
  const source = isRecord(settings) ? settings : {}
  return {
    ratingSystem: normalizeRatingSystem(source.ratingSystem),
    tenPointYesMinRating: normalizeTenPointYesMinRating(source.tenPointYesMinRating),
    ratingSystemEditable: getBoolean(source.ratingSystemEditable, true),
    ratingSystemLockReason: getOptionalString(source.ratingSystemLockReason) ?? null,
  }
}

const normalizeTemplateQuestion = (q: unknown): QuestionDto => {
  const qs = isRecord(q) ? q : {}
  return {
    id: getNumber(qs.id),
    questionText: getString(qs.questionText),
    sortOrder: getNumber(qs.sortOrder),
    createdBy: getNumber(qs.createdBy),
    createdByRoleId: qs.createdByRoleId != null ? getNumber(qs.createdByRoleId) : null,
    isManagerAdded: getBoolean(qs.isManagerAdded),
    canEdit: getBoolean(qs.canEdit, true),
    canDeactivate: getBoolean(qs.canDeactivate, true),
    canHighlight: getBoolean(qs.canHighlight),
    createdOn: getString(qs.createdOn),
    deletedAt: getOptionalString(qs.deletedAt) ?? null,
    deletedBy: qs.deletedBy != null ? getNumber(qs.deletedBy) : null,
  }
}

const normalizeTemplate = (template: unknown): SelfAssessmentFormTemplateDto => {
  const source = isRecord(template) ? template : {}

  return {
    id: getNumber(source.id),
    title: getString(source.title),
    departmentId: getNumber(source.departmentId),
    departmentName: getString(source.departmentName),
    positionId: getNumber(source.positionId),
    positionName: getString(source.positionName),
    reviewCycleId: source.reviewCycleId != null ? getNumber(source.reviewCycleId) : null,
    reviewCycleName: getOptionalString(source.reviewCycleName) ?? null,
    timelineMode: getString(source.timelineMode).toUpperCase() === 'MANUAL' ? 'MANUAL' : 'REVIEW_CYCLE',
    manualStartDate: getOptionalString(source.manualStartDate) ?? null,
    manualEndDate: getOptionalString(source.manualEndDate) ?? null,
    isActive: getBoolean(source.isActive),
    ratingSystem: normalizeRatingSystem(source.ratingSystem),
    tenPointYesMinRating: normalizeTenPointYesMinRating(source.tenPointYesMinRating),
    isLocked: getBoolean(source.isLocked),
    isAssignedToDeadline: getBoolean(source.isAssignedToDeadline, getBoolean(source.isLocked)),
    questions: getArray(source.questions).map(normalizeTemplateQuestion),
    deletedQuestions: getArray(source.deletedQuestions).map(normalizeTemplateQuestion),
    createdOn: getString(source.createdOn),
    createdBy: getNumber(source.createdBy),
  }
}

const normalizeCopiedTemplate = (template: unknown): CopiedSelfAssessmentFormTemplateDto => {
  const source = isRecord(template) ? template : {}

  const departmentId =
    parsePositiveId(source.departmentId) ?? parsePositiveId(source.department_id) ?? 0
  const positionId = parsePositiveId(source.positionId) ?? parsePositiveId(source.position_id) ?? 0

  return {
    id: getNumber(source.id),
    sourceTemplateId: getNumber(source.sourceTemplateId),
    title: getString(source.title),
    ratingSystem: normalizeRatingSystem(source.ratingSystem),
    tenPointYesMinRating: normalizeTenPointYesMinRating(source.tenPointYesMinRating),
    departmentId,
    positionId,
    departmentName: getOptionalString(source.departmentName ?? source.department_name) ?? null,
    positionName: getOptionalString(source.positionName ?? source.position_name) ?? null,
    questions: getArray(source.questions).map(normalizeTemplateQuestion),
    deletedQuestions: getArray(source.deletedQuestions).map(normalizeTemplateQuestion),
    createdOn: getString(source.createdOn),
    createdBy: getNumber(source.createdBy),
  }
}

const normalizeTemplateActiveCheckResult = (result: unknown): TemplateActiveCheckResultDto => {
  const source = isRecord(result) ? result : {}

  return {
    departmentId: getNumber(source.departmentId),
    positionId: getNumber(source.positionId),
    templateId: getNumber(source.templateId),
    templateTitle: getString(source.templateTitle),
    departmentName: getString(source.departmentName),
    positionName: getString(source.positionName),
    reviewCycleId: source.reviewCycleId != null ? getNumber(source.reviewCycleId) : null,
    reviewCycleName: getOptionalString(source.reviewCycleName) ?? null,
  }
}

const normalizeQuestionBankItem = (question: unknown): QuestionBankDto => {
  const source = isRecord(question) ? question : {}

  return {
    id: getNumber(source.id),
    questionText: getString(source.questionText),
    isActive: getBoolean(source.isActive),
    ownerRoleId: getNumber(source.ownerRoleId),
    createdBy: getNumber(source.createdBy),
    createdByRoleId: source.createdByRoleId != null ? getNumber(source.createdByRoleId) : null,
    departmentId: source.departmentId != null ? getNumber(source.departmentId) : null,
    departmentName: getOptionalString(source.departmentName) ?? null,
    createdOn: getString(source.createdOn),
    updatedBy: source.updatedBy != null ? getNumber(source.updatedBy) : null,
    updatedOn: getOptionalString(source.updatedOn) ?? null,
  }
}

const normalizeScoreRecord = (record: unknown): ScoreRecordDto => {
  const source = isRecord(record) ? record : {}
  return {
    id: getNumber(source.id),
    employee: normalizeEmployeeInfo(isRecord(source.employee) ? source.employee : {}),
    status: getString(source.status),
    finalApprovedScore: source.finalApprovedScore != null ? getNumber(source.finalApprovedScore) : null,
    performance: getOptionalString(source.performance) ?? null,
    cycleId: source.cycleId != null ? getNumber(source.cycleId) : null,
    cycleName: getOptionalString(source.cycleName) ?? null,
    submittedDate: getOptionalString(source.submittedDate) ?? null,
    createdDate: getString(source.createdDate),
    finalApprovalDate: getOptionalString(source.finalApprovalDate) ?? null,
  }
}

export interface SelfAssessmentTemplateImportValidRow {
  rowNumber: number
  questionText: string
}

export interface SelfAssessmentTemplateImportInvalidRow {
  rowNumber: number
  questionText: string | null
  errors: string[]
}

export interface SelfAssessmentTemplateImportValidationResponse {
  totalRows: number
  validRows: number
  invalidRows: number
  validRowData: SelfAssessmentTemplateImportValidRow[]
  invalidRowsData: SelfAssessmentTemplateImportInvalidRow[]
}

export const selfAssessmentFormApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyFormStatus: builder.query<FormStatusDto, void>({
      query: () => '/self-assessment-forms/me/status',
      transformResponse: (response: unknown) => {
        const responseData = getResponseData(response)
        const data = isRecord(responseData) ? responseData : {}
        return {
          status: getOptionalString(data.status) ?? null,
          isEligible: getBoolean(data.isEligible),
          hasActiveTemplate: getBoolean(data.hasActiveTemplate),
          deadlinePassed: getBoolean(data.deadlinePassed),
          message: getOptionalString(data.message) ?? null,
        }
      },
    }),

    getMyCurrentForm: builder.query<SelfAssessmentFormDto, void>({
      query: () => '/self-assessment-forms/me/current',
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    saveDraft: builder.mutation<SelfAssessmentFormDto, SaveDraftRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/me/draft',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    submitForm: builder.mutation<SelfAssessmentFormDto, SubmitFormRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/me/submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    getReviewForms: builder.query<FormListDto[], void>({
      query: () => '/self-assessment-forms/reviews',
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeFormList),
    }),

    getHrReviewForms: builder.query<FormListDto[], void>({
      query: () => '/self-assessment-forms/hr/review',
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeFormList),
    }),

    getAllFormsForHr: builder.query<FormListDto[], void>({
      query: () => '/self-assessment-forms/hr/all',
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeFormList),
    }),

    getActiveCycleFormsForHr: builder.query<ActiveCycleFormsDto, void>({
      query: () => '/self-assessment-forms/hr/active-cycle',
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => {
        const data = getResponseData(response)
        const source = isRecord(data) ? data : {}
        return {
          activeCycle: normalizeCycleInfo(source.activeCycle),
          forms: getArray(source.forms).map(normalizeFormList),
        }
      },
    }),

    getActiveCycleFormsForManager: builder.query<ActiveCycleFormsDto, void>({
      query: () => '/self-assessment-forms/manager/active-cycle',
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => {
        const data = getResponseData(response)
        const source = isRecord(data) ? data : {}
        return {
          activeCycle: normalizeCycleInfo(source.activeCycle),
          forms: getArray(source.forms).map(normalizeFormList),
        }
      },
    }),

    getScoreRecords: builder.query<ScoreRecordDto[], void>({
      query: () => '/self-assessment-forms/score-records',
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeScoreRecord),
    }),

    getFormById: builder.query<SelfAssessmentFormDto, number>({
      query: (id) => `/self-assessment-forms/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'SelfAssessmentForm', id }],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    managerReview: builder.mutation<SelfAssessmentFormDto, { formId: number; request: ManagerReviewRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/manager-review`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    managerRequestRetake: builder.mutation<SelfAssessmentFormDto, { formId: number; request: ManagerRetakeRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/manager-request-retake`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrRequestRetake: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrRetakeRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-request-retake`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    employeeRetakeSubmit: builder.mutation<SelfAssessmentFormDto, { formId: number; request: EmployeeRetakeSubmitRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/retake-submit`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    managerApproveRetake: builder.mutation<SelfAssessmentFormDto, { formId: number; request?: ManagerApproveRetakeRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/manager-approve-retake`,
        method: 'POST',
        body: request ?? {},
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    managerForceChangeRetake: builder.mutation<SelfAssessmentFormDto, { formId: number; request: ManagerForceChangeRetakeRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/manager-force-change-retake`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrApproveManagerReview: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrApproveManagerReviewRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-approve-manager-review`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrRejectManagerReview: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrRejectManagerReviewRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-reject-manager-review`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrReturnDisputedReview: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrReturnDisputedReviewRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-return-disputed-review`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrReturnBack: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrReturnBackRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-return-back`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrApproveForm: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrApproveFormRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/hr-approve`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    hrReopenForm: builder.mutation<SelfAssessmentFormDto, { formId: number; request: HrReopenFormRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/reopen`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    employeeAcknowledge: builder.mutation<SelfAssessmentFormDto, number>({
      query: (formId) => ({
        url: `/self-assessment-forms/${formId}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    employeeDispute: builder.mutation<SelfAssessmentFormDto, { formId: number; request: EmployeeDisputeRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/dispute`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeForm(getResponseData(response)),
    }),

    requestSelfAssessmentUnlock: builder.mutation<SelfAssessmentUnlockRequestDto, { formId: number; request: SelfAssessmentUnlockRequestActionRequest }>({
      query: ({ formId, request }) => ({
        url: `/self-assessment-forms/${formId}/unlock-requests/me`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentUnlockRequest'],
      transformResponse: (response: unknown) => normalizeUnlockRequest(getResponseData(response)),
    }),

    getSelfAssessmentUnlockRequests: builder.query<SelfAssessmentUnlockRequestDto[], void>({
      query: () => '/self-assessment-forms/hr/unlock-requests',
      providesTags: ['SelfAssessmentUnlockRequest'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeUnlockRequest),
    }),

    unlockSelfAssessmentRequest: builder.mutation<
      SelfAssessmentUnlockRequestDto,
      { requestId: number; request: SelfAssessmentUnlockRequestUnlockRequest }
    >({
      query: ({ requestId, request }) => ({
        url: `/self-assessment-forms/hr/unlock-requests/${requestId}/unlock`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentUnlockRequest'],
      transformResponse: (response: unknown) => normalizeUnlockRequest(getResponseData(response)),
    }),

    rejectSelfAssessmentUnlockRequest: builder.mutation<SelfAssessmentUnlockRequestDto, { requestId: number; request: SelfAssessmentUnlockRejectRequest }>({
      query: ({ requestId, request }) => ({
        url: `/self-assessment-forms/hr/unlock-requests/${requestId}/reject`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentUnlockRequest'],
      transformResponse: (response: unknown) => normalizeUnlockRequest(getResponseData(response)),
    }),

    getAllTemplates: builder.query<SelfAssessmentFormTemplateDto[], void>({
      query: () => '/self-assessment-forms/templates',
      providesTags: ['SelfAssessmentTemplates'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeTemplate),
    }),

    getTemplateById: builder.query<SelfAssessmentFormTemplateDto, number>({
      query: (id) => `/self-assessment-forms/templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'SelfAssessmentTemplates', id }],
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
    }),

    copyTemplate: builder.mutation<CopiedSelfAssessmentFormTemplateDto, number>({
      query: (id) => ({
        url: `/self-assessment-forms/templates/${id}/copy`,
        method: 'POST',
      }),
      invalidatesTags: ['SelfAssessmentCopiedTemplate'],
      transformResponse: (response: unknown) => normalizeCopiedTemplate(getResponseData(response)),
    }),

    getCopiedTemplate: builder.query<CopiedSelfAssessmentFormTemplateDto | null, void>({
      query: () => '/self-assessment-forms/templates/copied',
      providesTags: ['SelfAssessmentCopiedTemplate'],
      transformResponse: (response: unknown) => {
        const data = getResponseData(response)
        return data ? normalizeCopiedTemplate(data) : null
      },
    }),

    deleteCopiedTemplate: builder.mutation<void, void>({
      query: () => ({
        url: '/self-assessment-forms/templates/copied',
        method: 'DELETE',
      }),
      invalidatesTags: ['SelfAssessmentCopiedTemplate'],
    }),

    getActiveTemplate: builder.query<SelfAssessmentFormTemplateDto | null, { departmentId: number; positionId: number }>({
      query: ({ departmentId, positionId }) =>
        `/self-assessment-forms/templates/active?departmentId=${departmentId}&positionId=${positionId}`,
      transformResponse: (response: unknown) => {
        const data = getResponseData(response)
        return data ? normalizeTemplate(data) : null
      },
    }),

    createTemplate: builder.mutation<SelfAssessmentFormTemplateDto, CreateTemplateRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentTemplates'],
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
    }),

    checkActiveTemplateConflicts: builder.mutation<TemplateActiveCheckResultDto[], TemplateActiveCheckRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/templates/active-check',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) =>
        getArray(getResponseData(response)).map(normalizeTemplateActiveCheckResult),
    }),

    updateTemplate: builder.mutation<SelfAssessmentFormTemplateDto, { id: number; request: UpdateTemplateRequest }>({
      query: ({ id, request }) => ({
        url: `/self-assessment-forms/templates/${id}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'SelfAssessmentForm',
        'SelfAssessmentTemplates',
        { type: 'SelfAssessmentTemplates', id },
      ],
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
    }),

    setTemplateDeadline: builder.mutation<SetTemplateDeadlineResponse, { templateId: number; request: SetTemplateDeadlineRequest }>({
      query: ({ templateId, request }) => ({
        url: `/self-assessment-forms/templates/${templateId}/set-deadline`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentTemplates'],
      transformResponse: (response: unknown) => normalizeSetDeadlineResponse(getResponseData(response)),
    }),

    assignSelfAssessmentForms: builder.mutation<SelfAssessmentAssignmentResponse, SelfAssessmentAssignmentRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/hr/assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SelfAssessmentForm', 'SelfAssessmentTemplates'],
      transformResponse: (response: unknown) => normalizeAssignmentResponse(getResponseData(response)),
    }),

    previewSelfAssessmentAssignments: builder.query<SelfAssessmentAssignmentPreviewDto[], SelfAssessmentAssignmentPreviewRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/hr/assignments/preview',
        method: 'POST',
        body,
      }),
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeAssignmentPreview),
    }),

    getSelfAssessmentSettings: builder.query<SelfAssessmentSettingsDto, void>({
      query: () => '/self-assessment-forms/settings',
      providesTags: ['SelfAssessmentSettings'],
      transformResponse: (response: unknown) => normalizeSettings(getResponseData(response)),
    }),

    updateSelfAssessmentSettings: builder.mutation<SelfAssessmentSettingsDto, SelfAssessmentSettingsRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SelfAssessmentSettings'],
      transformResponse: (response: unknown) => normalizeSettings(getResponseData(response)),
    }),

    getQuestionBank: builder.query<QuestionBankDto[], { includeInactive?: boolean } | void>({
      query: (arg) => {
        const includeInactive = typeof arg === 'object' ? arg.includeInactive === true : false
        return `/self-assessment-forms/question-bank?includeInactive=${includeInactive}`
      },
      providesTags: ['QuestionBank'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeQuestionBankItem),
    }),

    createQuestionBankItem: builder.mutation<QuestionBankDto, QuestionBankRequest>({
      query: (body) => ({
        url: '/self-assessment-forms/question-bank',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['QuestionBank'],
      transformResponse: (response: unknown) => normalizeQuestionBankItem(getResponseData(response)),
    }),

    updateQuestionBankItem: builder.mutation<QuestionBankDto, { id: number; request: QuestionBankRequest }>({
      query: ({ id, request }) => ({
        url: `/self-assessment-forms/question-bank/${id}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['QuestionBank'],
      transformResponse: (response: unknown) => normalizeQuestionBankItem(getResponseData(response)),
    }),

    updateQuestionBankItemStatus: builder.mutation<QuestionBankDto, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/self-assessment-forms/question-bank/${id}/active`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['QuestionBank'],
      transformResponse: (response: unknown) => normalizeQuestionBankItem(getResponseData(response)),
    }),

    getArchiveList: builder.query<
      { content: SelfAssessmentArchiveSnapshotDto[]; totalElements: number; totalPages: number },
      { page?: number; size?: number; search?: string } | void
    >({
      query: (arg) => {
        const page = typeof arg === 'object' ? (arg.page ?? 0) : 0
        const size = typeof arg === 'object' ? (arg.size ?? 20) : 20
        const search = typeof arg === 'object' ? arg.search : undefined
        const params = new URLSearchParams({ page: String(page), size: String(size) })
        if (search) params.append('search', search)
        return `/self-assessment-forms/archive?${params.toString()}`
      },
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => {
        const data = getResponseData(response) as Record<string, unknown> | null
        const content = (data as Record<string, unknown>)?.content
        return {
          content: getArray(content).map(normalizeArchiveSnapshot),
          totalElements: Number((data as Record<string, unknown>)?.totalElements ?? 0),
          totalPages: Number((data as Record<string, unknown>)?.totalPages ?? 0),
        }
      },
    }),

    getArchiveDetail: builder.query<SelfAssessmentArchiveSnapshotDto, number>({
      query: (archiveId) => `/self-assessment-forms/archive/${archiveId}`,
      providesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeArchiveSnapshot(getResponseData(response)),
    }),

    validateSelfAssessmentTemplateImport: builder.mutation<
      { success: boolean; message: string; data: SelfAssessmentTemplateImportValidationResponse },
      FormData
    >({
      query: (body) => ({
        url: '/self-assessment-forms/templates/import/validate',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetMyFormStatusQuery,
  useGetMyCurrentFormQuery,
  useSaveDraftMutation,
  useSubmitFormMutation,
  useGetReviewFormsQuery,
  useGetHrReviewFormsQuery,
  useGetAllFormsForHrQuery,
  useGetActiveCycleFormsForHrQuery,
  useGetActiveCycleFormsForManagerQuery,
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useManagerRequestRetakeMutation,
  useHrRequestRetakeMutation,
  useEmployeeRetakeSubmitMutation,
  useManagerApproveRetakeMutation,
  useManagerForceChangeRetakeMutation,
  useHrApproveManagerReviewMutation,
  useHrRejectManagerReviewMutation,
  useHrReturnDisputedReviewMutation,
  useHrReturnBackMutation,
  useHrApproveFormMutation,
  useHrReopenFormMutation,
  useGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
  useCopyTemplateMutation,
  useGetCopiedTemplateQuery,
  useDeleteCopiedTemplateMutation,
  useGetActiveTemplateQuery,
  useCreateTemplateMutation,
  useCheckActiveTemplateConflictsMutation,
  useUpdateTemplateMutation,
  useSetTemplateDeadlineMutation,
  useAssignSelfAssessmentFormsMutation,
  usePreviewSelfAssessmentAssignmentsQuery,
  useGetSelfAssessmentSettingsQuery,
  useUpdateSelfAssessmentSettingsMutation,
  useGetQuestionBankQuery,
  useCreateQuestionBankItemMutation,
  useUpdateQuestionBankItemMutation,
  useUpdateQuestionBankItemStatusMutation,
  useEmployeeAcknowledgeMutation,
  useEmployeeDisputeMutation,
  useRequestSelfAssessmentUnlockMutation,
  useGetSelfAssessmentUnlockRequestsQuery,
  useUnlockSelfAssessmentRequestMutation,
  useRejectSelfAssessmentUnlockRequestMutation,
  useGetScoreRecordsQuery,
  useGetArchiveListQuery,
  useGetArchiveDetailQuery,
  useValidateSelfAssessmentTemplateImportMutation,
} = selfAssessmentFormApi
