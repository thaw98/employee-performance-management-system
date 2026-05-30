package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.ContinuousFeedbackComment;

public interface ContinuousFeedbackCommentRepository extends JpaRepository<ContinuousFeedbackComment, Long> {

    List<ContinuousFeedbackComment> findByFeedbackIdOrderByCreatedAtAsc(Long feedbackId);

    List<ContinuousFeedbackComment> findByFeedbackIdAndVisibleToEmployeeTrueOrderByCreatedAtAsc(Long feedbackId);

    List<ContinuousFeedbackComment> findByAuthorEmployeeIdOrderByCreatedAtDesc(Long authorEmployeeId);
}
