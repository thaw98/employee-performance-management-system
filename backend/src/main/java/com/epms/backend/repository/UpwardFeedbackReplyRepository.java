package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.UpwardFeedbackReply;

public interface UpwardFeedbackReplyRepository extends JpaRepository<UpwardFeedbackReply, Long> {

    List<UpwardFeedbackReply> findByFeedbackIdOrderByCreatedAtAsc(Long feedbackId);
}
