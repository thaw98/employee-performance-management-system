package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.AuditLog;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
    List<AuditLog> findByTargetTypeInOrderByCreatedAtDesc(List<String> targetTypes);
    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
