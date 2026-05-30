package com.epms.backend.dto.continuousfeedback;

import java.time.Instant;

import lombok.Data;

@Data
public class CreateFollowUpMeetingFromFeedbackRequest {
    private Instant scheduledTime;
    private Integer durationMinutes;
    private String description;
}
