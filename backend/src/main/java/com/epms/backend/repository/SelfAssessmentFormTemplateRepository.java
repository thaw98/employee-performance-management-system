package com.epms.backend.repository;

import com.epms.backend.entity.Department;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.SelfAssessmentFormTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SelfAssessmentFormTemplateRepository extends JpaRepository<SelfAssessmentFormTemplate, Long> {

    Optional<SelfAssessmentFormTemplate> findByDepartmentAndPositionAndIsActiveTrue(Department department, Position position);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPosition(@Param("departmentId") Long departmentId, @Param("positionId") Long positionId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.id <> :excludeId")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPositionExcluding(@Param("departmentId") Long departmentId, @Param("positionId") Long positionId, @Param("excludeId") Long excludeId);
}