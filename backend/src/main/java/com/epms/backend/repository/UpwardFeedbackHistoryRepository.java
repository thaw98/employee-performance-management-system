package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.UpwardFeedbackHistory;

public interface UpwardFeedbackHistoryRepository extends JpaRepository<UpwardFeedbackHistory, Long> {

    List<UpwardFeedbackHistory> findByFeedbackIdOrderByCreatedAtAsc(Long feedbackId);
}
