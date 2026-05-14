package com.epms.backend.repository;

import com.epms.backend.entity.FeedbackDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackDraftRepository extends JpaRepository<FeedbackDraft, Long> {
    Optional<FeedbackDraft> findByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(
            Long evaluatorId,
            Long evaluateeId,
            String role,
            Long reviewCycleId
    );

    void deleteByEvaluatorIdAndEvaluateeIdAndRoleAndReviewCycleId(
            Long evaluatorId,
            Long evaluateeId,
            String role,
            Long reviewCycleId
    );

    List<FeedbackDraft> findByEvaluatorIdAndReviewCycleIdOrderByUpdatedAtDesc(Long evaluatorId, Long reviewCycleId);

    Optional<FeedbackDraft> findByIdAndEvaluatorId(Long id, Long evaluatorId);

    long deleteByReviewCycle_EndDateBefore(LocalDate date);
}
