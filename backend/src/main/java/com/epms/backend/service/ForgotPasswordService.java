package com.epms.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AuthUserDto;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.dto.auth.ForgotPasswordResetRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordResendOtpRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordSendOtpRequestDto;
import com.epms.backend.dto.auth.ForgotPasswordVerifyOtpRequestDto;
import com.epms.backend.dto.auth.VerifyOtpResponseDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.PasswordResetOtp;
import com.epms.backend.entity.PasswordResetSession;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PasswordResetOtpRepository;
import com.epms.backend.repository.PasswordResetSessionRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.JwtService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordResetSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int SESSION_EXPIRY_MINUTES = 15;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ───── Send OTP ─────

    @Transactional
    public ApiResponse<Void> sendOtp(ForgotPasswordSendOtpRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();

        if (!employeeRepository.existsByEmailIgnoreCase(email)) {
            log.info("Forgot password: email not found – {}", email);
            return ApiResponse.fail("Email does not exist in the system.");
        }

        // Deactivate any previous active OTPs
        otpRepository.deactivateAllActiveByEmail(email);

        String otpCode = generateOtp();

        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail(email);
        otp.setOtpCode(otpCode);
        otp.setCreatedAt(Instant.now());
        otp.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        otpRepository.save(otp);

        sendOtpEmail(email, otpCode);
        log.info("Forgot password OTP sent to {}", email);

        return ApiResponse.ok("OTP sent successfully.", null);
    }

    // ───── Verify OTP ─────

    @Transactional
    public ApiResponse<VerifyOtpResponseDto> verifyOtp(ForgotPasswordVerifyOtpRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        var otpRecord = otpRepository
                .findTopByEmailIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(email);

        if (otpRecord.isEmpty()) {
            log.warn("Forgot password verify: no active OTP for {}", email);
            return ApiResponse.fail("No active OTP found. Please request a new one.");
        }

        PasswordResetOtp record = otpRecord.get();

        if (record.isUsed()) {
            log.warn("Forgot password verify: OTP already used for {}", email);
            return ApiResponse.fail("OTP has already been used.");
        }

        if (Instant.now().isAfter(record.getExpiresAt())) {
            log.warn("Forgot password verify: OTP expired for {}", email);
            record.setActive(false);
            otpRepository.save(record);
            return ApiResponse.fail("OTP has expired. Please resend a new OTP.");
        }

        if (!record.getOtpCode().equals(otp)) {
            log.warn("Forgot password verify: invalid OTP for {}", email);
            return ApiResponse.fail("Invalid OTP.");
        }

        // Mark OTP as verified
        record.setVerified(true);
        record.setVerifiedAt(Instant.now());
        otpRepository.save(record);

        // Create OTP session
        String sessionId = UUID.randomUUID().toString();
        PasswordResetSession session = new PasswordResetSession();
        session.setEmail(email);
        session.setOtpSessionId(sessionId);
        session.setCreatedAt(Instant.now());
        session.setExpiresAt(Instant.now().plus(SESSION_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        sessionRepository.save(session);

        log.info("Forgot password OTP verified for {}", email);
        return ApiResponse.ok("OTP verified successfully.", new VerifyOtpResponseDto(sessionId));
    }

    // ───── Resend OTP ─────

    @Transactional
    public ApiResponse<Void> resendOtp(ForgotPasswordResendOtpRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();

        if (!employeeRepository.existsByEmailIgnoreCase(email)) {
            log.info("Forgot password resend: email not found – {}", email);
            return ApiResponse.fail("Email does not exist in the system.");
        }

        // Deactivate previous OTPs
        otpRepository.deactivateAllActiveByEmail(email);

        String otpCode = generateOtp();

        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail(email);
        otp.setOtpCode(otpCode);
        otp.setCreatedAt(Instant.now());
        otp.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        otpRepository.save(otp);

        sendOtpEmail(email, otpCode);
        log.info("Forgot password OTP resent to {}", email);

        return ApiResponse.ok("A new OTP has been sent successfully.", null);
    }

    // ───── Reset Password ─────

    @Transactional
    public ApiResponse<LoginResponseDto> resetPassword(ForgotPasswordResetRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return ApiResponse.fail("Passwords do not match.");
        }

        // Validate session
        var sessionOpt = sessionRepository.findByOtpSessionIdAndUsedFalse(request.getOtpSessionId());
        if (sessionOpt.isEmpty()) {
            log.warn("Forgot password reset: invalid or used session for {}", email);
            return ApiResponse.fail("Invalid or expired password reset session.");
        }

        PasswordResetSession session = sessionOpt.get();

        if (Instant.now().isAfter(session.getExpiresAt())) {
            log.warn("Forgot password reset: session expired for {}", email);
            session.setUsed(true);
            sessionRepository.save(session);
            return ApiResponse.fail("Password reset session has expired. Please start over.");
        }

        if (!session.getEmail().equalsIgnoreCase(email)) {
            log.warn("Forgot password reset: session email mismatch for {}", email);
            return ApiResponse.fail("Invalid password reset session.");
        }

        // Find user account via employee email
        User user = userRepository.findFirstByEmployee_EmailIgnoreCaseOrderByActiveDescIdAsc(email)
                .orElse(null);

        if (user == null) {
            log.warn("Forgot password reset: no user account for email {}", email);
            return ApiResponse.fail("No account found for this email.");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        // Mark session as used
        session.setUsed(true);
        sessionRepository.save(session);

        // Mark related OTP as used/inactive
        otpRepository.findTopByEmailIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(email)
                .ifPresent(otp -> {
                    otp.setUsed(true);
                    otp.setActive(false);
                    otpRepository.save(otp);
                });

        // Auto-login: generate JWT and return the same login response shape
        String token = jwtService.generateToken(user);
        Employee emp = user.getEmployee();
        String employeeIdStr = emp.getEmployeeId();
        if (employeeIdStr == null || employeeIdStr.isBlank()) {
            employeeIdStr = String.valueOf(emp.getId());
        }

        AuthUserDto authUser = AuthUserDto.builder()
                .id(user.getId())
                .employeeId(employeeIdStr)
                .name(emp.getEmployeeName())
                .email(emp.getEmail())
                .role(user.getRole().getName())
                .roleId(user.getRole().getId())
                .mustChangePassword(false)
                .build();

        LoginResponseDto loginResponse = new LoginResponseDto();
        loginResponse.setToken(token);
        loginResponse.setTokenType("Bearer");
        loginResponse.setExpiresAt(jwtService.calculateExpirationInstant());
        loginResponse.setUser(authUser);

        log.info("Forgot password reset successful + auto-login for {}", email);
        return ApiResponse.ok("Password reset successful.", loginResponse);
    }

    // ───── Helpers ─────

    private String generateOtp() {
        int code = 100_000 + RANDOM.nextInt(900_000);
        return String.valueOf(code);
    }

    private void sendOtpEmail(String to, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("EPMS Password Reset OTP");
            helper.setText(buildOtpEmailBody(otpCode), false);
            mailSender.send(message);
        } catch (MessagingException ex) {
            log.error("Failed to send OTP email to {}: {}", to, ex.getMessage());
            throw new IllegalStateException("Failed to send OTP email: " + ex.getMessage(), ex);
        }
    }

    private static String buildOtpEmailBody(String otpCode) {
        return """
                Hello,

                Your EPMS password reset OTP is: %s

                This OTP will expire in %d minutes.
                If you did not request this password reset, please ignore this email.

                Thank you,
                EPMS Team
                """.formatted(otpCode, OTP_EXPIRY_MINUTES);
    }
}
