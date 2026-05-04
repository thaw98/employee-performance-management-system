// src/app/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout } from '../features/auth/authSlice';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '') || 'http://localhost:8080';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${baseUrl}/api`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithAuthGuard: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    api.dispatch(logout());
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: [
    'User',
    'UserProfile',
    'Employee',
    'Criteria',
    'PIP',
    'Department',
    'Manager',
    'EmployeeTransfer',
    'Position',
    'LevelCode',
    'PositionDepartments',
    'DepartmentPositions',
    'Lookup',
    'KPI',
    'Notification',
    'Signature',
    'SelfAssessmentForm',
    'SelfAssessmentTemplates',
    'QuestionBank',
    'KpiCategory',
  ],
  endpoints: () => ({}),
});
