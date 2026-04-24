// EmployeeKpiAssignmentRepository.java - Complete version
package com.epms.backend.repository;

import com.epms.backend.entity.EmployeeKpiAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeKpiAssignmentRepository extends JpaRepository<EmployeeKpiAssignment, Long> {
    
    // Find by employee ID and period ID
    List<EmployeeKpiAssignment> findByEmployeeIdAndPeriodId(Long employeeId, Long periodId);
    
    // Find by employee ID, period ID, and position KPI ID
    @Query("SELECT a FROM EmployeeKpiAssignment a WHERE a.employee.id = :employeeId AND a.period.id = :periodId AND a.positionKpi.id = :positionKpiId")
    Optional<EmployeeKpiAssignment> findByEmployeeIdAndPeriodIdAndPositionKpiId(
            @Param("employeeId") Long employeeId, 
            @Param("periodId") Long periodId, 
            @Param("positionKpiId") Long positionKpiId);
    
    // Find by employee ID
    List<EmployeeKpiAssignment> findByEmployeeId(Long employeeId);
    
    // Find by period ID
    List<EmployeeKpiAssignment> findByPeriodId(Long periodId);
    
    // Find by employee ID and status
    List<EmployeeKpiAssignment> findByEmployeeIdAndStatus(Long employeeId, String status);
    
    // Find by period ID and status
    List<EmployeeKpiAssignment> findByPeriodIdAndStatus(Long periodId, String status);
    
    // Find by employee ID and isLocked
    List<EmployeeKpiAssignment> findByEmployeeIdAndIsLocked(Long employeeId, Boolean isLocked);
    
    // Find by period ID and isLocked
    List<EmployeeKpiAssignment> findByPeriodIdAndIsLocked(Long periodId, Boolean isLocked);
    
    // Delete by employee ID and period ID
    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeKpiAssignment a WHERE a.employee.id = :employeeId AND a.period.id = :periodId")
    void deleteByEmployeeIdAndPeriodId(@Param("employeeId") Long employeeId, @Param("periodId") Long periodId);
    
    // Delete by employee ID
    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeKpiAssignment a WHERE a.employee.id = :employeeId")
    void deleteByEmployeeId(@Param("employeeId") Long employeeId);
    
    // Count by employee ID and period ID
    long countByEmployeeIdAndPeriodId(Long employeeId, Long periodId);
    
    // Get total weight sum for employee in a period
    @Query("SELECT COALESCE(SUM(a.positionKpi.weight), 0) FROM EmployeeKpiAssignment a WHERE a.employee.id = :employeeId AND a.period.id = :periodId")
    BigDecimal getTotalWeightByEmployeeAndPeriod(@Param("employeeId") Long employeeId, @Param("periodId") Long periodId);
    
    // Get total weighted score sum for employee in a period
    @Query("SELECT COALESCE(SUM(a.weightedScore), 0) FROM EmployeeKpiAssignment a WHERE a.employee.id = :employeeId AND a.period.id = :periodId")
    BigDecimal getTotalScoreByEmployeeAndPeriod(@Param("employeeId") Long employeeId, @Param("periodId") Long periodId);
    
    // Find assignments that need score calculation (actual value present but score null)
    @Query("SELECT a FROM EmployeeKpiAssignment a WHERE a.actualValue IS NOT NULL AND a.score IS NULL AND a.isLocked = false")
    List<EmployeeKpiAssignment> findUnscoredAssignments();
    
    // Find by position KPI ID
    List<EmployeeKpiAssignment> findByPositionKpiId(Long positionKpiId);
    
    // Find by employee ID and period ID with eager fetching of positionKpi
    @Query("SELECT a FROM EmployeeKpiAssignment a JOIN FETCH a.positionKpi WHERE a.employee.id = :employeeId AND a.period.id = :periodId")
    List<EmployeeKpiAssignment> findByEmployeeIdAndPeriodIdWithKpi(@Param("employeeId") Long employeeId, @Param("periodId") Long periodId);
}