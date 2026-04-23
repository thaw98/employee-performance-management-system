import { baseApi } from '../../../app/baseApi'
import type {
  ApiResponse,
  CreateEmployeeAccountResponse,
  EmployeeDraftPayload,
  EmployeeInfo,
  EmployeeInfoPayload,
  MasterOption,
} from '../types/employee'

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createEmployee: builder.mutation<ApiResponse<EmployeeInfo>, EmployeeInfoPayload>({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    createDraft: builder.mutation<ApiResponse<EmployeeInfo>, EmployeeDraftPayload>({
      query: (body) => ({ url: '/employees/draft', method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation<
      ApiResponse<EmployeeInfo>,
      { id: number; body: EmployeeInfoPayload }
    >({
      query: ({ id, body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Employee'],
    }),
    getReligions: builder.query<ApiResponse<MasterOption[]>, void>({
      query: () => '/master/religions',
    }),
    getDepartments: builder.query<ApiResponse<MasterOption[]>, string>({
      query: (keyword) => `/departments/autocomplete?keyword=${encodeURIComponent(keyword)}`,
    }),
    getPositions: builder.query<
      ApiResponse<MasterOption[]>,
      { keyword: string; departmentId?: number }
    >({
      query: ({ keyword, departmentId }) => {
        const params = new URLSearchParams()
        params.set('keyword', keyword)
        if (departmentId != undefined) {
          params.set('departmentId', String(departmentId))
        }
        return `/positions/autocomplete?${params.toString()}`
      },
    }),
    createEmployeeAccount: builder.mutation<
      ApiResponse<CreateEmployeeAccountResponse>,
      { employeePkId: number; email: string; profilePictureUrl?: string }
    >({
      query: (body) => ({ url: '/users/employee-account', method: 'POST', body }),
    }),
    checkUserEmail: builder.query<ApiResponse<boolean>, string>({
      query: (email) => `/users/check-email?email=${encodeURIComponent(email)}`,
    }),
    checkStaffNrc: builder.query<ApiResponse<boolean>, { staffNrcNo: string; excludeId?: number }>({
      query: ({ staffNrcNo, excludeId }) => {
        const params = new URLSearchParams()
        params.set('staffNrcNo', staffNrcNo)
        if (excludeId != undefined) {
          params.set('excludeId', String(excludeId))
        }
        return `/employees/check-staff-nrc?${params.toString()}`
      },
    }),
  }),
})

export const {
  useCreateEmployeeMutation,
  useCreateDraftMutation,
  useUpdateEmployeeMutation,
  useGetReligionsQuery,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useCreateEmployeeAccountMutation,
  useLazyCheckUserEmailQuery,
  useLazyCheckStaffNrcQuery,
} = employeeApi
