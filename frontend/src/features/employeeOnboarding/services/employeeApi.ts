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
    checkEmployeeId: builder.query<ApiResponse<boolean>, string>({
      query: (employeeId) => `/employees/check-employee-id?employeeId=${encodeURIComponent(employeeId)}`,
    }),
    checkEmailInEmployees: builder.query<ApiResponse<boolean>, string>({
      query: (email) => `/employees/check-email?email=${encodeURIComponent(email)}`,
    }),
    getReligions: builder.query<ApiResponse<MasterOption[]>, void>({
      query: () => '/master/religions',
    }),
    getDepartments: builder.query<ApiResponse<MasterOption[]>, string>({
      query: (keyword) => `/departments/autocomplete?keyword=${encodeURIComponent(keyword)}`,
    }),
    getPositions: builder.query<ApiResponse<MasterOption[]>, string>({
      query: (keyword) => `/positions/autocomplete?keyword=${encodeURIComponent(keyword)}`,
    }),
    createEmployeeAccount: builder.mutation<
      ApiResponse<CreateEmployeeAccountResponse>,
      { employeePkId: number }
    >({
      query: (body) => ({ url: '/users/employee-account', method: 'POST', body }),
    }),
    checkUserEmail: builder.query<ApiResponse<boolean>, string>({
      query: (email) => `/users/check-email?email=${encodeURIComponent(email)}`,
    }),
  }),
})

export const {
  useCreateEmployeeMutation,
  useCreateDraftMutation,
  useUpdateEmployeeMutation,
  useLazyCheckEmployeeIdQuery,
  useLazyCheckEmailInEmployeesQuery,
  useGetReligionsQuery,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useCreateEmployeeAccountMutation,
  useLazyCheckUserEmailQuery,
} = employeeApi
