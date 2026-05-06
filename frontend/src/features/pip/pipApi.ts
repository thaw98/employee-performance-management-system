import { baseApi } from '../../app/baseApi'

export interface PipObjective {
  id: number
  description: string
  progressPercentage: number
  updatedAt: string
}

export interface FollowUpMeeting {
  id: number
  meetingTime: string
  status: string
  reminderSent: boolean
}

export interface User {
  id: number
  email: string
  employeeId?: string
  employee?: {
    id: number
    employeeName: string
    positionId?: number | null
    positionName?: string | null
    department?: {
      departmentName: string
    }
    position?: {
      positionName: string
    }
  }
}

export interface Pip {
  id: number
  employee: User
  manager: User
  status: 'ACTIVE' | 'AUTO_CLOSED' | 'REOPEN_REQUESTED' | 'COMPLETED' | 'CLOSED' | 'DENIED'
  startDate: string
  endDate: string
  originalEndDate?: string
  autoCloseDate?: string
  extendedEndDate?: string
  finalCloseDate?: string
  reopenReason?: string
  reviewReason?: string
  reopenDecision?: string
  reopenDecisionDate?: string
  closingRemarks?: string
  finalOutcome?: string
  employeeSignature?: string
  employeeSignedAt?: string
  employeeSignatureDate?: string
  managerSignature?: string
  managerSignedAt?: string
  managerSignatureDate?: string
  expectedImprovements?: string
  reasonForPlan?: string
  objectives: PipObjective[]
  overallProgressPercentage: number
  totalHours: number
  completedHours: number
  followUpMeetings: FollowUpMeeting[]
  createdAt: string
  updatedAt: string
}

export interface TrainingRecord {
  id: number
  trainingName: string
  trainingProvider?: string
  startDate: string
  endDate?: string
  completionDate?: string
  completionStatus: string
  status: string
  totalCompletedHours?: number
  percentageCompletion?: number
  feedbackNotes?: string
  createdDate?: string
  updatedDate?: string
}

export interface PipProgressUpdate {
  id: number
  objectiveId: number
  objectiveDescription?: string
  previousPercentage: number
  newPercentage: number
  feedback: string
  updatedBy: User
  updateDate?: string
  createdAt: string
}

export interface EligibleEmployee {
  employeeId: number
  staffId?: string
  employeeName: string
  departmentName: string
  totalScore: number
}

export interface EmployeeSignRequest {
  signature?: string
}

export interface ClosePipRequest {
  pipId: number
  finalOutcome: string
  closingRemarks: string
  signature?: string
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

const getOptionalString = (value: unknown) => {
  return typeof value === 'string' ? value : undefined
}

const getNumber = (value: unknown, fallback = 0) => {
  const numericValue = Number(value ?? fallback)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const getResponseData = (response: unknown) => {
  return isRecord(response) ? response.data : undefined
}

const normalizeObjective = (objective: unknown): PipObjective => {
  const source = isRecord(objective) ? objective : {}

  return {
    id: getNumber(source.id),
    description: getString(source.description),
    progressPercentage: getNumber(source.progressPercentage),
    updatedAt: getString(source.updatedAt ?? source.updatedDate),
  }
}

const normalizeMeeting = (meeting: unknown): FollowUpMeeting => {
  const source = isRecord(meeting) ? meeting : {}

  return {
    id: getNumber(source.id),
    meetingTime: getString(source.meetingTime),
    status: getString(source.status),
    reminderSent: Boolean(source.reminderSent),
  }
}

const normalizePerson = (person: unknown): User => {
  const source = isRecord(person) ? person : {}
  const departmentSource = getRecord(source, 'department')
  const positionSource = getRecord(source, 'position')
  const departmentPositionSource = getRecord(source, 'departmentPosition')
  const mappedPositionSource = departmentPositionSource ? getRecord(departmentPositionSource, 'position') : undefined

  const department = departmentSource
    ? {
      departmentName: getString(departmentSource.departmentName) || getString(departmentSource.name, 'N/A'),
    }
    : undefined

  const positionName =
    getString(positionSource?.positionName) ||
    getString(positionSource?.name) ||
    getString(source.positionName) ||
    getString(mappedPositionSource?.positionName) ||
    getString(mappedPositionSource?.name)

  const position = positionName
    ? {
      positionName,
    }
    : undefined

  return {
    id: getNumber(source.id),
    email: getString(source.email),
    employeeId: getOptionalString(source.employeeId) ?? getOptionalString(source.staffNo),
    employee: isRecord(person)
      ? {
        id: getNumber(source.id),
        employeeName: getString(source.employeeName) || getString(source.fullName) || getString(source.name, 'N/A'),
        positionId: getNumber(source.positionId ?? positionSource?.id ?? mappedPositionSource?.id, NaN) || null,
        positionName: positionName || null,
        department,
        position,
      }
      : undefined,
  }
}

const normalizeStatus = (status?: unknown): Pip['status'] => {
  const normalized = getString(status).trim().toUpperCase().replace(/\s+/g, '_')
  if (normalized === 'REOPENED') return 'ACTIVE'
  if (normalized === 'PENDING_CREATION') return 'ACTIVE'
  if (normalized === 'PENDING_CLOSE') return 'AUTO_CLOSED'
  if (normalized === 'PENDING_REOPEN') return 'REOPEN_REQUESTED'
  if (normalized === 'ACTIVE' || normalized === 'AUTO_CLOSED' || normalized === 'REOPEN_REQUESTED' || normalized === 'CLOSED' || normalized === 'COMPLETED' || normalized === 'DENIED') {
    return normalized
  }
  return 'ACTIVE'
}

const normalizePip = (pip: unknown): Pip => {
  const source = isRecord(pip) ? pip : {}

  return {
    id: getNumber(source.id),
    employee: normalizePerson(source.employee),
    manager: normalizePerson(source.manager),
    status: normalizeStatus(source.status),
    startDate: getString(source.startDate),
    endDate: getString(source.endDate),
    originalEndDate: getOptionalString(source.originalEndDate),
    autoCloseDate: getOptionalString(source.autoCloseDate),
    extendedEndDate: getOptionalString(source.extendedEndDate),
    finalCloseDate: getOptionalString(source.finalCloseDate),
    reopenReason: getOptionalString(source.reopenReason),
    reviewReason: getOptionalString(source.reviewReason),
    reopenDecision: getOptionalString(source.reopenDecision),
    reopenDecisionDate: getOptionalString(source.reopenDecisionDate),
    closingRemarks: getOptionalString(source.closingRemarks),
    finalOutcome: getOptionalString(source.finalOutcome),
    employeeSignature: getOptionalString(source.employeeSignature),
    employeeSignedAt: getOptionalString(source.employeeSignedAt),
    employeeSignatureDate: getOptionalString(source.employeeSignatureDate),
    managerSignature: getOptionalString(source.managerSignature),
    managerSignedAt: getOptionalString(source.managerSignedAt),
    managerSignatureDate: getOptionalString(source.managerSignatureDate),
    expectedImprovements: getOptionalString(source.expectedImprovements),
    reasonForPlan: getOptionalString(source.reasonForPlan),
    objectives: getArray(source.objectives).map(normalizeObjective),
    overallProgressPercentage: getNumber(source.overallProgressPercentage),
    totalHours: getNumber(source.totalHours),
    completedHours: getNumber(source.completedHours),
    followUpMeetings: getArray(source.followUpMeetings).map(normalizeMeeting),
    createdAt: getString(source.createdAt ?? source.createdDate),
    updatedAt: getString(source.updatedAt ?? source.updatedDate),
  }
}

const normalizeTrainingRecord = (record: unknown): TrainingRecord => {
  const source = isRecord(record) ? record : {}
  const completionStatus = getString(source.completionStatus ?? source.status)
  const endDate = getOptionalString(source.endDate ?? source.completionDate)

  return {
    id: getNumber(source.id),
    trainingName: getString(source.trainingName),
    trainingProvider: getOptionalString(source.trainingProvider),
    startDate: getString(source.startDate),
    endDate,
    completionDate: getOptionalString(source.completionDate ?? source.endDate),
    completionStatus,
    status: getString(source.status ?? source.completionStatus),
    totalCompletedHours: source.totalCompletedHours == null && source.total_completed_hours == null
      ? undefined
      : getNumber(source.totalCompletedHours ?? source.total_completed_hours),
    percentageCompletion: source.percentageCompletion == null && source.percentage_completion == null
      ? undefined
      : getNumber(source.percentageCompletion ?? source.percentage_completion),
    feedbackNotes: getOptionalString(source.feedbackNotes ?? source.feedback_notes),
    createdDate: getOptionalString(source.createdDate),
    updatedDate: getOptionalString(source.updatedDate),
  }
}

const normalizeProgressUpdate = (update: unknown): PipProgressUpdate => {
  const source = isRecord(update) ? update : {}
  const objectiveSource = getRecord(source, 'objective')

  return {
    id: getNumber(source.id),
    objectiveId: getNumber(source.objectiveId ?? objectiveSource?.id),
    objectiveDescription: getOptionalString(objectiveSource?.description ?? objectiveSource?.objectiveDescription),
    previousPercentage: getNumber(source.previousPercentage),
    newPercentage: getNumber(source.newPercentage ?? source.progressValue),
    feedback: getString(source.feedback ?? source.comments),
    updatedBy: normalizePerson(source.updatedBy),
    updateDate: getOptionalString(source.updateDate),
    createdAt: getString(source.createdAt ?? source.createdDate),
  }
}

export const pipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPips: builder.query<Pip[], { departmentId?: number; positionId?: number; employeeName?: string; status?: string; startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/pips',
        params: params || undefined,
      }),
      providesTags: ['PIP'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizePip),
    }),
    getPipById: builder.query<Pip, number>({
      query: (id) => `/pips/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PIP', id }],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    createPip: builder.mutation<Pip, { employeeId: number; startDate: string; endDate: string; totalHours: number; objectives: string[]; expectedImprovements?: string; reasonForPlan?: string }>({
      query: (body) => ({
        url: '/pips',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PIP'],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    updateProgress: builder.mutation<PipObjective, { objectiveId: number; progressPercentage: number; completedHours: number; feedback: string }>({
      query: ({ objectiveId, ...body }) => ({
        url: `/pips/objectives/${objectiveId}/progress`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
    }),
    scheduleMeeting: builder.mutation<FollowUpMeeting, { pipId: number; meetingTime: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/meetings`,
        method: 'POST',
        body,
      }),
      invalidatesTags: () => ['PIP'],
    }),
    closePip: builder.mutation<Pip, ClosePipRequest>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/close`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    employeeSign: builder.mutation<Pip, { pipId: number } & EmployeeSignRequest>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/employee-sign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { pipId }) => ['PIP', { type: 'PIP', id: pipId }],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    managerSign: builder.mutation<Pip, { pipId: number } & EmployeeSignRequest>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/manager-sign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { pipId }) => ['PIP', { type: 'PIP', id: pipId }],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    markPipCompleted: builder.mutation<Pip, number>({
      query: (pipId) => ({
        url: `/pips/${pipId}/completed`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, pipId) => ['PIP', { type: 'PIP', id: pipId }],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    reopenPip: builder.mutation<Pip, { pipId: number; reason: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/reopen`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    reviewPip: builder.mutation<Pip, { pipId: number; action: 'CONFIRMED' | 'DENIED'; reason?: string; extendedEndDate?: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/review`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: unknown) => normalizePip(getResponseData(response)),
    }),
    getTrainingHistory: builder.query<TrainingRecord[], string>({
      query: (employeeId) => `/pips/employees/${employeeId}/training`,
      providesTags: ['PIP'],
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeTrainingRecord),
    }),
    getObjectiveHistory: builder.query<PipProgressUpdate[], number>({
      query: (objectiveId) => `/pips/objectives/${objectiveId}/history`,
      transformResponse: (response: unknown) => getArray(getResponseData(response)).map(normalizeProgressUpdate),
    }),
    getEligibleEmployees: builder.query<EligibleEmployee[], void>({
      query: () => '/pips/eligible-employees',
      transformResponse: (response: unknown) => getArray(getResponseData(response)) as EligibleEmployee[],
    }),
  }),
})

export const {
  useGetPipsQuery,
  useGetPipByIdQuery,
  useCreatePipMutation,
  useUpdateProgressMutation,
  useScheduleMeetingMutation,
  useClosePipMutation,
  useEmployeeSignMutation,
  useManagerSignMutation,
  useMarkPipCompletedMutation,
  useReopenPipMutation,
  useReviewPipMutation,
  useGetTrainingHistoryQuery,
  useGetObjectiveHistoryQuery,
  useGetEligibleEmployeesQuery,
} = pipApi
