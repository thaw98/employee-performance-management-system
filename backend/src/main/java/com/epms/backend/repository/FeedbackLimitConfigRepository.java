package com.epms.backend.repository;

import com.epms.backend.entity.FeedbackLimitConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedbackLimitConfigRepository extends JpaRepository<FeedbackLimitConfig, Long> {
    List<FeedbackLimitConfig> findByReviewCycleId(Long reviewCycleId);

    List<FeedbackLimitConfig> findByReviewCycleIdOrReviewCycleIdIsNull(Long reviewCycleId);

    Optional<FeedbackLimitConfig> findByReviewCycleIdAndRelationshipType(Long reviewCycleId, String relationshipType);
}
