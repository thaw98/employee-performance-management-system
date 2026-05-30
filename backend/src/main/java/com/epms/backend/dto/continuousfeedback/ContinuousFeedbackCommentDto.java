package com.epms.backend.dto.continuousfeedback;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedbackCommentDto {
    private Long commentId;
    private Long feedbackId;
    private Long authorEmployeeId;
    private String authorEmployeeName;
    private String commentText;
    private String commentType;
    private boolean visibleToEmployee;
    private Instant createdAt;
}
