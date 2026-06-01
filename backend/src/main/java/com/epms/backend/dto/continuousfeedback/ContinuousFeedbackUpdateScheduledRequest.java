package com.epms.backend.dto.continuousfeedback;

import java.time.Instant;

import lombok.Data;

@Data
public class ContinuousFeedbackUpdateScheduledRequest {
    private String feedbackMessage;
    private String privateManagerNote;
    private String category;
    private Instant scheduledPublishAt;
}
