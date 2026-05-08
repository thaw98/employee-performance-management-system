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
  employeeSignatureDate: string | null
  overallRemarks: string | null
  managerId: number | null
  managerName: string | null
  managerSignatureId: number | null
  managerSignatureDate: string | null
  managerComments: string | null
  hrSignatureId: number | null
  hrSignatureDate: string | null
  hrFinalSignatureId: number | null
  hrFinalSignatureDate: string | null
  hrAdjustmentSignatureId: number | null
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
  hrReviewRequired: boolean | null
  hrReviewReason: string | null
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
  deadlineDate: string
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
  employeeIds: number[]
  startDate: string
  deadlineDate: string
  managerReviewDeadlineDate: string
}

export interface SelfAssessmentAssignmentResponse {
  createdCount: number
  skippedExistingCount: number
  skippedNoTemplateCount: number
  skippedIneligibleCount: number
  activeCycle: CycleInfoDto
}

export type SelfAssessmentAssignmentPreviewStatus = 'NOT_ASSIGNED' | 'ALREADY_ASSIGNED' | 'NO_TEMPLATE'

export interface SelfAssessmentAssignmentPreviewRequest {
  targets: TemplateTargetPairRequest[]
  deadlineDate: string
  managerReviewDeadlineDate: string
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
  requiresHrReview?: boolean
  affectsCompensationOrPip?: boolean
  companyPolicyRequiresHrApproval?: boolean
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
  signatureId?: number | null
}

export interface HrApproveFormRequest {
  signatureId?: number | null
}

export interface HrReopenFormRequest {
  signatureId?: number | null
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
    employeeSignatureDate: getOptionalString(source.employeeSignatureDate) ?? null,
    overallRemarks: getOptionalString(source.overallRemarks) ?? null,
    managerId: source.managerId != null ? getNumber(source.managerId) : null,
    managerName: getOptionalString(source.managerName) ?? null,
    managerSignatureId: source.managerSignatureId != null ? getNumber(source.managerSignatureId) : null,
    managerSignatureDate: getOptionalString(source.managerSignatureDate) ?? null,
    managerComments: getOptionalString(source.managerComments) ?? null,
    hrSignatureId: source.hrSignatureId != null ? getNumber(source.hrSignatureId) : null,
    hrSignatureDate: getOptionalString(source.hrSignatureDate) ?? null,
    hrFinalSignatureId: source.hrFinalSignatureId != null ? getNumber(source.hrFinalSignatureId) : null,
    hrFinalSignatureDate: getOptionalString(source.hrFinalSignatureDate) ?? null,
    hrAdjustmentSignatureId: source.hrAdjustmentSignatureId != null ? getNumber(source.hrAdjustmentSignatureId) : null,
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
    hrReviewRequired: source.hrReviewRequired != null ? getBoolean(source.hrReviewRequired) : null,
    hrReviewReason: getOptionalString(source.hrReviewReason) ?? null,
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
    createdDate: getString(source.createdDate),
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
    activeCycle: normalizeCycleInfo(source.activeCycle) ?? { id: 0, name: '', code: '', startDate: '', endDate: '' },
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
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useHrApproveManagerReviewMutation,
  useHrRejectManagerReviewMutation,
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
} = selfAssessmentFormApi
