package com.epms.backend.repository;

import com.epms.backend.entity.FeedbackChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackChatMessageRepository extends JpaRepository<FeedbackChatMessage, Long> {
    List<FeedbackChatMessage> findByFeedback_IdOrderByCreatedDateAsc(Long feedbackId);
}
