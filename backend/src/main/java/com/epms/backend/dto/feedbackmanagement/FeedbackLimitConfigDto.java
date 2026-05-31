package com.epms.backend.dto.feedbackmanagement;

import lombok.Data;

import java.time.Instant;

@Data
public class FeedbackLimitConfigDto {
    private Long id;
    private String relationshipType;
    private Long reviewCycleId;
    private String reviewCycleName;
    private Integer minimumCount;
    private Integer maximumCount;
    private Instant createdDate;
    private Instant updatedDate;
}
