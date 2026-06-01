package com.epms.backend.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.ContinuousFeedback;
import com.epms.backend.entity.ContinuousFeedbackVisibilityStatus;

public interface ContinuousFeedbackRepository extends JpaRepository<ContinuousFeedback, Long> {

    List<ContinuousFeedback> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<ContinuousFeedback> findByManagerIdOrderByCreatedAtDesc(Long managerId);

    List<ContinuousFeedback> findByEmployeeIdAndSharedTrueOrderByCreatedAtDesc(Long employeeId);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.employee.id = :employeeId AND cf.shared = true ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findSharedByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.manager.id = :managerId AND cf.shared = true ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findSharedByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT COUNT(cf) FROM ContinuousFeedback cf WHERE cf.employee.id = :employeeId "
            + "AND cf.category IN ('IMPROVEMENT_NEEDED', 'PERFORMANCE_RISK') "
            + "AND cf.createdAt >= :since")
    long countNegativeFeedbackSince(@Param("employeeId") Long employeeId, @Param("since") Instant since);

    @Query("SELECT cf.category, COUNT(cf) FROM ContinuousFeedback cf GROUP BY cf.category")
    List<Object[]> countByCategory();

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.employee.id = :employeeId "
            + "AND cf.supportingEvidence = true "
            + "AND cf.createdAt >= :startDate AND cf.createdAt <= :endDate "
            + "ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findEvidenceByEmployeeAndDateRange(
            @Param("employeeId") Long employeeId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.visibilityStatus = :status "
            + "OR cf.shared = true ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findByVisibilityStatusOrSharedOrderByCreatedAtDesc(
            @Param("status") ContinuousFeedbackVisibilityStatus status);

    List<ContinuousFeedback> findByEmployeeIdAndManagerIdAndSharedTrueOrderByCreatedAtDesc(
            Long employeeId, Long managerId);

    List<ContinuousFeedback> findBySharedTrueOrderByCreatedAtDesc();

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.visibilityStatus = :status AND cf.scheduledPublishAt <= :now AND cf.shared = false ORDER BY cf.scheduledPublishAt ASC")
    List<ContinuousFeedback> findDueScheduledFeedback(
            @Param("status") ContinuousFeedbackVisibilityStatus status,
            @Param("now") Instant now);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.shared = true "
            + "AND (:employeeId IS NULL OR cf.employee.id = :employeeId) "
            + "AND (:category IS NULL OR cf.category = :category) "
            + "AND cf.createdAt >= :startDate AND cf.createdAt <= :endDate "
            + "ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findHistoryByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("employeeId") Long employeeId,
            @Param("category") String category);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.manager.id = :managerId AND cf.shared = true "
            + "AND (:category IS NULL OR cf.category = :category) "
            + "AND cf.createdAt >= :startDate AND cf.createdAt <= :endDate "
            + "ORDER BY cf.createdAt DESC")
    List<ContinuousFeedback> findHistoryByManagerAndDateRange(
            @Param("managerId") Long managerId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("category") String category);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.visibilityStatus = 'SCHEDULED' AND cf.manager.id = :managerId ORDER BY cf.scheduledPublishAt ASC")
    List<ContinuousFeedback> findScheduledByManagerId(@Param("managerId") Long managerId);

    @Query("SELECT cf FROM ContinuousFeedback cf WHERE cf.visibilityStatus = 'SCHEDULED' ORDER BY cf.scheduledPublishAt ASC")
    List<ContinuousFeedback> findAllScheduled();
}
