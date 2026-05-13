package com.epms.backend.repository;

import com.epms.backend.entity.DepartmentKpi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentKpiRepository extends JpaRepository<DepartmentKpi, Long> {
    @Query("SELECT k FROM DepartmentKpi k WHERE k.department.id = :departmentId AND k.period = :period AND k.recordStatus = 'Active'")
    List<DepartmentKpi> findByDepartmentIdAndPeriod(Long departmentId, String period);

    List<DepartmentKpi> findByRecordStatus(String recordStatus);

    List<DepartmentKpi> findByDepartmentIdAndPeriodAndRecordStatus(Long departmentId, String period, String recordStatus);

    @Query("SELECT DISTINCT k.department.id FROM DepartmentKpi k WHERE k.period = :period AND k.recordStatus = 'Active'")
    java.util.Set<Long> findDistinctDeptWithActiveKpis(String period);

    @Query("SELECT k FROM DepartmentKpi k WHERE (:departmentId IS NULL OR k.department.id = :departmentId) AND (:period IS NULL OR k.period = :period) ORDER BY k.createdDate DESC")
    List<DepartmentKpi> findHistory(Long departmentId, String period);
}
