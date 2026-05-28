package com.epms.backend.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class FeedbackDraftDto {
    private Long id;
    private Long evaluateeId;
    private String evaluateeName;
    private String evaluateeStaffNo;
    private String evaluateeLevelCode;
    private String evaluateePosition;
    private String evaluateeDepartment;
    private String role;
    private Boolean anonymous;
    private String additionalComments;
    private Long reviewCycleId;
    private String reviewCycleName;
    private Instant updatedAt;
    private List<FeedbackSubmissionRequest.FeedbackDetailRequest> details;
}
