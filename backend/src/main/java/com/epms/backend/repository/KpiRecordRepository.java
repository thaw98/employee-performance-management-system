package com.epms.backend.repository;

import com.epms.backend.entity.KpiRecord;
import com.epms.backend.entity.KpiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface KpiRecordRepository extends JpaRepository<KpiRecord, Long> {
    
    // Find by employee ID
    List<KpiRecord> findByEmployeeId(Long employeeId);
    
    // Find by employee ID and period ID
    List<KpiRecord> findByEmployeeIdAndPeriodId(Long employeeId, Long periodId);
    
    // Find by employee ID and status
    List<KpiRecord> findByEmployeeIdAndStatus(Long employeeId, KpiStatus status);
    
    // Find by employee, period, and KPI name
    @Query("SELECT k FROM KpiRecord k WHERE k.employee.id = :employeeId AND k.periodId = :periodId AND k.kpi = :kpiName")
    List<KpiRecord> findByEmployeeIdAndPeriodIdAndKpi(@Param("employeeId") Long employeeId, 
                                                       @Param("periodId") Long periodId, 
                                                       @Param("kpiName") String kpiName);
    
    // Find by employee ID with optional period
    @Query("SELECT k FROM KpiRecord k WHERE k.employee.id = :employeeId AND (:periodId IS NULL OR k.periodId = :periodId)")
    List<KpiRecord> findByEmployeeIdAndOptionalPeriod(@Param("employeeId") Long employeeId, 
                                                       @Param("periodId") Long periodId);
    
    // Delete by employee ID
    @Modifying
    @Transactional
    @Query("DELETE FROM KpiRecord k WHERE k.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
    
    // Find by status
    List<KpiRecord> findByStatus(KpiStatus status);
    
    // Find locked records
    @Query("SELECT k FROM KpiRecord k WHERE k.status = 'LOCKED'")
    List<KpiRecord> findLockedRecords();
    
    // Get total weight sum for employee
    @Query("SELECT COALESCE(SUM(k.weight), 0) FROM KpiRecord k WHERE k.employee.id = :employeeId AND (:periodId IS NULL OR k.periodId = :periodId)")
    Double getTotalWeightByEmployee(@Param("employeeId") Long employeeId, @Param("periodId") Long periodId);
}