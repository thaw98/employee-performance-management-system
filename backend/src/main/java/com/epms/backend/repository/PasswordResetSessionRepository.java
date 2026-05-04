package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.PasswordResetSession;

public interface PasswordResetSessionRepository extends JpaRepository<PasswordResetSession, Long> {

    Optional<PasswordResetSession> findByOtpSessionIdAndUsedFalse(String otpSessionId);

    Optional<PasswordResetSession> findByOtpSessionId(String otpSessionId);
}
