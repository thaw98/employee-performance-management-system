package com.epms.backend.dto.continuousfeedback;

import lombok.Data;

@Data
public class ContinuousFeedbackCommentRequest {
    private String commentText;
    private boolean visibleToEmployee;
}
