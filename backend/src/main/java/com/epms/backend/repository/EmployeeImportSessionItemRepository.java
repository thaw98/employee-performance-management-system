package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmployeeImportSessionItem;

public interface EmployeeImportSessionItemRepository extends JpaRepository<EmployeeImportSessionItem, Long> {
    List<EmployeeImportSessionItem> findBySessionIdOrderByRowNumber(Long sessionId);
    List<EmployeeImportSessionItem> findBySessionIdAndStatusOrderByRowNumber(Long sessionId, String status);
}
