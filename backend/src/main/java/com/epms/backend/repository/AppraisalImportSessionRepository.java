package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.AppraisalImportSession;

public interface AppraisalImportSessionRepository extends JpaRepository<AppraisalImportSession, Long> {
    Optional<AppraisalImportSession> findByValidationId(String validationId);
}
