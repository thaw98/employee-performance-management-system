package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.ContinuousFeedbackPipLink;

public interface ContinuousFeedbackPipLinkRepository extends JpaRepository<ContinuousFeedbackPipLink, Long> {

    List<ContinuousFeedbackPipLink> findByFeedbackId(Long feedbackId);

    Optional<ContinuousFeedbackPipLink> findByFeedbackIdAndPipId(Long feedbackId, Long pipId);

    boolean existsByFeedbackIdAndPipId(Long feedbackId, Long pipId);
}
