package com.epms.backend.dto.continuousfeedback;

import lombok.Data;

@Data
public class ContinuousFeedbackCreateRequest {
    private Long employeeId;
    private String category;
    private String feedbackMessage;
    private String privateManagerNote;
    private boolean shareImmediately;
}
