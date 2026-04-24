import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../auth/types'

export interface UserProfileDto {
  id: number
  employeeId: string
  name: string
  email: string
  role: string
  /** Relative path (e.g. /api/public/profile-pictures/...) or absolute URL */
  profilePictureUrl?: string
  theme?: string
}

export interface ProfilePictureUploadResponseDto {
  profilePictureUrl: string
}

export interface ChangePasswordRequestDto {
  /** Required for normal password change from settings; omitted on forced first-login change. */
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<UserProfileDto>, void>({
      query: () => '/users/profile',
      providesTags: ['UserProfile'],
    }),
    updateProfilePicture: builder.mutation<ApiResponse<UserProfileDto>, File>({
      query: (file) => {
        const body = new FormData()
        body.append('file', file)
        return {
          url: '/users/profile/picture',
          method: 'PUT',
          body,
        }
      },
      invalidatesTags: ['UserProfile'],
    }),
    uploadProfilePicture: builder.mutation<ApiResponse<ProfilePictureUploadResponseDto>, File>({
      query: (file) => {
        const body = new FormData()
        body.append('file', file)
        return {
          url: '/files/profile-pictures',
          method: 'POST',
          body,
        }
      },
    }),
    updateProfile: builder.mutation<ApiResponse<UserProfileDto>, Partial<UserProfileDto>>({
      query: (body) => ({
        url: '/users/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['UserProfile'],
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequestDto>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetProfileQuery,
  useUpdateProfilePictureMutation,
  useUploadProfilePictureMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi
