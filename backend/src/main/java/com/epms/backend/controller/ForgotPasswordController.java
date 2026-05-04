package com.epms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.dto.auth.ForgotPasswordResetRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordResendOtpRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordSendOtpRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordVerifyOtpRequestDto;
import com.epms.backend.dto.auth.VerifyOtpResponseDto;
import com.epms.backend.service.ForgotPasswordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/forgot-password")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @Valid @RequestBody ForgotPasswordSendOtpRequestDto request) {
        ApiResponse<Void> response = forgotPasswordService.sendOtp(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<VerifyOtpResponseDto>> verifyOtp(
            @Valid @RequestBody ForgotPasswordVerifyOtpRequestDto request) {
        ApiResponse<VerifyOtpResponseDto> response = forgotPasswordService.verifyOtp(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @Valid @RequestBody ForgotPasswordResendOtpRequestDto request) {
        ApiResponse<Void> response = forgotPasswordService.resendOtp(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<LoginResponseDto>> resetPassword(
            @Valid @RequestBody ForgotPasswordResetRequestDto request) {
        ApiResponse<LoginResponseDto> response = forgotPasswordService.resetPassword(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }
}
