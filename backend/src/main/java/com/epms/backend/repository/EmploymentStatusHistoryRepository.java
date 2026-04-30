package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmploymentStatusHistory;

public interface EmploymentStatusHistoryRepository extends JpaRepository<EmploymentStatusHistory, Long> {
    List<EmploymentStatusHistory> findByEmployee_IdOrderByEffectiveDateDescChangedAtDesc(Long employeeId);
}
