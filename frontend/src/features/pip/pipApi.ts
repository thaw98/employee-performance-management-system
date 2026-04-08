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
  employeeId: string
  email: string
}

export interface Pip {
  id: number
  employee: User
  manager: User
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED'
  startDate: string
  endDate: string
  closingRemarks?: string
  finalOutcome?: string
  objectives: PipObjective[]
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

export const pipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPips: builder.query<Pip[], void>({
      query: () => '/pips',
      providesTags: ['PIP'],
      transformResponse: (response: any) => response.data,
    }),
    getPipById: builder.query<Pip, number>({
      query: (id) => `/pips/${id}`,
      providesTags: (result, error, id) => [{ type: 'PIP', id }],
      transformResponse: (response: any) => response.data,
    }),
    createPip: builder.mutation<Pip, { employeeId: string; startDate: string; endDate: string; totalHours: number; objectives: string[] }>({
      query: (body) => ({
        url: '/pips',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PIP'],
    }),
    updateProgress: builder.mutation<PipObjective, { objectiveId: number; progressPercentage: number; completedHours: number; feedback: string }>({
      query: ({ objectiveId, ...body }) => ({
        url: `/pips/objectives/${objectiveId}/progress`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { objectiveId }) => ['PIP'],
    }),
    scheduleMeeting: builder.mutation<FollowUpMeeting, { pipId: number; meetingTime: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/meetings`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { pipId }) => ['PIP'],
    }),
    closePip: builder.mutation<Pip, { pipId: number; finalOutcome: string; closingRemarks: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/close`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { pipId }) => ['PIP'],
    }),
    reopenPip: builder.mutation<Pip, { pipId: number; reason: string }>({
      query: ({ pipId, ...body }) => ({
        url: `/pips/${pipId}/reopen`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { pipId }) => ['PIP'],
    }),
    getTrainingHistory: builder.query<TrainingRecord[], string>({
      query: (employeeId) => `/pips/employees/${employeeId}/training`,
      transformResponse: (response: any) => response.data,
    }),
    getObjectiveHistory: builder.query<PipProgressUpdate[], number>({
      query: (objectiveId) => `/pips/objectives/${objectiveId}/history`,
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
  useGetTrainingHistoryQuery,
  useGetObjectiveHistoryQuery,
} = pipApi
