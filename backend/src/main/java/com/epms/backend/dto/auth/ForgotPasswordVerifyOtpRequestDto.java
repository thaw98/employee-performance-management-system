package com.epms.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordVerifyOtpRequestDto {

    @NotBlank(message = "Email is required.")
    @Email(message = "Please enter a valid email address.")
    private String email;

    @NotBlank(message = "OTP is required.")
    @Size(min = 6, max = 6, message = "OTP must be 6 digits.")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits.")
    private String otp;
}
