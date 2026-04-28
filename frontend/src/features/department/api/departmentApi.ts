import { baseApi } from '../../../app/baseApi'
import type { ApiResponse } from '../../../types/auth'
import type { DepartmentDto, CreateDepartmentRequest, ManagerOption, UpdateDepartmentRequest } from '../types'

type DepartmentApiRaw = Partial<DepartmentDto> & {
  id?: number | string
  code?: string
  name?: string
  deptCode?: string
  deptName?: string
  departmentStatus?: string
  isActive?: boolean | string | number
  active?: boolean | string | number
  departmentid?: number | string
  departmentcode?: string
  departmentname?: string
  department_id?: number | string
  department_code?: string
  department_name?: string
  created_date?: string
  updated_date?: string
  managerId?: number | string | null
  manager_id?: number | string | null
  managerName?: string | null
  manager_name?: string | null
  managerStaffNo?: string | null
  manager_staff_no?: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const normalizeStatus = (status: unknown): DepartmentDto['status'] => {
  const normalized = String(status ?? '').trim().toLowerCase()
  if (
    normalized === 'inactive' ||
    normalized === 'in-active' ||
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'n' ||
    normalized === 'no'
  ) {
    return 'Inactive'
  }
  return 'Active'
}

const findAliasValue = (source: Record<string, unknown>, aliases: string[]): unknown => {
  for (const alias of aliases) {
    const value = source[alias]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  const normalizedAliasSet = new Set(aliases.map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, '')))
  for (const [key, value] of Object.entries(source)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (normalizedAliasSet.has(normalizedKey) && value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return undefined
}

const getByAliases = (raw: DepartmentApiRaw, aliases: string[]): unknown => {
  const directValue = findAliasValue(raw as Record<string, unknown>, aliases)
  if (directValue !== undefined) {
    return directValue
  }

  for (const value of Object.values(raw)) {
    if (!isRecord(value)) {
      continue
    }

    const nestedValue = findAliasValue(value, aliases)
    if (nestedValue !== undefined) {
      return nestedValue
    }
  }

  return undefined
}

const normalizeDepartment = (raw: DepartmentApiRaw): DepartmentDto => {
  const departmentId = Number(getByAliases(raw, ['departmentId', 'department_id', 'departmentid', 'id']) ?? 0)
  const code = String(getByAliases(raw, ['departmentCode', 'department_code', 'departmentcode', 'deptCode', 'code']) ?? '').trim()
  const name = String(getByAliases(raw, ['departmentName', 'department_name', 'departmentname', 'deptName', 'name']) ?? '').trim()
  const explicitStatus = getByAliases(raw, ['status', 'departmentStatus'])
  const statusFlag = explicitStatus ?? getByAliases(raw, ['isActive', 'active', 'enabled'])
  const status = normalizeStatus(statusFlag)
  return {
    departmentId: Number.isFinite(departmentId) ? departmentId : 0,
    departmentCode: code,
    departmentName: name,
    status,
    createdDate: String(getByAliases(raw, ['createdDate', 'created_date']) ?? ''),
    updatedDate: String(getByAliases(raw, ['updatedDate', 'updated_date']) ?? ''),
    managerId: normalizeOptionalNumber(getByAliases(raw, ['managerId', 'manager_id'])),
    managerName: normalizeOptionalString(getByAliases(raw, ['managerName', 'manager_name'])),
    managerStaffNo: normalizeOptionalString(getByAliases(raw, ['managerStaffNo', 'manager_staff_no'])),
  }
}

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const normalizeOptionalString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text || null
}

const extractDepartmentRows = (data: unknown): DepartmentApiRaw[] => {
  if (Array.isArray(data)) {
    return data as DepartmentApiRaw[]
  }
  if (data && typeof data === 'object') {
    const container = data as Record<string, unknown>
    const candidateKeys = ['items', 'rows', 'content', 'departments', 'departmentList', 'records']
    for (const key of candidateKeys) {
      const value = container[key]
      if (Array.isArray(value)) {
        return value as DepartmentApiRaw[]
      }
    }
  }
  return []
}

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<ApiResponse<DepartmentDto[]>, void>({
      query: () => '/departments',
      transformResponse: (response: ApiResponse<unknown>) => {
        return {
          ...response,
          data: extractDepartmentRows(response.data).map(normalizeDepartment),
        }
      },
      providesTags: ['Department'],
    }),
    getDepartmentById: builder.query<ApiResponse<DepartmentDto>, number>({
      query: (id) => `/departments/${id}`,
      transformResponse: (response: ApiResponse<DepartmentApiRaw>) => ({
        ...response,
        data: response.data ? normalizeDepartment(response.data) : null,
      }),
      providesTags: (_result, _error, id) => [{ type: 'Department', id }],
    }),
    getManagerOptions: builder.query<ManagerOption[], void>({
      query: () => '/departments/managers/options',
      transformResponse: (response: ManagerOption[] | ApiResponse<ManagerOption[]>) => {
        if (Array.isArray(response)) {
          return response
        }
        return Array.isArray(response.data) ? response.data : []
      },
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation<ApiResponse<DepartmentDto>, CreateDepartmentRequest>({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<DepartmentApiRaw>) => ({
        ...response,
        data: response.data ? normalizeDepartment(response.data) : null,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation<ApiResponse<DepartmentDto>, { id: number; body: UpdateDepartmentRequest }>({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: ApiResponse<DepartmentApiRaw>) => ({
        ...response,
        data: response.data ? normalizeDepartment(response.data) : null,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
})

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetManagerOptionsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi
