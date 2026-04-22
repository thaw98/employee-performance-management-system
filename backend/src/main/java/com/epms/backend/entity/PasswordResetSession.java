package com.epms.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "password_reset_session", indexes = {
        @Index(name = "idx_prs_email", columnList = "email"),
        @Index(name = "idx_prs_session_id", columnList = "otp_session_id", unique = true),
        @Index(name = "idx_prs_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "otp_session_id", nullable = false, unique = true, length = 255)
    private String otpSessionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "is_used", nullable = false)
    private boolean used = false;
}
