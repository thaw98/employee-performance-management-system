package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmployeeImportSession;

public interface EmployeeImportSessionRepository extends JpaRepository<EmployeeImportSession, Long> {
    Optional<EmployeeImportSession> findByValidationId(String validationId);
}
