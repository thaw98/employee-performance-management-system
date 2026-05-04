package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    java.util.List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
}
