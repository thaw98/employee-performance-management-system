package com.epms.backend.repository;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.SelfAssessmentForm;
import com.epms.backend.entity.SelfAssessmentFormStatus;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import com.epms.backend.entity.ReviewCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SelfAssessmentFormRepository extends JpaRepository<SelfAssessmentForm, Long> {

    Optional<SelfAssessmentForm> findByEmployeeAndCycle(Employee employee, ReviewCycle cycle);

    List<SelfAssessmentForm> findByEmployee(Employee employee);

    @Query("SELECT f FROM SelfAssessmentForm f WHERE f.employee.department.id = :departmentId AND f.cycle = :cycle")
    List<SelfAssessmentForm> findByDepartmentAndCycle(@Param("departmentId") Long departmentId, @Param("cycle") ReviewCycle cycle);

    @Query("""
            SELECT DISTINCT f
            FROM SelfAssessmentForm f
            JOIN f.employee e
            WHERE (e.manager.id = :managerId OR e.department.managerId = :managerId)
              AND f.cycle = :cycle
            """)
    List<SelfAssessmentForm> findByManagerAndCycle(@Param("managerId") Long managerId, @Param("cycle") ReviewCycle cycle);

    @Query("SELECT f FROM SelfAssessmentForm f WHERE f.status = :status AND f.cycle = :cycle")
    List<SelfAssessmentForm> findByStatusAndCycle(@Param("status") SelfAssessmentFormStatus status, @Param("cycle") ReviewCycle cycle);

    List<SelfAssessmentForm> findByCycleOrderByCreatedDateDesc(ReviewCycle cycle);

    boolean existsByCycle(ReviewCycle cycle);

    List<SelfAssessmentForm> findByTemplate(SelfAssessmentFormTemplate template);

    boolean existsByTemplate(SelfAssessmentFormTemplate template);

    boolean existsByEmployeeAndCycle(Employee employee, ReviewCycle cycle);
}
