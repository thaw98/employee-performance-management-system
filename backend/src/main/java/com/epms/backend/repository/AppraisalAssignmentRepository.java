package com.epms.backend.repository;

import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppraisalAssignmentRepository extends JpaRepository<AppraisalAssignment, Long> {
    List<AppraisalAssignment> findByStatus(AppraisalStatus status);
    List<AppraisalAssignment> findByEmployeeId(Long employeeId);
    java.util.Optional<AppraisalAssignment> findByEmployee_IdAndPeriod_Id(Long employeeId, Long periodId);
    java.util.Optional<AppraisalAssignment> findByEmployee_IdAndPeriod_Name(Long employeeId, String periodName);
    List<AppraisalAssignment> findByEvaluator_IdAndStatus(Long evaluatorId, AppraisalStatus status);
    List<AppraisalAssignment> findByEvaluator_Id(Long evaluatorId);

    @Query("""
            SELECT COUNT(DISTINCT a.employee.id)
            FROM AppraisalAssignment a
            WHERE LOWER(a.period.status) = 'active'
            """)
    long countEmployeesInActiveCycle();

    @Query("""
            SELECT COUNT(a)
            FROM AppraisalAssignment a
            WHERE LOWER(a.period.status) = 'active'
            """)
    long countActiveCycleAssignments();

    @Query("""
            SELECT COUNT(a)
            FROM AppraisalAssignment a
            WHERE LOWER(a.period.status) = 'active'
              AND a.status IN :statuses
            """)
    long countActiveCycleAssignmentsByStatusIn(@Param("statuses") List<AppraisalStatus> statuses);

    @Query("""
            SELECT COUNT(a)
            FROM AppraisalAssignment a
            WHERE LOWER(a.period.status) = 'active'
              AND a.status IN :statuses
              AND a.period.endDate < :today
            """)
    long countOverdueActiveCycleAssignments(
            @Param("statuses") List<AppraisalStatus> statuses,
            @Param("today") LocalDate today);
}
