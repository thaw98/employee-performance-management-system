import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../auth/types'

export interface UserProfileDto {
  id: number
  employeeId: string
  email: string
  role: string
  profilePictureBase64?: string
}

export interface UpdateProfilePictureRequestDto {
  profilePictureBase64: string
}

export interface ChangePasswordRequestDto {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<UserProfileDto>, void>({
      query: () => '/users/profile',
      providesTags: ['UserProfile'],
    }),
    updateProfilePicture: builder.mutation<ApiResponse<UserProfileDto>, UpdateProfilePictureRequestDto>({
      query: (body) => ({
        url: '/users/profile/picture',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['UserProfile'],
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequestDto>({
      query: (body) => ({
        url: '/users/profile/password',
        method: 'PUT',
        body,
      }),
    }),
  }),
})

export const { useGetProfileQuery, useUpdateProfilePictureMutation, useChangePasswordMutation } = userApi
