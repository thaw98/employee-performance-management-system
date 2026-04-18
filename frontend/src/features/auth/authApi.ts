// src/features/auth/authApi.ts
import { baseApi } from '../../app/baseApi';
import type { ApiResponse, LoginRequestBody, LoginResponseData, User } from '../../types/auth';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponseData>, LoginRequestBody>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation, useLazyGetMeQuery, useGetMeQuery } = authApi;