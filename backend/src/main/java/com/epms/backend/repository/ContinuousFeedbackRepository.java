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
}
