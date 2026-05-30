package com.epms.backend.dto.continuousfeedback;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedbackPipWarningDto {
    private boolean warningActive;
    private long negativeFeedbackCount;
    private String message;
    private Long latestFeedbackId;
}
