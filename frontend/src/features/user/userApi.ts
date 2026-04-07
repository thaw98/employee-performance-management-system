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
  }),
})

export const { useGetProfileQuery, useUpdateProfilePictureMutation } = userApi
