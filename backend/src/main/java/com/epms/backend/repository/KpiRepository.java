package com.epms.backend.repository;

import com.epms.backend.entity.EmployeeKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KpiRepository extends JpaRepository<EmployeeKpi, Long> {
    List<EmployeeKpi> findByEmployee_IdAndPeriod(Long employeeId, String period);

    @Query(value = "SELECT DISTINCT period FROM employee_kpi WHERE employee_id = :employeeId ORDER BY period DESC", nativeQuery = true)
    List<String> findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(Long employeeId);

    @Query(value = "SELECT DISTINCT period FROM employee_kpi WHERE employee_id = :employeeId ORDER BY period DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLatestPeriodByEmployee_Id(Long employeeId);
}
