import { baseApi } from '../../app/baseApi'

import type { ApiResponse, AuthUser, LoginRequestBody, LoginResponseData } from './types'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      ApiResponse<LoginResponseData>,
      LoginRequestBody
    >({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<ApiResponse<AuthUser>, void>({
      query: () => '/auth/me',
    }),
  }),
})

export const { useLoginMutation, useLazyGetMeQuery } = authApi
