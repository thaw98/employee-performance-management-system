import { baseApi } from '../../../app/baseApi'

export interface QuestionDto {
  id: number
  questionText: string
  sortOrder: number
  createdBy: number
  createdOn: string
}

export interface SelfAssessmentFormTemplateDto {
  id: number
  title: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
  isActive: boolean
  questions: QuestionDto[]
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
  createdBy: number
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
}

export interface UpdateTemplateRequest {
  title: string
  departmentId: number
  positionId: number
  isActive: boolean
  questions: QuestionRequest[]
}

export interface EmployeeInfoDto {
  id: number
  employeeId: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  positionId: number
  positionName: string
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
  employee: EmployeeInfoDto
  answers: AnswerDto[]
  adjustments: AdjustmentDto[]
}

export interface FormListDto {
  id: number
  employee: EmployeeInfoDto
  status: string
  totalScore: number | null
  ratingCategory: string | null
  submittedDate: string | null
  createdDate: string
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

export interface HrApproveManagerReviewRequest {
  signatureId: number
}

export interface HrRejectManagerReviewRequest {
  rejectionReason: string
  signatureId: number
}

export interface HrApproveFormRequest {
  signatureId: number
}

export interface HrReopenFormRequest {
  signatureId: number
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
    positionId: getNumber(positionSource?.id ?? source.positionId),
    positionName: getString(positionSource?.positionName ?? positionSource?.name ?? source.positionName, 'N/A'),
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
    employee: normalizeEmployeeInfo(isRecord(source.employee) ? source.employee : {}),
    answers: getArray(source.answers).map(a => normalizeAnswer(isRecord(a) ? a : {})),
    adjustments: getArray(source.adjustments).map(a => normalizeAdjustment(isRecord(a) ? a : {})),
  }
}

const normalizeFormList = (form: unknown): FormListDto => {
  const source = isRecord(form) ? form : {}

  return {
    id: getNumber(source.id),
    employee: normalizeEmployeeInfo(isRecord(source.employee) ? source.employee : {}),
    status: getString(source.status),
    totalScore: source.totalScore != null ? getNumber(source.totalScore) : null,
    ratingCategory: getOptionalString(source.ratingCategory) ?? null,
    submittedDate: getOptionalString(source.submittedDate) ?? null,
    createdDate: getString(source.createdDate),
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
    isActive: getBoolean(source.isActive),
    questions: getArray(source.questions).map(q => {
      const qs = isRecord(q) ? q : {}
      return {
        id: getNumber(qs.id),
        questionText: getString(qs.questionText),
        sortOrder: getNumber(qs.sortOrder),
        createdBy: getNumber(qs.createdBy),
        createdOn: getString(qs.createdOn),
      }
    }),
    createdOn: getString(source.createdOn),
    createdBy: getNumber(source.createdBy),
  }
}

const normalizeQuestionBankItem = (question: unknown): QuestionBankDto => {
  const source = isRecord(question) ? question : {}

  return {
    id: getNumber(source.id),
    questionText: getString(source.questionText),
    isActive: getBoolean(source.isActive),
    createdBy: getNumber(source.createdBy),
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

    getAllTemplates: builder.query<SelfAssessmentFormTemplateDto[], void>({
      query: () => '/self-assessment-forms/templates',
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeTemplate),
    }),

    getTemplateById: builder.query<SelfAssessmentFormTemplateDto, number>({
      query: (id) => `/self-assessment-forms/templates/${id}`,
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
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
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
    }),

    updateTemplate: builder.mutation<SelfAssessmentFormTemplateDto, { id: number; request: UpdateTemplateRequest }>({
      query: ({ id, request }) => ({
        url: `/self-assessment-forms/templates/${id}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['SelfAssessmentForm'],
      transformResponse: (response: unknown) => normalizeTemplate(getResponseData(response)),
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
  useGetFormByIdQuery,
  useManagerReviewMutation,
  useHrApproveManagerReviewMutation,
  useHrRejectManagerReviewMutation,
  useHrApproveFormMutation,
  useHrReopenFormMutation,
  useGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
  useGetActiveTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useGetQuestionBankQuery,
  useCreateQuestionBankItemMutation,
  useUpdateQuestionBankItemMutation,
  useUpdateQuestionBankItemStatusMutation,
} = selfAssessmentFormApi
