// src/features/auth/forgotPasswordApi.ts
import { baseApi } from '../../app/baseApi';
import type { ApiResponse, LoginResponseData } from '../../types/auth';

// ─── Request types ───

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpSessionId: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Response types ───

export interface VerifyOtpResponseData {
  otpSessionId: string;
}

// ─── API ───

export const forgotPasswordApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendForgotPasswordOtp: builder.mutation<ApiResponse<null>, SendOtpRequest>({
      query: (body) => ({
        url: '/auth/forgot-password/send-otp',
        method: 'POST',
        body,
      }),
    }),
    verifyForgotPasswordOtp: builder.mutation<ApiResponse<VerifyOtpResponseData>, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/forgot-password/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    resendForgotPasswordOtp: builder.mutation<ApiResponse<null>, ResendOtpRequest>({
      query: (body) => ({
        url: '/auth/forgot-password/resend-otp',
        method: 'POST',
        body,
      }),
    }),
    resetForgotPassword: builder.mutation<ApiResponse<LoginResponseData>, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password/reset',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useSendForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
  useResetForgotPasswordMutation,
} = forgotPasswordApi;
