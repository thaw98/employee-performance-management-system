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
  wallpaperUrl?: string
  language?: string
  timezone?: string
  timeFormat?: string
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
      // Prevent serving previous account profile from cache after logout/login switch.
      keepUnusedDataFor: 0,
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
    deleteProfilePicture: builder.mutation<ApiResponse<UserProfileDto>, void>({
      query: () => ({
        url: '/users/profile/picture',
        method: 'DELETE',
      }),
      invalidatesTags: ['UserProfile'],
    }),
    updateWallpaper: builder.mutation<ApiResponse<UserProfileDto>, File>({
      query: (file) => {
        const body = new FormData()
        body.append('file', file)
        return {
          url: '/users/profile/wallpaper',
          method: 'PUT',
          body,
        }
      },
      invalidatesTags: ['UserProfile'],
    }),
    deleteWallpaper: builder.mutation<ApiResponse<UserProfileDto>, void>({
      query: () => ({
        url: '/users/profile/wallpaper',
        method: 'DELETE',
      }),
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
  useDeleteProfilePictureMutation,
  useUpdateWallpaperMutation,
  useDeleteWallpaperMutation,
  useUploadProfilePictureMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = userApi
