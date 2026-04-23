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
  status: 'PENDING_CREATION' | 'PENDING_REOPEN' | 'PENDING_CLOSE' | 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'DENIED'
  startDate: string
  endDate: string
  reopenReason?: string
  reviewReason?: string
  closingRemarks?: string
  finalOutcome?: string
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
  completionDate: string
  status: string
}

export interface PipProgressUpdate {
  id: number
  objectiveId: number
  previousPercentage: number
  newPercentage: number
  feedback: string
  updatedBy: User
  createdAt: string
}

export interface EligibleEmployee {
  employeeId: number
  staffId?: string
  employeeName: string
  departmentName: string
  totalScore: number
}

const normalizePerson = (person: any): User => {
  const department = person?.department
    ? {
      departmentName: person.department.departmentName || person.department.name || 'N/A',
    }
    : undefined

  const position = person?.position
    ? {
      positionName: person.position.positionName || person.position.name || 'N/A',
    }
    : undefined

  return {
    id: Number(person?.id ?? 0),
    email: person?.email ?? '',
    employeeId: person?.employeeId ?? person?.staffNo ?? undefined,
    employee: person
      ? {
        id: Number(person?.id ?? 0),
        employeeName: person?.employeeName ?? person?.fullName ?? person?.name ?? 'N/A',
        department,
        position,
      }
      : undefined,
  }
}

const normalizeStatus = (status?: string): Pip['status'] => {
  const normalized = (status ?? '').trim().toUpperCase().replace(/\s+/g, '_')
  if (normalized === 'REOPENED') return 'ACTIVE'
  if (normalized === 'ACTIVE' || normalized === 'CLOSED' || normalized === 'COMPLETED' || normalized === 'DENIED' || normalized === 'PENDING_CREATION' || normalized === 'PENDING_REOPEN' || normalized === 'PENDING_CLOSE') {
    return normalized
  }
  return 'ACTIVE'
}

const normalizePip = (pip: any): Pip => ({
  ...pip,
  employee: normalizePerson(pip?.employee),
  manager: normalizePerson(pip?.manager),
  status: normalizeStatus(pip?.status),
  overallProgressPercentage: Number(pip?.overallProgressPercentage ?? 0),
  totalHours: Number(pip?.totalHours ?? 0),
  completedHours: Number(pip?.completedHours ?? 0),
  objectives: Array.isArray(pip?.objectives) ? pip.objectives : [],
  followUpMeetings: Array.isArray(pip?.followUpMeetings) ? pip.followUpMeetings : [],
  createdAt: pip?.createdAt ?? pip?.createdDate ?? '',
  updatedAt: pip?.updatedAt ?? pip?.updatedDate ?? '',
})

export const pipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPips: builder.query<Pip[], { departmentId?: number; positionId?: number; employeeName?: string; status?: string; startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/pips',
        params: params || undefined,
      }),
      providesTags: ['PIP'],
      transformResponse: (response: any) => (response.data ?? []).map(normalizePip),
    }),
    getPipById: builder.query<Pip, number>({
      query: (id) => `/pips/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PIP', id }],
      transformResponse: (response: any) => normalizePip(response.data),
    }),
    createPip: builder.mutation<Pip, { employeeId: number; startDate: string; endDate: string; totalHours: number; objectives: string[] }>({
      query: (body) => ({
        url: '/pips',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PIP'],
      transformResponse: (response: any) => normalizePip(response.data),
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
    closePip: builder.mutation<Pip, { pipId: number; finalOutcome: string; closingRemarks: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/close`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: any) => normalizePip(response.data),
    }),
    reopenPip: builder.mutation<Pip, { pipId: number; reason: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/reopen`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: any) => normalizePip(response.data),
    }),
    reviewPip: builder.mutation<Pip, { pipId: number; action: 'CONFIRMED' | 'DENIED'; reason?: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/review`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: () => ['PIP'],
      transformResponse: (response: any) => normalizePip(response.data),
    }),
    getTrainingHistory: builder.query<TrainingRecord[], string>({
      query: (employeeId) => `/pips/employees/${employeeId}/training`,
      transformResponse: (response: any) => response.data,
    }),
    getObjectiveHistory: builder.query<PipProgressUpdate[], number>({
      query: (objectiveId) => `/pips/objectives/${objectiveId}/history`,
      transformResponse: (response: any) => response.data,
    }),
    getEligibleEmployees: builder.query<EligibleEmployee[], void>({
      query: () => '/pips/eligible-employees',
      transformResponse: (response: any) => response.data,
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
  useReopenPipMutation,
  useReviewPipMutation,
  useGetTrainingHistoryQuery,
  useGetObjectiveHistoryQuery,
  useGetEligibleEmployeesQuery,
} = pipApi
