package com.epms.backend.repository;

import com.epms.backend.entity.SelfAssessmentFormTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public interface SelfAssessmentFormTemplateRepository extends JpaRepository<SelfAssessmentFormTemplate, Long> {

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle.id = :reviewCycleId")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPositionAndReviewCycleId(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId,
            @Param("reviewCycleId") Long reviewCycleId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle.id = :reviewCycleId AND t.id <> :excludeId")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPositionAndReviewCycleIdExcluding(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId,
            @Param("reviewCycleId") Long reviewCycleId,
            @Param("excludeId") Long excludeId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle IS NULL AND t.manualStartDate IS NULL AND t.manualEndDate IS NULL")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPositionWithNullReviewCycle(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle IS NULL AND t.manualStartDate IS NULL AND t.manualEndDate IS NULL AND t.id <> :excludeId")
    Optional<SelfAssessmentFormTemplate> findActiveByDepartmentAndPositionWithNullReviewCycleExcluding(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId,
            @Param("excludeId") Long excludeId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle IS NULL AND t.manualStartDate = :manualStartDate AND t.manualEndDate = :manualEndDate")
    Optional<SelfAssessmentFormTemplate> findActiveManualByDepartmentAndPositionAndDateRange(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId,
            @Param("manualStartDate") LocalDate manualStartDate,
            @Param("manualEndDate") LocalDate manualEndDate);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.department.id = :departmentId AND t.position.id = :positionId AND t.isActive = true AND t.reviewCycle IS NULL AND t.manualStartDate = :manualStartDate AND t.manualEndDate = :manualEndDate AND t.id <> :excludeId")
    Optional<SelfAssessmentFormTemplate> findActiveManualByDepartmentAndPositionAndDateRangeExcluding(
            @Param("departmentId") Long departmentId,
            @Param("positionId") Long positionId,
            @Param("manualStartDate") LocalDate manualStartDate,
            @Param("manualEndDate") LocalDate manualEndDate,
            @Param("excludeId") Long excludeId);

    @Query("SELECT t FROM SelfAssessmentFormTemplate t WHERE t.reviewCycle.id = :reviewCycleId AND t.isActive = true")
    List<SelfAssessmentFormTemplate> findActiveByReviewCycleId(@Param("reviewCycleId") Long reviewCycleId);
}
