package com.epms.backend.repository;

import com.epms.backend.entity.EmployeeKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KpiRepository extends JpaRepository<EmployeeKpi, Long> {
    @Query("SELECT k FROM EmployeeKpi k WHERE k.employee.id = :employeeId AND k.period = :period AND k.recordStatus = 'Active'")
    List<EmployeeKpi> findByEmployee_IdAndPeriod(Long employeeId, String period);

    List<EmployeeKpi> findByEmployee_IdAndPeriodAndRecordStatus(Long employeeId, String period, String recordStatus);

    @Query(value = "SELECT DISTINCT period FROM employeekpis WHERE employee_id = :employeeId AND record_status = 'Active' ORDER BY period DESC", nativeQuery = true)
    List<String> findDistinctPeriodsByEmployee_IdOrderByPeriodDesc(Long employeeId);

    @Query(value = "SELECT DISTINCT period FROM employeekpis WHERE employee_id = :employeeId AND record_status = 'Active' ORDER BY period DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLatestPeriodByEmployee_Id(Long employeeId);

    @Query(value = "SELECT MAX(updated_date) FROM employeekpis WHERE employee_id = :employeeId AND record_status = 'Active'", nativeQuery = true)
    Optional<java.time.Instant> findLatestUpdatedDateByEmployeeId(Long employeeId);

    @Query("SELECT DISTINCT k.employee.id FROM EmployeeKpi k WHERE k.employee.id IN :employeeIds AND k.period = :period AND k.recordStatus = 'Active'")
    List<Long> findEmployeeIdsWithActiveKpis(List<Long> employeeIds, String period);
}
