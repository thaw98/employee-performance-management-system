package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.epms.backend.entity.PasswordResetOtp;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailIgnoreCaseAndActiveTrueOrderByCreatedAtDesc(String email);

    @Modifying
    @Query("UPDATE PasswordResetOtp o SET o.active = false WHERE LOWER(o.email) = LOWER(:email) AND o.active = true")
    void deactivateAllActiveByEmail(String email);

    List<PasswordResetOtp> findAllByEmailIgnoreCaseAndActiveTrue(String email);
}
