package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmployeeReportingHistory;

public interface EmployeeReportingHistoryRepository extends JpaRepository<EmployeeReportingHistory, Long> {

    Optional<EmployeeReportingHistory> findByEmployee_IdAndCurrentTrue(Long employeeId);

    boolean existsByEmployee_IdAndCurrentTrue(Long employeeId);

    List<EmployeeReportingHistory> findByEmployee_IdOrderByEffectiveStartDateDesc(Long employeeId);
}
