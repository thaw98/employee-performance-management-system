package com.epms.backend.repository;

import com.epms.backend.entity.FeedbackChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackChatMessageRepository extends JpaRepository<FeedbackChatMessage, Long> {
    List<FeedbackChatMessage> findByFeedback_IdOrderByCreatedDateAsc(Long feedbackId);
}
