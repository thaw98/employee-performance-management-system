package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.ContinuousFeedbackMeetingLink;

public interface ContinuousFeedbackMeetingLinkRepository extends JpaRepository<ContinuousFeedbackMeetingLink, Long> {

    List<ContinuousFeedbackMeetingLink> findByFeedbackId(Long feedbackId);

    Optional<ContinuousFeedbackMeetingLink> findByFeedbackIdAndMeetingId(Long feedbackId, Long meetingId);

    boolean existsByFeedbackIdAndMeetingId(Long feedbackId, Long meetingId);
}
