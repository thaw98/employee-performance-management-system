package com.epms.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordResetRequestDto {

    @NotBlank(message = "Email is required.")
    @Email(message = "Please enter a valid email address.")
    private String email;

    @NotBlank(message = "OTP session is required.")
    private String otpSessionId;

    @NotBlank(message = "New password is required.")
    private String newPassword;

    @NotBlank(message = "Confirm password is required.")
    private String confirmPassword;
}
