package com.epms.backend.repository;

import com.epms.backend.entity.FeedbackTemplateConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackTemplateConfigRepository extends JpaRepository<FeedbackTemplateConfig, Long> {
    List<FeedbackTemplateConfig> findByReviewCycleId(Long reviewCycleId);

    List<FeedbackTemplateConfig> findByReviewCycleIdOrReviewCycleIdIsNull(Long reviewCycleId);
}
