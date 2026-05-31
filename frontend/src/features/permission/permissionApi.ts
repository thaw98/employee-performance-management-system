import { baseApi } from '../../app/baseApi';

export interface PermissionModuleDto {
  id: number;
  moduleKey: string;
  displayName: string;
  description: string;
  sortOrder: number;
}

export interface PermissionActionDto {
  id: number;
  moduleKey: string;
  actionKey: string;
  displayName: string;
  sortOrder: number;
}

export interface PermissionToggle {
  moduleKey: string;
  actionKey: string;
  allowed: boolean;
}

export interface PermissionMatrixPositionRow {
  positionId: number;
  positionName: string;
  positionCode: string;
  levelCodeId: number;
  levelCode: string;
  levelCodeDescription: string;
  roleId: number;
  roleName: string;
  permissions: PermissionToggle[];
}

export interface PermissionMatrixDto {
  modules: PermissionModuleDto[];
  actions: PermissionActionDto[];
  positions: PermissionMatrixPositionRow[];
}

export interface PositionPermissionDto {
  positionId: number;
  positionName: string;
  positionCode: string;
  levelCode: string;
  levelCodeDescription: string;
  roleName: string;
  moduleKey: string;
  actionKey: string;
  allowed: boolean;
}

export interface UpdatePositionPermissionRequest {
  moduleKey?: string;
  permissions: {
    moduleKey: string;
    actionKey: string;
    allowed: boolean;
  }[];
}

export interface UserPermissionDto {
  userId: number;
  positionId: number;
  positionName: string;
  roleName: string;
  permissions: Record<string, Record<string, boolean>>;
}

export interface EmployeePermissionToggle {
  moduleKey: string;
  actionKey: string;
  positionAllowed: boolean | null;
  override: boolean | null;
  effective: boolean | null;
}

export interface EmployeePermissionRow {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  positionName: string;
  positionCode: string;
  departmentName: string;
  roleId: number;
  roleName: string;
  permissions: EmployeePermissionToggle[];
}

export interface EmployeePermissionDto {
  modules: PermissionModuleDto[];
  actions: PermissionActionDto[];
  employees: EmployeePermissionRow[];
}

export interface EmployeePermissionDetail {
  moduleKey: string;
  actionKey: string;
  positionPermission: boolean | null;
  override: boolean | null;
  effective: boolean | null;
}

export interface EmployeeEffectivePermissionDto {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  positionName: string;
  positionCode: string;
  positionId: number;
  roleId: number;
  roleName: string;
  departmentName: string;
  permissionDetails: EmployeePermissionDetail[];
}

export interface UpdateEmployeePermissionRequest {
  moduleKey?: string;
  permissions: {
    moduleKey: string;
    actionKey: string;
    override: boolean | null;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissionMatrix: builder.query<
      ApiResponse<PermissionMatrixDto>,
      { levelCodeId?: number; roleId?: number; moduleKey?: string } | void
    >({
      query: (params) => {
        const queryParts: string[] = [];
        if (params) {
          if (params.levelCodeId) queryParts.push(`levelCodeId=${params.levelCodeId}`);
          if (params.roleId) queryParts.push(`roleId=${params.roleId}`);
          if (params.moduleKey) queryParts.push(`moduleKey=${params.moduleKey}`);
        }
        const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        return `/permissions/matrix${qs}`;
      },
      providesTags: ['Permission'],
    }),

    getPositionPermissions: builder.query<
      ApiResponse<PositionPermissionDto[]>,
      number
    >({
      query: (positionId) => `/permissions/matrix/positions/${positionId}`,
      providesTags: ['Permission'],
    }),

    updatePositionPermissions: builder.mutation<
      ApiResponse<string>,
      { positionId: number; request: UpdatePositionPermissionRequest }
    >({
      query: ({ positionId, request }) => ({
        url: `/permissions/matrix/positions/${positionId}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['Permission'],
    }),

    getMyPermissions: builder.query<ApiResponse<UserPermissionDto>, void>({
      query: () => '/permissions/me',
      providesTags: ['Permission'],
    }),

    getEmployeePermissionMatrix: builder.query<
      ApiResponse<EmployeePermissionDto>,
      { search?: string; moduleKey?: string } | void
    >({
      query: (params) => {
        const queryParts: string[] = [];
        if (params) {
          if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
          if (params.moduleKey) queryParts.push(`moduleKey=${params.moduleKey}`);
        }
        const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        return `/permissions/matrix/employees${qs}`;
      },
      providesTags: ['Permission'],
    }),

    getEmployeeEffectivePermissions: builder.query<
      ApiResponse<EmployeeEffectivePermissionDto>,
      number
    >({
      query: (employeeId) => `/permissions/matrix/employees/${employeeId}`,
      providesTags: ['Permission'],
    }),

    saveEmployeePermissions: builder.mutation<
      ApiResponse<string>,
      { employeeId: number; request: UpdateEmployeePermissionRequest }
    >({
      query: ({ employeeId, request }) => ({
        url: `/permissions/matrix/employees/${employeeId}`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: ['Permission'],
    }),
  }),
});

export const {
  useGetPermissionMatrixQuery,
  useGetPositionPermissionsQuery,
  useUpdatePositionPermissionsMutation,
  useGetMyPermissionsQuery,
  useGetEmployeePermissionMatrixQuery,
  useGetEmployeeEffectivePermissionsQuery,
  useSaveEmployeePermissionsMutation,
} = permissionApi;
