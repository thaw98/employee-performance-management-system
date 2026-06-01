import { baseApi } from '../../app/baseApi'
import type { ApiResponse } from '../auth/types'

export interface UserProfileDto {
  id: number
  employeeId: string
  name: string
  email: string
  role: string
  roleId: number
  /** Relative path (e.g. /api/public/profile-pictures/...) or absolute URL */
  profilePictureUrl?: string
  theme?: string
  wallpaperUrl?: string
  language?: string
  timezone?: string
  timeFormat?: string
  staffNo?: string | null
  fullName?: string | null
  departmentName?: string | null
  departmentId?: number | null
  positionName?: string | null
  employmentStatus?: string | null
  gender?: string | null
  nrcNo?: string | null
  hireDate?: string | null
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

export interface SignatureDto {
  id: number
  signatureData: string
  signatureType: string
  isDefault: boolean
  createdAt: string
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
    getDefaultSignature: builder.query<ApiResponse<SignatureDto | null>, void>({
      query: () => '/signatures/default',
      providesTags: ['Signature'],
      // Prevent serving previous account signatures from cache after logout/login switch.
      keepUnusedDataFor: 0,
    }),
    getAllSignatures: builder.query<ApiResponse<SignatureDto[]>, void>({
      query: () => '/signatures',
      providesTags: ['Signature'],
      keepUnusedDataFor: 0,
    }),
    saveDrawnSignature: builder.mutation<ApiResponse<SignatureDto>, { signaturePngDataUrl: string }>({
      query: (body) => ({
        url: '/signatures/drawn',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Signature'],
    }),
    uploadSignature: builder.mutation<ApiResponse<SignatureDto>, { file: File }>({
      query: ({ file }) => {
        const body = new FormData()
        body.append('file', file)
        return {
          url: '/signatures/upload',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Signature'],
    }),
    setDefaultSignature: builder.mutation<ApiResponse<SignatureDto>, number>({
      query: (signatureId) => ({
        url: `/signatures/${signatureId}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Signature'],
    }),
    deleteSignature: builder.mutation<ApiResponse<null>, number>({
      query: (signatureId) => ({
        url: `/signatures/${signatureId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Signature'],
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
  useGetDefaultSignatureQuery,
  useGetAllSignaturesQuery,
  useSaveDrawnSignatureMutation,
  useUploadSignatureMutation,
  useSetDefaultSignatureMutation,
  useDeleteSignatureMutation,
} = userApi
